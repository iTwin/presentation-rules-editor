/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import "./SoloRulesetEditor.scss";
import * as React from "react";
import { assert, IDisposable } from "@itwin/core-bentley";
import { Button } from "@itwin/itwinui-react";
import { Ruleset } from "@itwin/presentation-common";
import * as presentationRulesetSchema from "@itwin/presentation-common/Ruleset.schema.json";
import { EditableRuleset } from "../EditableRuleset";

import type * as monaco from "monaco-editor";

export interface SoloRulesetEditorParams {
  /** Ruleset that is going to be associated with the editor. */
  editableRuleset: EditableRuleset;

  /** Object that holds all monaco-editor exports. */
  monaco: typeof monaco;
}

/**
 * Represents a single monaco editor instance that is used to edit an associated ruleset. Instances of this class hold
 * global resources until {@linkcode dispose} method is called.
 */
export class SoloRulesetEditor implements IDisposable {
  private sharedData: SoloRulesetEditorSharedData = { savedViewState: undefined };

  /** Underlying monaco model used by the editor. */
  public readonly model: monaco.editor.ITextModel;

  /**
   * Instantiates a monaco editor for a specific {@linkcode EditableRuleset}. If multiple editors are created with the
   * same {@linkcode EditableRuleset} object, they will share the same underlying monaco editor model.
   */
  constructor(params: SoloRulesetEditorParams) {
    const editableRuleset = params.editableRuleset;
    const uri = params.monaco.Uri.parse(`presentation-rules-editor://rulesets/${editableRuleset.id}.ruleset.json`);
    this.model = params.monaco.editor.getModel(uri)
      ?? params.monaco.editor.createModel(JSON.stringify(editableRuleset.rulesetContent, undefined, 2), "json", uri);
    this.Component = createEditor(params.monaco, this.model, editableRuleset, this.sharedData);
  }

  /** React component that renders a monaco editor for the associated {@linkcode EditableRuleset}. */
  public Component: (props: SoloRulesetEditorProps) => React.ReactElement;

  public dispose(): void {
    this.model.dispose();
  }

  /** Tells whether {@linkcode dispose} method has been called on this object. */
  public get disposed() {
    return this.model.isDisposed();
  }
}

export interface SoloRulesetEditorProps {
  /** Width of the editor element. */
  width: number;

  /** Height of the editor element. */
  height: number;
}

interface SoloRulesetEditorSharedData {
  savedViewState: monaco.editor.ICodeEditorViewState | undefined;
}

/* istanbul ignore next */
function createEditor(
  monacoModule: typeof monaco,
  model: monaco.editor.ITextModel,
  ruleset: EditableRuleset,
  sharedData: SoloRulesetEditorSharedData,
): (props: SoloRulesetEditorProps) => React.ReactElement {
  return function StandaloneEditorComponent(props: SoloRulesetEditorProps): React.ReactElement {
    const divRef = React.useRef<HTMLDivElement>(null);
    const buttonWidgetRef = React.useRef<HTMLDivElement>(null);
    const editorRef = React.useRef<monaco.editor.IStandaloneCodeEditor>();

    const [buttonIsVisible, setButtonIsVisible] = React.useState(false);

    React.useLayoutEffect(
      () => {
        assert(divRef.current !== null);
        assert(buttonWidgetRef.current !== null);

        editorRef.current = monacoModule.editor.create(
          divRef.current,
          {
            model,
            language: "json",
            dimension: { width: props.width, height: props.height },
          },
        );
        editorRef.current.layout({ width: props.width, height: props.height });

        if (sharedData.savedViewState !== undefined) {
          editorRef.current.restoreViewState(sharedData.savedViewState);
          editorRef.current.focus();
        }

        editorRef.current.addOverlayWidget({
          getId: () => "presentation-rules-editor:submit-ruleset-widget",
          getDomNode: () => {
            assert(buttonWidgetRef.current !== null);
            setButtonIsVisible(true);
            return buttonWidgetRef.current;
          },
          getPosition: () => ({ preference: monacoModule.editor.OverlayWidgetPositionPreference.TOP_RIGHT_CORNER }),
        });

        contributeToMonacoEditor(
          monacoModule,
          editorRef.current,
          { submitRuleset: (newRuleset) => void ruleset.updateRuleset(newRuleset) },
        );

        return () => {
          assert(editorRef.current !== undefined);
          sharedData.savedViewState = editorRef.current.saveViewState() ?? undefined;
          editorRef.current.dispose();
        };
      },
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [],
    );

    editorRef.current?.layout({ width: props.width, height: props.height });

    function handleSubmitButtonClick() {
      assert(editorRef.current !== undefined);
      editorRef.current.trigger(undefined, "presentation-rules-editor:submit-ruleset", {});
    }

    return (
      <>
        <div ref={buttonWidgetRef}>
          {
            buttonIsVisible &&
            <Button styleType={"cta"} title={"Submit ruleset (Alt + Enter)"} onClick={handleSubmitButtonClick}>
              Submit ruleset
            </Button>
          }
        </div>
        <div ref={divRef} />
      </>
    );
  };
}

interface ContributionSettings {
  submitRuleset?: (ruleset: Ruleset) => void | undefined;
}

/* istanbul ignore next */
function contributeToMonacoEditor(
  monacoModule: typeof monaco,
  editor: monaco.editor.IStandaloneCodeEditor,
  settings: ContributionSettings,
): void {
  if (!initialized) {
    monacoModule.languages.json.jsonDefaults.setDiagnosticsOptions({
      validate: true,
      schemas: [{
        // Has to be a URI string, but not necessarily pointing to an existing resource
        uri: monacoModule.Uri.file("presentation-rules-editor://schemas/Ruleset.schema.json").toString(),
        fileMatch: ["*.ruleset.json"],
        schema: presentationRulesetSchema,
      }],
      enableSchemaRequest: false,
      comments: "error",
      trailingCommas: "error",
    });
    initialized = true;
  }

  const submitRuleset = settings.submitRuleset;
  if (submitRuleset !== undefined) {
    editor.addAction({
      id: "presentation-rules-editor:submit-ruleset",
      label: "Submit ruleset",
      keybindings: [monacoModule.KeyMod.Alt | monacoModule.KeyCode.Enter],
      run: () => {
        submitRuleset(parseRuleset(editor.getValue()));
      },
    });
  }
}

let initialized = false;

/* istanbul ignore next */
function parseRuleset(rulesetContent: string): Ruleset {
  try {
    const ruleset = JSON.parse(rulesetContent);
    return ruleset;
  } catch {
    return { id: "", rules: [] };
  }
}
