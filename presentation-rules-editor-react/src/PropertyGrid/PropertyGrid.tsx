/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import "./PropertyGrid.css";
import * as React from "react";
import {
  FlatGridItemType, IMutableFlatGridItem, IMutableGridCategoryItem, IMutablePropertyGridModel, PropertyCategory,
  PropertyData, usePropertyGridEventHandler, usePropertyGridModel, usePropertyGridModelSource, VirtualizedPropertyGrid,
} from "@itwin/components-react";
import { IModelConnection } from "@itwin/core-frontend";
import { Orientation, useDisposable } from "@itwin/core-react";
import { ProgressRadial } from "@itwin/itwinui-react";
import {
  PresentationPropertyDataProvider, PresentationPropertyDataProviderProps, usePropertyDataProviderWithUnifiedSelection,
} from "@itwin/presentation-components";
import { EditableRuleset } from "../EditableRuleset";

export interface PropertyGridProps {
  /** Width of the property grid element. */
  width: number;

  /** Height of the property grid element. */
  height: number;

  /** Connection to an iModel from which to pull property data. */
  iModel: IModelConnection;

  /** {@linkcode EditableRuleset} to keep track of. */
  editableRuleset: EditableRuleset;

  /** Whether to automatically expand all categories when loading property data. */
  keepCategoriesExpanded?: boolean | undefined;

  /** Component to be rendered wile there are no elements in Unified Selection set. */
  noElementsSelectedState?: (() => React.ReactElement) | undefined;

  /** Component to be rendered while too many elements are present in Unified Selection set. */
  tooManyElementsSelectedState?: (() => React.ReactElement) | undefined;

  /** Component to be rendered while PropertyGrid model is not available. */
  loadingPropertiesState?: (() => React.ReactElement) | undefined;
}

export interface PropertyGridAttributes {
  expandAllCategories(): void;
  collapseAllCategories(): void;
}

/**
 * Displays properties of selected elements. This component updates itself when {@linkcode EditableRuleset} content
 * changes.
 */
export const PropertyGrid = React.forwardRef<PropertyGridAttributes, PropertyGridProps>(
  function PropertyGrid(props, ref): React.ReactElement {
    const dataProvider = useDataProvider(props.iModel, props.editableRuleset, !!props.keepCategoriesExpanded);
    const modelSource = usePropertyGridModelSource({ dataProvider });
    const propertyGridModel = usePropertyGridModel({ modelSource });
    const eventHandler = usePropertyGridEventHandler({ modelSource });

    React.useImperativeHandle(
      ref,
      () => ({
        expandAllCategories() {
          modelSource.modifyModel((model) => {
            walkCategories(model, (category) => {
              category.isExpanded = true;
            });
          });
        },
        collapseAllCategories() {
          modelSource.modifyModel((model) => {
            walkCategories(model, (category) => category.isExpanded = false);
          });
        },
      }),
      [modelSource],
    );

    const { isOverLimit, numSelectedElements } = usePropertyDataProviderWithUnifiedSelection({ dataProvider });
    if (numSelectedElements === 0) {
      return props.noElementsSelectedState?.() ?? (
        <CenteredContent width={props.width} height={props.height}>No elements selected.</CenteredContent>
      );
    }

    if (isOverLimit) {
      return props.tooManyElementsSelectedState?.() ?? (
        <CenteredContent width={props.width} height={props.height}>Too many elements selected.</CenteredContent>
      );
    }

    if (propertyGridModel === undefined) {
      return props.loadingPropertiesState?.() ?? (
        <CenteredContent width={props.width} height={props.height}>
          <ProgressRadial size="large" indeterminate={true} />
          Loading properties...
        </CenteredContent>
      );
    }

    return (
      <VirtualizedPropertyGrid
        width={props.width}
        height={props.height}
        dataProvider={dataProvider}
        model={propertyGridModel}
        eventHandler={eventHandler}
        orientation={Orientation.Horizontal}
        horizontalOrientationMinWidth={400}
        minLabelWidth={150}
      />
    );
  },
);

function useDataProvider(
  iModel: IModelConnection,
  editableRuleset: EditableRuleset,
  keepCategoriesExpanded: boolean,
): AutoExpandingPropertyDataProvider {
  const [state, setState] = React.useState({});

  React.useEffect(
    () => editableRuleset.onAfterRulesetUpdated.addListener(() => setState({})),
    [editableRuleset],
  );

  const keepExpandedRef = React.useRef(false);
  keepExpandedRef.current = keepCategoriesExpanded;

  const dataProvider = useDisposable(React.useCallback(
    () => new AutoExpandingPropertyDataProvider(
      {
        imodel: iModel,
        ruleset: editableRuleset.id,
      },
      keepExpandedRef,
    ),
    // Also recreate dataProvider when editable ruleset content changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [editableRuleset.id, iModel, state],
  ));

  return dataProvider;
}

/** @internal */
export class AutoExpandingPropertyDataProvider extends PresentationPropertyDataProvider {
  constructor(props: PresentationPropertyDataProviderProps, private keepExpandedRef: React.MutableRefObject<boolean>) {
    super(props);
  }

  public override async getData(): Promise<PropertyData> {
    const result = await super.getData();
    if (this.keepExpandedRef.current) {
      this.expandCategories(result.categories);
    }

    return result;
  }

  private expandCategories(categories: PropertyCategory[]): void {
    for (const category of categories) {
      category.expand = true;
      this.expandCategories(category.childCategories ?? []);
    }
  }
}

function walkCategories(model: IMutablePropertyGridModel, action: (category: IMutableGridCategoryItem) => void): void {
  for (const category of model.getRootCategories()) {
    action(category);
    walkRecursively(category);
  }

  function walkRecursively(category: IMutableGridCategoryItem): void {
    for (const childCategory of category.getChildren().filter(isCategory)) {
      action(childCategory);
      walkRecursively(childCategory);
    }
  }

  function isCategory(item: IMutableFlatGridItem): item is IMutableGridCategoryItem {
    return item.type === FlatGridItemType.Category;
  }
}

interface CenteredContentProps {
  width: number;
  height: number;
  children: React.ReactNode;
}

function CenteredContent(props: CenteredContentProps): React.ReactElement {
  return (
    <div className="presentation-rules-editor-centered-content" style={{ width: props.width, height: props.height }}>
      {props.children}
    </div>
  );
}
