/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import * as React from "react";
import { IModelApp, IModelConnection } from "@bentley/imodeljs-frontend";
import { RegisteredRuleset } from "@bentley/presentation-common";
import {
  PresentationPropertyDataProvider, usePropertyDataProviderWithUnifiedSelection,
} from "@bentley/presentation-components";
import { PropertyCategory, PropertyData, VirtualizedPropertyGridWithDataProvider } from "@bentley/ui-components";
import { Orientation, useDisposable } from "@bentley/ui-core";
import { Button } from "@itwin/itwinui-react";
import { appLayoutContext, AppTab } from "../../AppContext";
import { VerticalStack } from "../../common/CenteredStack";
import { AutoSizer } from "../common/AutoSizer";

export interface PropertyGridProps {
  imodel: IModelConnection;
  ruleset: RegisteredRuleset;
}

export function PropertyGrid(props: PropertyGridProps): React.ReactElement {
  const appLayout = React.useContext(appLayoutContext);

  const dataProvider = useDisposable(React.useCallback(
    () => {
      const provider = new AutoExpandingPropertyDataProvider({ imodel: props.imodel, ruleset: props.ruleset.id });
      provider.isNestedPropertyCategoryGroupingEnabled = true;
      return provider;
    },
    [props.imodel, props.ruleset],
  ));

  const { isOverLimit, numSelectedElements } = usePropertyDataProviderWithUnifiedSelection({ dataProvider });
  if (numSelectedElements === 0) {
    return (
      <VerticalStack>
        <span>{IModelApp.i18n.translate("App:property-grid.no-elements-selected")}</span>
        {
          appLayout.activeTab !== AppTab.Viewport &&
          <Button onClick={() => appLayout.setActiveTab(AppTab.Viewport)}>
            {IModelApp.i18n.translate("App:property-grid.show-viewport")}
          </Button>
        }
      </VerticalStack>
    );
  }

  if (isOverLimit) {
    return <VerticalStack>{IModelApp.i18n.translate("App:property-grid.over-limit")}</VerticalStack>;
  }

  return (
    <AutoSizer>
      {({ width, height }) =>
        <VirtualizedPropertyGridWithDataProvider
          dataProvider={dataProvider}
          width={width}
          height={height}
          orientation={Orientation.Horizontal}
          horizontalOrientationMinWidth={400}
          minLabelWidth={150}
        />
      }
    </AutoSizer>
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
