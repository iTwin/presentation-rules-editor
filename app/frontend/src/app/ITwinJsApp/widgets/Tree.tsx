/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import * as React from "react";
import { IModelConnection } from "@bentley/imodeljs-frontend";
import { RegisteredRuleset } from "@bentley/presentation-common";
import { usePresentationTreeNodeLoader, useUnifiedSelectionTreeEventHandler } from "@bentley/presentation-components";
import { ControlledTree, SelectionMode, useVisibleTreeNodes } from "@bentley/ui-components";
import { AutoSizer } from "../utils/AutoSizer";

export interface TreeProps {
  imodel: IModelConnection;
  ruleset: RegisteredRuleset;
}

export const Tree: React.FC<TreeProps> = (props) => {
  const { nodeLoader, onItemsRendered } = usePresentationTreeNodeLoader({
    imodel: props.imodel,
    ruleset: props.ruleset,
    pagingSize: 10,
    enableHierarchyAutoUpdate: false,
  });
  const eventHandler = useUnifiedSelectionTreeEventHandler({ nodeLoader });
  const visibleNodes = useVisibleTreeNodes(nodeLoader.modelSource);

  return (
    <AutoSizer>
      {({ width, height }) =>
        <ControlledTree
          width={width}
          height={height}
          visibleNodes={visibleNodes}
          treeEvents={eventHandler}
          nodeLoader={nodeLoader}
          selectionMode={SelectionMode.Extended}
          onItemsRendered={onItemsRendered}
        />
      }
    </AutoSizer>
  );
};
