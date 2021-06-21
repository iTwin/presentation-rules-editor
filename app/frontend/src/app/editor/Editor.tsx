/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import "./Editor.scss";
import * as monaco from "monaco-editor";
import * as React from "react";
import { assert } from "@bentley/bentleyjs-core";
import { IModelApp } from "@bentley/imodeljs-frontend";
import { Ruleset } from "@bentley/presentation-common";
import presentationRulesetSchema from "@bentley/presentation-common/Ruleset.schema.json";
import { Button } from "@bentley/ui-core";
import { AutoSizer, Size } from "../utils/AutoSizer";

export interface EditorProps {
  initialText: string;
  submitRuleset: (ruleset: Ruleset) => void;
}

export const Editor: React.FC<EditorProps> = (props) => {
  return (
    <AutoSizer>
      {(size) => <SizedEditor {...props} size={size} />}
    </AutoSizer>
  );
};

interface SizedEditorProps {
  size: Size;
  initialText: string;
  submitRuleset: (ruleset: Ruleset) => void;
}

function SizedEditor(props: SizedEditorProps): React.ReactElement {
  const divRef = React.useRef<HTMLDivElement>(null);
  const buttonWidgetRef = React.useRef<HTMLDivElement>(null);
  const editorRef = React.useRef<monaco.editor.IStandaloneCodeEditor>();

  const textSubmitRuleset = IModelApp.i18n.translate("App:submit-ruleset");
  const [buttonIsVisible, setButtonIsVisible] = React.useState(false);

  React.useLayoutEffect(
    () => {
      assert(divRef.current !== null);
      assert(buttonWidgetRef.current !== null);

      const rulesetUri = monaco.Uri.file("Ruleset1.ruleset.json");
      const model = monaco.editor.getModel(rulesetUri)
        ?? monaco.editor.createModel(props.initialText, "json", rulesetUri);
      editorRef.current = monaco.editor.create(
        divRef.current,
        {
          value: props.initialText,
          model,
          language: "json",
          dimension: props.size,
        },
      );
      editorRef.current.layout(props.size);

      if (savedViewState !== null) {
        editorRef.current.restoreViewState(savedViewState);
        editorRef.current.focus();
      }

      editorRef.current.addOverlayWidget({
        getId: () => "widget-submit-button",
        getDomNode: () => {
          assert(buttonWidgetRef.current !== null);
          setButtonIsVisible(true);
          return buttonWidgetRef.current;
        },
        getPosition: () => ({ preference: monaco.editor.OverlayWidgetPositionPreference.TOP_RIGHT_CORNER }),
      });

      contributeToMonacoEditor(editorRef.current, { actions: { submitRuleset: props.submitRuleset } });

      return () => {
        assert(editorRef.current !== undefined);
        savedViewState = editorRef.current.saveViewState();
        editorRef.current.dispose();
      };
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  editorRef.current?.layout(props.size);

  function handleSubmitButtonClick() {
    assert(editorRef.current !== undefined);
    editorRef.current.trigger(undefined, "presentation-rules-editor:submit-ruleset", {});
  }

  return (
    <>
      <div ref={buttonWidgetRef} className="widget-submit-ruleset">
        {
          buttonIsVisible &&
          <Button title={`${textSubmitRuleset} (Alt + Enter)`} onClick={handleSubmitButtonClick}>
            {textSubmitRuleset}
          </Button>
        }
      </div>
      <div ref={divRef} />
    </>
  );
}

let savedViewState: monaco.editor.ICodeEditorViewState | null;

interface ContributionSettings {
  actions?: {
    submitRuleset?: (ruleset: Ruleset) => void;
  };
}

function contributeToMonacoEditor(editor: monaco.editor.IStandaloneCodeEditor, settings: ContributionSettings): void {
  if (!initialized) {
    monaco.languages.json.jsonDefaults.setDiagnosticsOptions({
      validate: true,
      schemas: [{
        // Has to be a URI string, but not necessarily pointing to an existing resource
        uri: monaco.Uri.file("Ruleset.schema.json").toString(),
        fileMatch: ["*.ruleset.json"],
        schema: presentationRulesetSchema,
      }],
      enableSchemaRequest: false,
      comments: "error",
      trailingCommas: "error",
    });
    initialized = true;
  }

  const submitRuleset = settings?.actions?.submitRuleset;
  if (submitRuleset !== undefined) {
    editor.addAction({
      id: "presentation-rules-editor:submit-ruleset",
      label: IModelApp.i18n.translate("App:submit-ruleset"),
      keybindings: [monaco.KeyMod.Alt | monaco.KeyCode.Enter],
      run: () => {
        submitRuleset(JSON.parse(editor.getValue()) as Ruleset);
      },
    });
  }
}

let initialized = false;
