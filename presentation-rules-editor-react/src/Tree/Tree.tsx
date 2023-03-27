/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import * as React from "react";
import { ControlledTree, SelectionMode, TreeRendererProps, useTreeModel } from "@itwin/components-react";
import { IModelConnection } from "@itwin/core-frontend";
import { PresentationTreeRenderer, usePresentationTreeNodeLoader, useUnifiedSelectionTreeEventHandler } from "@itwin/presentation-components";
import { EditableRuleset } from "../EditableRuleset";

export interface TreeProps {
  /** Width of the tree element. */
  width: number;

  /** Height of the tree element. */
  height: number;

  /** Connection to an iModel from which to pull tree node data. */
  iModel: IModelConnection;

  /** {@linkcode EditableRuleset} to keep track of. */
  editableRuleset: EditableRuleset;
}

/**
 * Displays a tree hierarchy defined by a Presentation ruleset. This component will reload the tree when content of the
 * {@linkcode EditableRuleset} changes.
 */
export function Tree(props: TreeProps) {
  const { nodeLoader, onItemsRendered } = usePresentationTreeNodeLoader({
    imodel: props.iModel,
    ruleset: props.editableRuleset.id,
    pagingSize: 20,
    enableHierarchyAutoUpdate: true,
  });
  const eventHandler = useUnifiedSelectionTreeEventHandler({ nodeLoader });
  const treeModel = useTreeModel(nodeLoader.modelSource);

  const treeRenderer = React.useCallback(
    (treeRendererProps: TreeRendererProps) => (
      <PresentationTreeRenderer
        {...treeRendererProps}
        imodel={props.iModel}
        modelSource={nodeLoader.modelSource}
      />
    ),
    [props.iModel, nodeLoader.modelSource],
  );

  return (
    <ControlledTree
      width={props.width}
      height={props.height}
      model={treeModel}
      eventsHandler={eventHandler}
      nodeLoader={nodeLoader}
      selectionMode={SelectionMode.Extended}
      onItemsRendered={onItemsRendered}
      treeRenderer={treeRenderer}
    />
  );
}
