/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import * as React from "react";
import { ControlledTree, SelectionMode, useTreeModel } from "@itwin/components-react";
import { IModelConnection } from "@itwin/core-frontend";
import { usePresentationTreeNodeLoader, useUnifiedSelectionTreeEventHandler } from "@itwin/presentation-components";
import { EditableRuleset } from "../EditableRuleset";

export interface TreeProps {
  width: number;
  height: number;
  imodel: IModelConnection;
  editableRuleset: EditableRuleset;
}

/**
 * Displays a tree hierarchy defined by a Presentation ruleset. This component will reload the tree when content of the
 * {@linkcode EditableRuleset} changes.
 */
export function Tree(props: TreeProps): React.ReactElement {
  const { nodeLoader, onItemsRendered } = usePresentationTreeNodeLoader({
    imodel: props.imodel,
    ruleset: props.editableRuleset.id,
    pagingSize: 20,
    enableHierarchyAutoUpdate: true,
  });
  const eventHandler = useUnifiedSelectionTreeEventHandler({ nodeLoader });
  const treeModel = useTreeModel(nodeLoader.modelSource);

  return (
    <ControlledTree
      width={props.width}
      height={props.height}
      model={treeModel}
      eventsHandler={eventHandler}
      nodeLoader={nodeLoader}
      selectionMode={SelectionMode.Extended}
      onItemsRendered={onItemsRendered}
    />
  );
}
