/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import * as monaco from "monaco-editor";
import * as React from "react";
import { assert, IDisposable } from "@itwin/core-bentley";
import { Button } from "@itwin/itwinui-react";
import { Ruleset } from "@itwin/presentation-common";
import * as presentationRulesetSchema from "@itwin/presentation-common/Ruleset.schema.json";
import { EditableRuleset } from "../EditableRuleset";

/**
 * Represents a single monaco editor instance that is used to edit an associated ruleset. Instances of this class hold
 * global resources until {@linkcode dispose} method is called.
 */
export class StandaloneRulesetEditor implements IDisposable {
  private model: monaco.editor.ITextModel;

  private sharedData: StandaloneEditorSharedData = { savedViewState: undefined };

  /**
   * Instantiates a monaco editor for a specific {@linkcode EditableRuleset}. If multiple editors are created for the
   * same ruleset, they share the same underlying monaco editor model.
   * @param editableRuleset Ruleset that is going to be associated with the editor.
   */
  constructor(editableRuleset: EditableRuleset) {
    const uri = monaco.Uri.parse(`presentation-rules-editor://rulesets/${editableRuleset.id}.ruleset.json`);
    this.model = monaco.editor.getModel(uri)
      ?? monaco.editor.createModel(JSON.stringify(editableRuleset.rulesetContent, undefined, 2), "json", uri);
    this.Component = createStandaloneEditor(this.model, editableRuleset, this.sharedData);
  }

  /** React component that renders a monaco editor for the associated {@linkcode EditableRuleset}. */
  public Component: (props: StandaloneRulesetEditorProps) => React.ReactElement;

  public dispose(): void {
    this.model.dispose();
  }
}

interface StandaloneEditorSharedData {
  savedViewState: monaco.editor.ICodeEditorViewState | undefined;
}

export interface StandaloneRulesetEditorProps {
  /** Width of the editor element. */
  width: number;

  /** Height of the editor element. */
  height: number;
}

/** A single ruleset editor that manages its own  */
function createStandaloneEditor(
  model: monaco.editor.ITextModel,
  ruleset: EditableRuleset,
  sharedData: StandaloneEditorSharedData,
): (props: StandaloneRulesetEditorProps) => React.ReactElement {
  return function StandaloneEditorComponent(props: StandaloneRulesetEditorProps): React.ReactElement {
    const divRef = React.useRef<HTMLDivElement>(null);
    const buttonWidgetRef = React.useRef<HTMLDivElement>(null);
    const editorRef = React.useRef<monaco.editor.IStandaloneCodeEditor>();

    const [buttonIsVisible, setButtonIsVisible] = React.useState(false);

    React.useLayoutEffect(
      () => {
        assert(divRef.current !== null);
        assert(buttonWidgetRef.current !== null);

        editorRef.current = monaco.editor.create(
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

        // editorRef.current.addOverlayWidget({
        //   getId: () => "widget-submit-button",
        //   getDomNode: () => {
        //     assert(buttonWidgetRef.current !== null);
        //     setButtonIsVisible(true);
        //     return buttonWidgetRef.current;
        //   },
        //   getPosition: () => ({ preference: monaco.editor.OverlayWidgetPositionPreference.TOP_RIGHT_CORNER }),
        // });

        contributeToMonacoEditor(
          monaco,
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
        <div ref={buttonWidgetRef} className="widget-submit-ruleset">
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
  fileMatch?: string[] | undefined;
}

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
        uri: monacoModule.Uri.file("@itwin/presentation-rules-editor/Ruleset.schema.json").toString(),
        fileMatch: settings.fileMatch ?? ["*.ruleset.json"],
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
        submitRuleset(JSON.parse(editor.getValue()) as Ruleset);
      },
    });
  }
}

let initialized = false;

export interface UseStandaloneRulesetEditorReturnType {
  editableRuleset: EditableRuleset;
  rulesetEditor: StandaloneRulesetEditor;
}

export interface UseStandaloneRulesetEditorParameters {
  initialRuleset: Ruleset;
}

/** Instantiates and manages the lifetimes of {@linkcode EditableRuleset} and {@linkcode StandaloneRulesetEditor}. */
export function useStandaloneRulesetEditor(
  params: UseStandaloneRulesetEditorParameters,
): UseStandaloneRulesetEditorReturnType {
  const result = React.useRef(undefined as unknown as UseStandaloneRulesetEditorReturnType);
  if (result.current === undefined) {
    const editableRuleset = new EditableRuleset(params);
    const rulesetEditor = new StandaloneRulesetEditor(editableRuleset);
    result.current = { editableRuleset, rulesetEditor };
  }

  React.useEffect(
    () => {
      return () => {
        result.current.rulesetEditor.dispose();
        result.current.editableRuleset.dispose();
      };
    },
    [],
  );

  return result.current;
}
