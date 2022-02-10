/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import * as React from "react";
import { SoloRulesetEditor } from "@itwin/presentation-rules-editor-react";
import { AutoSizer } from "../common/AutoSizer";

export interface EditorTabProps {
  editor: SoloRulesetEditor;
}

export function EditorTab(props: EditorTabProps): React.ReactElement {
  const { editor } = props;
  return (
    <AutoSizer>
      {({ width, height }) => <editor.Component width={width} height={height} />}
    </AutoSizer>
  );
}
