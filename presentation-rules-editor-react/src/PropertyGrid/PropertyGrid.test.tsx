/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/

import { expect } from "chai";
import { ForwardRefExoticComponent, RefAttributes, useRef } from "react";
import * as sinon from "sinon";
import * as td from "testdouble";
import { PropertyRecord, PropertyValueFormat, StandardTypeNames } from "@itwin/appui-abstract";
import * as componentsReact from "@itwin/components-react";
import { IModelConnection } from "@itwin/core-frontend";
import * as presentationComponents from "@itwin/presentation-components";
import { cleanup, render, waitFor } from "@testing-library/react";
import { EditableRuleset } from "../EditableRuleset.js";
import { stubPresentationManager } from "../TestUtils.js";
import { AutoExpandingPropertyDataProvider as AutoExpandingPropertyDataProviderOG, PropertyGridAttributes, PropertyGridProps } from "./PropertyGrid.js";

const presentationComponentsModulePath = import.meta.resolve("@itwin/presentation-components");
const componentsReactModulePath = import.meta.resolve("@itwin/components-react");

describe("PropertyGrid", () => {
  let PropertyGrid: ForwardRefExoticComponent<PropertyGridProps & RefAttributes<PropertyGridAttributes>>;
  let AutoExpandingPropertyDataProvider: typeof AutoExpandingPropertyDataProviderOG;
  const commonProps: Omit<PropertyGridProps, "editableRuleset"> = {
    width: 100,
    height: 100,
    iModel: {} as IModelConnection,
  };

  const initialAutoExpandingPropertyDataProviderPrototype = Object.getPrototypeOf(AutoExpandingPropertyDataProviderOG);

  let stubUsePropertyGridModelSource = sinon.stub<
    [props: { dataProvider: componentsReact.IPropertyDataProvider }],
    { modelSource: componentsReact.PropertyGridModelSource; inProgress: boolean }
  >();
  const stubUsePropertyDataProvider = sinon.stub<
    [presentationComponents.PropertyDataProviderWithUnifiedSelectionProps],
    presentationComponents.UsePropertyDataProviderWithUnifiedSelectionResult
  >();
  const stubUsePropertyGridModel = sinon.stub<
    [
      props: {
        modelSource: componentsReact.IPropertyGridModelSource;
      },
    ],
    componentsReact.IPropertyGridModel | undefined
  >();
  let editableRuleset: EditableRuleset;

  beforeEach(async () => {
    stubPresentationManager();

    stubUsePropertyGridModelSource = stubUsePropertyGridModelSource.callsFake(
      () => ({}) as ReturnType<typeof componentsReact.useTrackedPropertyGridModelSource>,
    );

    editableRuleset = new EditableRuleset({ initialRuleset: { id: "", rules: [] } });
    await td.replaceEsm(componentsReactModulePath, {
      ...componentsReact,
      useTrackedPropertyGridModelSource: stubUsePropertyGridModelSource,
      usePropertyGridModel: stubUsePropertyGridModel,
      VirtualizedPropertyGrid: sinon.stub().callsFake(() => null),
    });
    await td.replaceEsm(presentationComponentsModulePath, {
      ...presentationComponents,
      usePropertyDataProviderWithUnifiedSelection: stubUsePropertyDataProvider,
    });
  });

  afterEach(() => {
    // React cleanup hooks need to run first before we restore stubs
    cleanup();

    editableRuleset.dispose();
    sinon.reset();
    td.reset();
  });

  describe("normal state", () => {
    beforeEach(async () => {
      stubUsePropertyDataProvider.callsFake(() => ({ isOverLimit: false, numSelectedElements: 1 }));
      stubUsePropertyGridModel.callsFake(() => ({}) as componentsReact.IPropertyGridModel);
      const propertyGridImport = await import("./PropertyGrid.js");
      PropertyGrid = propertyGridImport.PropertyGrid;
      AutoExpandingPropertyDataProvider = propertyGridImport.AutoExpandingPropertyDataProvider;
      sinon.stub(AutoExpandingPropertyDataProvider.prototype, "dispose");
    });
    afterEach(() => {
      Object.setPrototypeOf(AutoExpandingPropertyDataProvider, initialAutoExpandingPropertyDataProviderPrototype);
    });

    it("renders with AutoExpandingPropertyDataProvider", () => {
      render(<PropertyGrid {...commonProps} editableRuleset={editableRuleset} />);
      expect(stubUsePropertyGridModelSource).to.have.been.calledOnce.and.calledWithMatch(
        sinon.match(({ dataProvider }) => dataProvider instanceof AutoExpandingPropertyDataProvider),
      );
    });
  });

  describe("no elements selected state", () => {
    beforeEach(async () => {
      stubUsePropertyDataProvider.callsFake(() => ({ isOverLimit: false, numSelectedElements: 0 }));
      PropertyGrid = (await import("./PropertyGrid.js")).PropertyGrid;
    });

    it("renders supplied component", () => {
      const { getByText } = render(<PropertyGrid {...commonProps} editableRuleset={editableRuleset} noElementsSelectedState={() => <>Test Component</>} />);
      expect(getByText("Test Component")).not.to.be.null;
    });

    it("renders default message when component is not supplied", () => {
      const { getByText } = render(<PropertyGrid {...commonProps} editableRuleset={editableRuleset} />);
      expect(getByText("No elements selected.")).not.to.be.null;
    });
  });

  describe("too many elements selected state", () => {
    beforeEach(async () => {
      stubUsePropertyDataProvider.callsFake(() => ({ isOverLimit: true, numSelectedElements: 1 }));
      PropertyGrid = (await import("./PropertyGrid.js")).PropertyGrid;
    });

    it("renders supplied component", () => {
      const { getByText } = render(
        <PropertyGrid {...commonProps} editableRuleset={editableRuleset} tooManyElementsSelectedState={() => <>Test Component</>} />,
      );
      expect(getByText("Test Component")).not.to.be.null;
    });

    it("renders default message when too many elements are selected", () => {
      const { getByText } = render(<PropertyGrid {...commonProps} editableRuleset={editableRuleset} />);
      expect(getByText("Too many elements selected.")).not.to.be.null;
    });
  });

  describe("undefined property grid model state", () => {
    beforeEach(async () => {
      stubUsePropertyDataProvider.callsFake(() => ({ isOverLimit: false, numSelectedElements: 1 }));
      stubUsePropertyGridModel.callsFake(() => undefined);
      PropertyGrid = (await import("./PropertyGrid.js")).PropertyGrid;
    });

    it("renders supplied component", () => {
      const { getByText } = render(<PropertyGrid {...commonProps} editableRuleset={editableRuleset} loadingPropertiesState={() => <>Test Component</>} />);
      expect(getByText("Test Component")).not.to.be.null;
    });

    it("renders default message while property grid model is undefined", () => {
      const { getByText } = render(<PropertyGrid {...commonProps} editableRuleset={editableRuleset} />);
      expect(getByText("Loading properties...")).not.to.be.null;
    });
  });

  describe("imperative handle", () => {
    let propertyGridModel: componentsReact.MutablePropertyGridModel;

    beforeEach(async () => {
      stubUsePropertyDataProvider.callsFake(() => ({ isOverLimit: false, numSelectedElements: 1 }));

      const stubModelSource = {
        modifyModel: sinon.fake((callback: any) => callback(propertyGridModel)),
      } as unknown as componentsReact.PropertyGridModelSource;
      stubUsePropertyGridModelSource.callsFake(() => ({ modelSource: stubModelSource, inProgress: false }));
      PropertyGrid = (await import("./PropertyGrid.js")).PropertyGrid;

      const propertyData: componentsReact.PropertyData = {
        label: new PropertyRecord({ valueFormat: PropertyValueFormat.Primitive }, { name: "test", displayLabel: "test", typename: StandardTypeNames.String }),
        categories: [
          {
            name: "root",
            label: "root",
            expand: undefined as unknown as boolean,
            childCategories: [{ name: "child", label: "child", expand: undefined as unknown as boolean }],
          },
        ],
        records: {},
      };

      propertyGridModel = new componentsReact.MutablePropertyGridModel(propertyData, new componentsReact.MutableGridItemFactory());
    });

    describe("expandAllCategories", () => {
      it("expands all nested categories", async () => {
        const TestComponent = () => {
          const propertyGridRef = useRef<PropertyGridAttributes>(null);

          return (
            <>
              <PropertyGrid ref={propertyGridRef} {...commonProps} editableRuleset={editableRuleset} />
              <button onClick={() => propertyGridRef.current?.expandAllCategories()}>Expand</button>
            </>
          );
        };

        const { getByText } = render(<TestComponent />);
        const button = await waitFor(() => getByText("Expand"));
        button.click();
        await waitFor(() => {
          expect(propertyGridModel.getItem("root").isExpanded).to.be.true;
          expect(propertyGridModel.getItem("root_child").isExpanded).to.be.true;
        });
      });
    });

    describe("collapseAllCategories", () => {
      it("collapses all nested categories", async () => {
        const TestComponent = () => {
          const propertyGridRef = useRef<PropertyGridAttributes>(null);

          return (
            <>
              <PropertyGrid ref={propertyGridRef} {...commonProps} editableRuleset={editableRuleset} />
              <button onClick={() => propertyGridRef.current?.collapseAllCategories()}>Collapse</button>
            </>
          );
        };

        const { getByText } = render(<TestComponent />);
        const button = await waitFor(() => getByText("Collapse"));
        button.click();
        await waitFor(() => {
          expect(propertyGridModel.getItem("root").isExpanded).to.be.false;
          expect(propertyGridModel.getItem("root_child").isExpanded).to.be.false;
        });
      });
    });
  });

  describe("keepCategoriesExpanded", () => {
    let propertyData: componentsReact.PropertyData;

    beforeEach(async () => {
      stubUsePropertyDataProvider.callsFake(() => ({ isOverLimit: false, numSelectedElements: 1 }));
      PropertyGrid = (await import("./PropertyGrid.js")).PropertyGrid;
      propertyData = {
        label: new PropertyRecord({ valueFormat: PropertyValueFormat.Primitive }, { name: "test", displayLabel: "test", typename: StandardTypeNames.String }),
        categories: [
          {
            name: "root",
            label: "root",
            expand: true,
            childCategories: [{ name: "child", label: "child", expand: false }],
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
      expect(data.categories[0].childCategories?.[0].expand).to.be.true;
    });

    it("does not modify category expansion when false", async () => {
      render(<PropertyGrid {...commonProps} editableRuleset={editableRuleset} keepCategoriesExpanded={false} />);
      expect(stubUsePropertyDataProvider).to.have.been.calledOnce;

      const { dataProvider } = stubUsePropertyDataProvider.firstCall.args[0];
      (dataProvider as any).getMemoizedData = async () => propertyData;

      const data = await dataProvider.getData();
      expect(data.categories[0].expand).to.be.true;
      expect(data.categories[0].childCategories?.[0].expand).to.be.false;
    });
  });
});
