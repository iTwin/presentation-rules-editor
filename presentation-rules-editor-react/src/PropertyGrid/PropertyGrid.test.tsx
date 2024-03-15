/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import { expect } from "chai";
import * as React from "react";
import * as sinon from "sinon";
import { PropertyRecord, PropertyValueFormat, StandardTypeNames } from "@itwin/appui-abstract";
import * as componentsReact from "@itwin/components-react";
import { IModelConnection } from "@itwin/core-frontend";
import * as presentationComponents from "@itwin/presentation-components";
import { cleanup, render } from "@testing-library/react";
import { EditableRuleset } from "../EditableRuleset";
import { SinonStub, stubPresentationManager } from "../TestUtils";
import { AutoExpandingPropertyDataProvider, PropertyGrid, PropertyGridAttributes, PropertyGridProps } from "./PropertyGrid";

describe("PropertyGrid", () => {
  const commonProps: Omit<PropertyGridProps, "editableRuleset"> = {
    width: 100,
    height: 100,
    iModel: {} as IModelConnection,
  };

  const initialAutoExpandingPropertyDataProviderPrototype = Object.getPrototypeOf(AutoExpandingPropertyDataProvider);

  let stubUsePropertyGridModelSource: SinonStub<typeof componentsReact.useTrackedPropertyGridModelSource>;
  let stubUsePropertyDataProvider: SinonStub<typeof presentationComponents.usePropertyDataProviderWithUnifiedSelection>;
  let stubUsePropertyGridModel: SinonStub<typeof componentsReact.usePropertyGridModel>;
  let editableRuleset: EditableRuleset;

  beforeEach(() => {
    stubPresentationManager();

    stubUsePropertyGridModelSource = sinon.stub(componentsReact, "useTrackedPropertyGridModelSource");
    sinon.stub(componentsReact, "usePropertyGridEventHandler");
    sinon.stub(AutoExpandingPropertyDataProvider.prototype, "dispose");

    Object.setPrototypeOf(AutoExpandingPropertyDataProvider, Object);

    stubUsePropertyDataProvider = sinon.stub(presentationComponents, "usePropertyDataProviderWithUnifiedSelection");
    stubUsePropertyGridModel = sinon.stub(componentsReact, "usePropertyGridModel");
    editableRuleset = new EditableRuleset({ initialRuleset: { id: "", rules: [] } });
  });

  afterEach(() => {
    // React cleanup hooks need to run first before we restore stubs
    cleanup();

    editableRuleset.dispose();
    Object.setPrototypeOf(AutoExpandingPropertyDataProvider, initialAutoExpandingPropertyDataProviderPrototype);
    sinon.restore();
  });

  describe("normal state", () => {
    beforeEach(() => {
      sinon.stub(componentsReact, "VirtualizedPropertyGrid").callsFake(() => null);
      stubUsePropertyDataProvider.callsFake(() => ({ isOverLimit: false, numSelectedElements: 1 }));
      stubUsePropertyGridModel.callsFake(() => ({} as componentsReact.IPropertyGridModel));
    });

    it("renders with AutoExpandingPropertyDataProvider", () => {
      render(<PropertyGrid {...commonProps} editableRuleset={editableRuleset} />);
      expect(componentsReact.useTrackedPropertyGridModelSource).to.have.been
        .calledOnce
        .and.calledWithMatch(
          sinon.match(({ dataProvider }) => dataProvider instanceof AutoExpandingPropertyDataProvider),
        );
    });

    it("uses new dataProvider when ruleset updates", async () => {
      render(<PropertyGrid {...commonProps} editableRuleset={editableRuleset} />);
      await editableRuleset.updateRuleset({ id: "", rules: [] });
      expect(stubUsePropertyGridModelSource).to.have.been.calledTwice;
      expect(stubUsePropertyGridModelSource.firstCall.args[0].dataProvider)
        .not.to.be.equal(stubUsePropertyGridModelSource.secondCall.args[0].dataProvider);
    });
  });

  describe("no elements selected state", () => {
    beforeEach(() => {
      stubUsePropertyDataProvider.callsFake(() => ({ isOverLimit: false, numSelectedElements: 0 }));
    });

    it("renders supplied component", () => {
      const { getByText } = render(
        <PropertyGrid
          {...commonProps}
          editableRuleset={editableRuleset}
          noElementsSelectedState={() => <>Test Component</>}
        />,
      );
      expect(getByText("Test Component")).not.to.be.null;
    });

    it("renders default message when component is not supplied", () => {
      const { getByText } = render(<PropertyGrid {...commonProps} editableRuleset={editableRuleset} />);
      expect(getByText("No elements selected.")).not.to.be.null;
    });
  });

  describe("too many elements selected state", () => {
    beforeEach(() => {
      stubUsePropertyDataProvider.callsFake(() => ({ isOverLimit: true, numSelectedElements: 1 }));
    });

    it("renders supplied component", () => {
      const { getByText } = render(
        <PropertyGrid
          {...commonProps}
          editableRuleset={editableRuleset}
          tooManyElementsSelectedState={() => <>Test Component</>}
        />,
      );
      expect(getByText("Test Component")).not.to.be.null;
    });

    it("renders default message when too many elements are selected", () => {
      const { getByText } = render(<PropertyGrid {...commonProps} editableRuleset={editableRuleset} />);
      expect(getByText("Too many elements selected.")).not.to.be.null;
    });
  });

  describe("undefined property grid model state", () => {
    beforeEach(() => {
      stubUsePropertyDataProvider.callsFake(() => ({ isOverLimit: false, numSelectedElements: 1 }));
      stubUsePropertyGridModel.callsFake(() => undefined);
    });

    it("renders supplied component", () => {
      const { getByText } = render(
        <PropertyGrid
          {...commonProps}
          editableRuleset={editableRuleset}
          loadingPropertiesState={() => <>Test Component</>}
        />,
      );
      expect(getByText("Test Component")).not.to.be.null;
    });

    it("renders default message while property grid model is undefined", () => {
      const { getByText } = render(<PropertyGrid {...commonProps} editableRuleset={editableRuleset} />);
      expect(getByText("Loading properties...")).not.to.be.null;
    });
  });

  describe("imperative handle", () => {
    let propertyGridModel: componentsReact.MutablePropertyGridModel;

    beforeEach(() => {
      stubUsePropertyDataProvider.callsFake(() => ({ isOverLimit: false, numSelectedElements: 1 }));

      const stubModelSource = {
        modifyModel: sinon.fake((callback: any) => callback(propertyGridModel)),
      } as unknown as componentsReact.PropertyGridModelSource;

      stubUsePropertyGridModelSource.callsFake(() => ({ modelSource: stubModelSource, inProgress: false }));
    });

    beforeEach(() => {
      const propertyData: componentsReact.PropertyData = {
        label: new PropertyRecord(
          { valueFormat: PropertyValueFormat.Primitive },
          { name: "test", displayLabel: "test", typename: StandardTypeNames.String },
        ),
        categories: [
          {
            name: "root",
            label: "root",
            expand: undefined as unknown as boolean,
            childCategories: [
              { name: "child", label: "child", expand: undefined as unknown as boolean },
            ],
          },
        ],
        records: {},
      };

      propertyGridModel = new componentsReact.MutablePropertyGridModel(
        propertyData,
        new componentsReact.MutableGridItemFactory(),
      );
    });

    describe("expandAllCategories", () => {
      it("expands all nested categories", () => {
        const TestComponent = () => {
          const propertyGridRef = React.useRef<PropertyGridAttributes>(null);

          React.useEffect(() => propertyGridRef.current!.expandAllCategories(), []);

          return <PropertyGrid ref={propertyGridRef} {...commonProps} editableRuleset={editableRuleset} />;
        };

        render(<TestComponent />);
        expect(propertyGridModel.getItem("root").isExpanded).to.be.true;
        expect(propertyGridModel.getItem("root_child").isExpanded).to.be.true;
      });
    });

    describe("collapseAllCategories", () => {
      it("collapses all nested categories", () => {
        const TestComponent = () => {
          const propertyGridRef = React.useRef<PropertyGridAttributes>(null);

          React.useEffect(() => propertyGridRef.current!.collapseAllCategories(), []);

          return <PropertyGrid ref={propertyGridRef} {...commonProps} editableRuleset={editableRuleset} />;
        };

        render(<TestComponent />);
        expect(propertyGridModel.getItem("root").isExpanded).to.be.false;
        expect(propertyGridModel.getItem("root_child").isExpanded).to.be.false;
      });
    });
  });

  describe("keepCategoriesExpanded", () => {
    let propertyData: componentsReact.PropertyData;

    beforeEach(() => {
      stubUsePropertyDataProvider.callsFake(() => ({ isOverLimit: false, numSelectedElements: 1 }));

      propertyData = {
        label: new PropertyRecord(
          { valueFormat: PropertyValueFormat.Primitive },
          { name: "test", displayLabel: "test", typename: StandardTypeNames.String },
        ),
        categories: [
          {
            name: "root",
            label: "root",
            expand: true,
            childCategories: [
              { name: "child", label: "child", expand: false },
            ],
          },
        ],
        records: {},
      };
    });

    it("expands all nested categories when true", async () => {
      render(<PropertyGrid {...commonProps} editableRuleset={editableRuleset} keepCategoriesExpanded={true} />);
      expect(stubUsePropertyDataProvider).to.have.been.calledOnce;

      const { dataProvider } = stubUsePropertyDataProvider.firstCall.args[0];
      (dataProvider as any).getMemoizedData = async () => propertyData;

      const data = await dataProvider.getData();
      expect(data.categories[0].expand).to.be.true;
      expect(data.categories[0].childCategories![0].expand).to.be.true;
    });

    it("does not modify category expansion when false", async () => {
      render(<PropertyGrid {...commonProps} editableRuleset={editableRuleset} keepCategoriesExpanded={false} />);
      expect(stubUsePropertyDataProvider).to.have.been.calledOnce;

      const { dataProvider } = stubUsePropertyDataProvider.firstCall.args[0];
      (dataProvider as any).getMemoizedData = async () => propertyData;

      const data = await dataProvider.getData();
      expect(data.categories[0].expand).to.be.true;
      expect(data.categories[0].childCategories![0].expand).to.be.false;
    });
  });
});
