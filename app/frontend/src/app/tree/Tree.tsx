/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import * as React from "react";
import { IModelConnection } from "@bentley/imodeljs-frontend";
import { usePresentationTreeNodeLoader, useUnifiedSelectionTreeEventHandler } from "@bentley/presentation-components";
import { ControlledTree, SelectionMode, useVisibleTreeNodes } from "@bentley/ui-components";

export interface TreeProps {
  imodel: IModelConnection;
  rulesetId: string;
}

export const Tree: React.FC<TreeProps> = (props) => {
  const { nodeLoader } = usePresentationTreeNodeLoader({ imodel: props.imodel, ruleset: props.rulesetId, pagingSize: 10 });
  const eventHandler = useUnifiedSelectionTreeEventHandler({ nodeLoader });
  const visibleNodes = useVisibleTreeNodes(nodeLoader.modelSource);

  return (
    <ControlledTree
      visibleNodes={visibleNodes}
      treeEvents={eventHandler}
      nodeLoader={nodeLoader}
      selectionMode={SelectionMode.Extended}
    />
  );
};
