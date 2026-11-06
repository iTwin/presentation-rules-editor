/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/

import { useRef } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PropertyRecord, PropertyValueFormat, StandardTypeNames } from "@itwin/appui-abstract";
import * as componentsReact from "@itwin/components-react";
import { IModelConnection } from "@itwin/core-frontend";
import * as presentationComponents from "@itwin/presentation-components";
import { cleanup, render, waitFor } from "@testing-library/react";
import { EditableRuleset } from "../EditableRuleset.js";
import { MockFunction, stubPresentationManager } from "../TestUtils.js";
import { AutoExpandingPropertyDataProvider, PropertyGrid, PropertyGridAttributes, PropertyGridProps } from "./PropertyGrid.js";

const propertyGridMocks = vi.hoisted(() => ({
  useTrackedPropertyGridModelSource: vi.fn(),
  usePropertyDataProvider: vi.fn(),
  usePropertyGridModel: vi.fn(),
  virtualizedPropertyGrid: vi.fn(() => null),
}));

vi.mock("@itwin/components-react", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@itwin/components-react")>()),
  useTrackedPropertyGridModelSource: propertyGridMocks.useTrackedPropertyGridModelSource,
  usePropertyGridModel: propertyGridMocks.usePropertyGridModel,
  VirtualizedPropertyGrid: propertyGridMocks.virtualizedPropertyGrid,
}));

vi.mock("@itwin/presentation-components", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@itwin/presentation-components")>()),
  usePropertyDataProviderWithUnifiedSelection: propertyGridMocks.usePropertyDataProvider,
}));

describe("PropertyGrid", () => {
  const commonProps: Omit<PropertyGridProps, "editableRuleset"> = {
    width: 100,
    height: 100,
    iModel: {} as IModelConnection,
  };

  const stubUsePropertyGridModelSource = propertyGridMocks.useTrackedPropertyGridModelSource as MockFunction<
    (props: { dataProvider: componentsReact.IPropertyDataProvider }) => { modelSource: componentsReact.PropertyGridModelSource; inProgress: boolean }
  >;
  const stubUsePropertyDataProvider = propertyGridMocks.usePropertyDataProvider as MockFunction<
    (props: presentationComponents.PropertyDataProviderWithUnifiedSelectionProps) => presentationComponents.UsePropertyDataProviderWithUnifiedSelectionResult
  >;
  const stubUsePropertyGridModel = propertyGridMocks.usePropertyGridModel as MockFunction<
    (props: { modelSource: componentsReact.IPropertyGridModelSource }) => componentsReact.IPropertyGridModel | undefined
  >;
  let editableRuleset: EditableRuleset;

  beforeEach(() => {
    stubPresentationManager();

    stubUsePropertyGridModelSource.mockImplementation(() => ({}) as ReturnType<typeof componentsReact.useTrackedPropertyGridModelSource>);
    propertyGridMocks.virtualizedPropertyGrid.mockImplementation(() => null);

    editableRuleset = new EditableRuleset({ initialRuleset: { id: "", rules: [] } });
  });

  afterEach(() => {
    // React cleanup hooks need to run first before we restore stubs
    cleanup();

    editableRuleset[Symbol.dispose]();
    vi.restoreAllMocks();
    vi.resetAllMocks();
  });

  describe("normal state", () => {
    beforeEach(() => {
      stubUsePropertyDataProvider.mockImplementation(() => ({ isOverLimit: false, numSelectedElements: 1 }));
      stubUsePropertyGridModel.mockImplementation(() => ({}) as componentsReact.IPropertyGridModel);
      vi.spyOn(AutoExpandingPropertyDataProvider.prototype, "dispose").mockImplementation(() => {});
    });

    it("renders with AutoExpandingPropertyDataProvider", () => {
      render(<PropertyGrid {...commonProps} editableRuleset={editableRuleset} />);
      expect(stubUsePropertyGridModelSource).toHaveBeenCalledOnce();
      expect(stubUsePropertyGridModelSource.mock.calls[0][0].dataProvider).toBeInstanceOf(AutoExpandingPropertyDataProvider);
    });
  });

  describe("no elements selected state", () => {
    beforeEach(() => {
      stubUsePropertyDataProvider.mockImplementation(() => ({ isOverLimit: false, numSelectedElements: 0 }));
    });

    it("renders supplied component", () => {
      const { getByText } = render(<PropertyGrid {...commonProps} editableRuleset={editableRuleset} noElementsSelectedState={() => <>Test Component</>} />);
      expect(getByText("Test Component")).not.toBeNull();
    });

    it("renders default message when component is not supplied", () => {
      const { getByText } = render(<PropertyGrid {...commonProps} editableRuleset={editableRuleset} />);
      expect(getByText("No elements selected.")).not.toBeNull();
    });
  });

  describe("too many elements selected state", () => {
    beforeEach(() => {
      stubUsePropertyDataProvider.mockImplementation(() => ({ isOverLimit: true, numSelectedElements: 1 }));
    });

    it("renders supplied component", () => {
      const { getByText } = render(
        <PropertyGrid {...commonProps} editableRuleset={editableRuleset} tooManyElementsSelectedState={() => <>Test Component</>} />,
      );
      expect(getByText("Test Component")).not.toBeNull();
    });

    it("renders default message when too many elements are selected", () => {
      const { getByText } = render(<PropertyGrid {...commonProps} editableRuleset={editableRuleset} />);
      expect(getByText("Too many elements selected.")).not.toBeNull();
    });
  });

  describe("undefined property grid model state", () => {
    beforeEach(() => {
      stubUsePropertyDataProvider.mockImplementation(() => ({ isOverLimit: false, numSelectedElements: 1 }));
      stubUsePropertyGridModel.mockImplementation(() => undefined);
    });

    it("renders supplied component", () => {
      const { getByText } = render(<PropertyGrid {...commonProps} editableRuleset={editableRuleset} loadingPropertiesState={() => <>Test Component</>} />);
      expect(getByText("Test Component")).not.toBeNull();
    });

    it("renders default message while property grid model is undefined", () => {
      const { getByText } = render(<PropertyGrid {...commonProps} editableRuleset={editableRuleset} />);
      expect(getByText("Loading properties...")).not.toBeNull();
    });
  });

  describe("imperative handle", () => {
    let propertyGridModel: componentsReact.MutablePropertyGridModel;

    beforeEach(async () => {
      stubUsePropertyDataProvider.mockImplementation(() => ({ isOverLimit: false, numSelectedElements: 1 }));

      const stubModelSource = {
        modifyModel: vi.fn((callback: any) => callback(propertyGridModel)),
      } as unknown as componentsReact.PropertyGridModelSource;
      stubUsePropertyGridModelSource.mockImplementation(() => ({ modelSource: stubModelSource, inProgress: false }));

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
          expect(propertyGridModel.getItem("root").isExpanded).toBe(true);
          expect(propertyGridModel.getItem("root_child").isExpanded).toBe(true);
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
          expect(propertyGridModel.getItem("root").isExpanded).toBe(false);
          expect(propertyGridModel.getItem("root_child").isExpanded).toBe(false);
        });
      });
    });
  });

  describe("keepCategoriesExpanded", () => {
    let propertyData: componentsReact.PropertyData;

    beforeEach(() => {
      stubUsePropertyDataProvider.mockImplementation(() => ({ isOverLimit: false, numSelectedElements: 1 }));
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
      expect(stubUsePropertyDataProvider).toHaveBeenCalledOnce();

      const { dataProvider } = stubUsePropertyDataProvider.mock.calls[0][0];
      (dataProvider as any).getMemoizedData = async () => propertyData;

      const data = await dataProvider.getData();
      expect(data.categories[0].expand).toBe(true);
      expect(data.categories[0].childCategories?.[0].expand).toBe(true);
    });

    it("does not modify category expansion when false", async () => {
      render(<PropertyGrid {...commonProps} editableRuleset={editableRuleset} keepCategoriesExpanded={false} />);
      expect(stubUsePropertyDataProvider).toHaveBeenCalledOnce();

      const { dataProvider } = stubUsePropertyDataProvider.mock.calls[0][0];
      (dataProvider as any).getMemoizedData = async () => propertyData;

      const data = await dataProvider.getData();
      expect(data.categories[0].expand).toBe(true);
      expect(data.categories[0].childCategories?.[0].expand).toBe(false);
    });
  });
});
