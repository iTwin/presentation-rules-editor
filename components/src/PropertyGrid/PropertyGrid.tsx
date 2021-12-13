/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import * as React from "react";
import { PropertyCategory, PropertyData, VirtualizedPropertyGridWithDataProvider } from "@itwin/components-react";
import { IModelConnection } from "@itwin/core-frontend";
import { Orientation, useDisposable } from "@itwin/core-react";
import {
  PresentationPropertyDataProvider, usePropertyDataProviderWithUnifiedSelection,
} from "@itwin/presentation-components";
import { EditableRuleset } from "../EditableRuleset";

export interface PropertyGridProps {
  width: number;
  height: number;
  imodel: IModelConnection;
  editableRuleset: EditableRuleset;
  /** Component to be rendered when there are no elements in Unified Selection set. */
  noElementsSelectedState?: React.ComponentType | undefined;
  /** Component to be rendered when too many elements are present in Unified Selection set. */
  tooManyElementsSelectedState?: React.ComponentType | undefined;
}

/**
 * Displays properties of selected elements. This component updates itself when {@linkcode EditableRuleset} content
 * changes.
 */
export function PropertyGrid(props: PropertyGridProps): React.ReactElement {
  const dataProvider = useDisposable(React.useCallback(
    () => {
      const provider = new AutoExpandingPropertyDataProvider({ imodel: props.imodel, ruleset: props.editableRuleset.id });
      provider.isNestedPropertyCategoryGroupingEnabled = true;
      return provider;
    },
    [props.imodel, props.editableRuleset.id],
  ));

  const { isOverLimit, numSelectedElements } = usePropertyDataProviderWithUnifiedSelection({ dataProvider });
  if (numSelectedElements === 0) {
    return props.noElementsSelectedState ? React.createElement(props.noElementsSelectedState) : <>No elements selected</>;
  }

  if (isOverLimit) {
    return props.tooManyElementsSelectedState ? React.createElement(props.tooManyElementsSelectedState) : <>Too many elements selected</>;
  }

  return (
    <VirtualizedPropertyGridWithDataProvider
      width={props.width}
      height={props.height}
      dataProvider={dataProvider}
      orientation={Orientation.Horizontal}
      horizontalOrientationMinWidth={400}
      minLabelWidth={150}
    />
  );
}

class AutoExpandingPropertyDataProvider extends PresentationPropertyDataProvider {
  public override async getData(): Promise<PropertyData> {
    const result = await super.getData();
    this.expandCategories(result.categories);
    return result;
  }

  private expandCategories(categories: PropertyCategory[]): void {
    if (categories.length > 0) {
      categories[0].expand = true;
    }
  }
}
