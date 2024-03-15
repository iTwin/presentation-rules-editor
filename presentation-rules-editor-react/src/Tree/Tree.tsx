/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/

import { SelectionMode } from "@itwin/components-react";
import { IModelConnection } from "@itwin/core-frontend";
import { PresentationTree, PresentationTreeEventHandlerProps, PresentationTreeRenderer, UnifiedSelectionTreeEventHandler, usePresentationTreeState } from "@itwin/presentation-components";
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
  const state = usePresentationTreeState({
    imodel: props.iModel,
    ruleset: props.editableRuleset.id,
    pagingSize: 20,
    enableHierarchyAutoUpdate: true,
    eventHandlerFactory,
  });

  /* istanbul ignore next */
  if (!state) {
    return null;
  }

  return (
    <PresentationTree
      width={props.width}
      height={props.height}
      state={state}
      selectionMode={SelectionMode.Extended}
      treeRenderer={(treeProps) => <PresentationTreeRenderer {...treeProps} imodel={props.iModel} modelSource={state.nodeLoader.modelSource} />}
    />
  );
}

/* istanbul ignore next */
function eventHandlerFactory(props: PresentationTreeEventHandlerProps) {
  return new UnifiedSelectionTreeEventHandler(props);
}
