/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import * as React from "react";
import { ControlledTree, SelectionMode, useTreeModel } from "@itwin/components-react";
import { IModelConnection } from "@itwin/core-frontend";
import { usePresentationTreeNodeLoader, useUnifiedSelectionTreeEventHandler } from "@itwin/presentation-components";
import { AutoSizer } from "../common/AutoSizer";

export interface TreeProps {
  imodel: IModelConnection;
  rulesetId: string;
}

export function Tree(props: TreeProps): React.ReactElement {
  const { nodeLoader, onItemsRendered } = usePresentationTreeNodeLoader({
    imodel: props.imodel,
    ruleset: props.rulesetId,
    pagingSize: 10,
    enableHierarchyAutoUpdate: true,
  });
  const eventHandler = useUnifiedSelectionTreeEventHandler({ nodeLoader });
  const treeModel = useTreeModel(nodeLoader.modelSource);

  return (
    <AutoSizer>
      {({ width, height }) =>
        <ControlledTree
          width={width}
          height={height}
          model={treeModel}
          eventsHandler={eventHandler}
          nodeLoader={nodeLoader}
          selectionMode={SelectionMode.Extended}
          onItemsRendered={onItemsRendered}
        />
      }
    </AutoSizer>
  );
}
