/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import "./Editor.scss";
import * as React from "react";
import { assert } from "@bentley/bentleyjs-core";
import { IModelApp } from "@bentley/imodeljs-frontend";
import { Button } from "@bentley/ui-core";

export interface EditorProps {
  initialText: string;
  onTextSubmitted: (newText: string) => void;
}

export const Editor: React.FC<EditorProps> = (props) => {
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);
  function submitText(): void {
    assert(textareaRef.current !== null);
    props.onTextSubmitted(textareaRef.current.value);
  }

  function handleKeyPress(e: React.KeyboardEvent): void {
    // Firefox and Chrome report different key values
    if (e.ctrlKey && (e.key === "Enter" || e.key === "\n")) {
      submitText();
    }
  }

  const textSubmit = IModelApp.i18n.translate("App:submit");
  return (
    <div className="rules-editor">
      <Button onClick={submitText} title={`${textSubmit} (Ctrl + Enter)`}>{textSubmit}</Button>
      <textarea ref={textareaRef} defaultValue={props.initialText} onKeyPress={handleKeyPress} spellCheck={false} />
    </div>
  );
};
