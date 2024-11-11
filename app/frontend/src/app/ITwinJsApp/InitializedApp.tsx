/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/

import "./InitializedApp.scss";
import * as monaco from "monaco-editor";
import * as React from "react";
import { StagePanelState, WidgetState } from "@itwin/appui-react";
import { AuthorizationClient } from "@itwin/core-common";
import { IModelApp, IModelConnection, OutputMessagePriority } from "@itwin/core-frontend";
import { useToaster } from "@itwin/itwinui-react";
import { ChildNodeSpecificationTypes, ContentSpecificationTypes, Ruleset, RuleTypes } from "@itwin/presentation-common";
import { EditableRuleset, SoloRulesetEditor } from "@itwin/presentation-rules-editor-react";
import { useIModelBrowserSettings } from "../IModelBrowser/IModelBrowser";
import { applyUrlPrefix } from "../utils/Environment";
import { BackendApi } from "./api/BackendApi";
import { ContentTabs } from "./content-tabs/ContentTabs";
import { areIModelIdentifiersEqual, IModelIdentifier, isDemoIModel, isSnapshotIModel } from "./IModelIdentifier";
import { backendApiContext, rulesetEditorContext, RulesetEditorTab } from "./ITwinJsAppContext";
import { parseEditorState } from "./misc/EditorStateSerializer";
import { displayToast, Toaster } from "./misc/Notifications";
import { Frontstage } from "./ui-framework/Frontstage";
import { StagePanel, StagePanelZone } from "./ui-framework/StagePanel";
import { UIFramework } from "./ui-framework/UIFramework";
import { Widget } from "./ui-framework/Widget/Widget";
import { PropertyGridWidget } from "./widgets/PropertyGridWidget";
import { TableWidget } from "./widgets/TableWidget";
import { TreeWidget } from "./widgets/TreeWidget";

export interface InitializedAppProps {
  backendApi: BackendApi;
  iModelIdentifier: IModelIdentifier;
  authorizationClient: AuthorizationClient | undefined;
}

export function InitializedApp(props: InitializedAppProps): React.ReactElement | null {
  const imodel = useIModel(props.backendApi, props.iModelIdentifier, props.authorizationClient);
  const { editableRuleset, rulesetEditor } = useSoloRulesetEditor(defaultRuleset);
  const [editorContext, setEditorContext] = React.useState({
    activeTab: RulesetEditorTab.Editor,
    setActiveTab: (tab: RulesetEditorTab) => setEditorContext((prevState) => ({ ...prevState, activeTab: tab })),
  });

  return (
    <backendApiContext.Provider value={props.backendApi}>
      <rulesetEditorContext.Provider value={editorContext}>
        <div className="ruleset-editor-content">
          <UIFramework>
            <Frontstage
              rightPanel={
                <StagePanel size={450}>
                  <StagePanelZone>
                    <Widget id="TreeWidget" label={IModelApp.localization.getLocalizedString("App:label:tree-widget")} defaultState={WidgetState.Open}>
                      <TreeWidget imodel={imodel} ruleset={editableRuleset} />
                    </Widget>
                  </StagePanelZone>
                  <StagePanelZone>
                    <Widget
                      id="PropertyGridWidget"
                      label={IModelApp.localization.getLocalizedString("App:label:property-grid-widget")}
                      defaultState={WidgetState.Open}
                    >
                      <PropertyGridWidget imodel={imodel} ruleset={editableRuleset} />
                    </Widget>
                  </StagePanelZone>
                </StagePanel>
              }
              bottomPanel={
                <StagePanel size={300} defaultState={StagePanelState.Minimized}>
                  <StagePanelZone>
                    <Widget id="TableWidget" label={IModelApp.localization.getLocalizedString("App:label:table-widget")} defaultState={WidgetState.Open}>
                      <TableWidget imodel={imodel} ruleset={editableRuleset} />
                    </Widget>
                  </StagePanelZone>
                </StagePanel>
              }
            >
              <ContentTabs imodel={imodel} editor={rulesetEditor} />
            </Frontstage>
          </UIFramework>
        </div>
      </rulesetEditorContext.Provider>
    </backendApiContext.Provider>
  );
}

const defaultRuleset: Ruleset = {
  id: "Ruleset1",
  rules: [
    {
      ruleType: RuleTypes.RootNodes,
      specifications: [
        {
          specType: ChildNodeSpecificationTypes.InstanceNodesOfSpecificClasses,
          classes: {
            schemaName: "BisCore",
            classNames: ["Element"],
          },
          arePolymorphic: true,
          groupByClass: true,
        },
      ],
    },
    {
      ruleType: RuleTypes.Content,
      specifications: [{ specType: ContentSpecificationTypes.SelectedNodeInstances }],
    },
  ],
};

function useIModel(
  backendApi: BackendApi,
  iModelIdentifier: IModelIdentifier,
  authorizationClient: AuthorizationClient | undefined,
): IModelConnection | undefined {
  const [iModel, setIModel] = React.useState<IModelConnection>();
  const toaster = useToaster();
  const setMostRecentIModel = useRecentIModels();

  React.useEffect(() => {
    setIModel(undefined);

    IModelApp.authorizationClient = authorizationClient;
    if (process.env.DEPLOYMENT_TYPE === "web") {
      const backendUrl = "https://api.bentley.com/imodeljs";
      // eslint-disable-next-line @itwin/no-internal
      backendApi.protocol.pathPrefix = isDemoIModel(iModelIdentifier) ? backendUrl : applyUrlPrefix(backendUrl);
    }

    let disposed = false;
    const iModelPromise = backendApi.openIModel(iModelIdentifier);
    void (async () => {
      try {
        const openedIModel = await iModelPromise;
        if (!disposed) {
          setIModel(openedIModel);
          setMostRecentIModel(iModelIdentifier);
        }
      } catch (error) {
        if (isSnapshotIModel(iModelIdentifier)) {
          displayIModelError(toaster, IModelApp.localization.getLocalizedString("App:error:imodel-open-local", { imodel: iModelIdentifier }), error);
        } else {
          displayIModelError(toaster, IModelApp.localization.getLocalizedString("App:error:imodel-open-remote"), error);
        }
      }
    })();

    return () => {
      disposed = true;
      void (async () => {
        const openedIModel = await iModelPromise;
        try {
          await openedIModel.close();
        } catch (error) {
          if (isSnapshotIModel(iModelIdentifier)) {
            displayIModelError(toaster, IModelApp.localization.getLocalizedString("App:error:imodel-close-local", { imodel: iModelIdentifier }), error);
          } else {
            displayIModelError(toaster, IModelApp.localization.getLocalizedString("App:error:imodel-close-remote"), error);
          }
        }
      })();
    };
  }, [authorizationClient, backendApi, iModelIdentifier, setMostRecentIModel, toaster]);

  return iModel;
}

function useRecentIModels(): (iModelIdentifier: IModelIdentifier) => void {
  const [_, setRecentIModels] = useIModelBrowserSettings();
  return React.useRef((iModelIdentifier: IModelIdentifier) => {
    setRecentIModels((prevState) => {
      const newRecentIModels = prevState.recentIModels.filter((value) => !areIModelIdentifiersEqual(value, iModelIdentifier));
      newRecentIModels.push(iModelIdentifier);
      return { ...prevState, recentIModels: newRecentIModels.slice(-10) };
    });
  }).current;
}

function displayIModelError(toaster: Toaster, message: string, error: unknown): void {
  const errorMessage = error && typeof error === "object" ? (error as { message: unknown }).message : error;
  displayToast(toaster, OutputMessagePriority.Error, message, typeof errorMessage === "string" ? errorMessage : undefined);
}

interface UseSoloRulesetEditorReturnType {
  editableRuleset: EditableRuleset;
  rulesetEditor: SoloRulesetEditor;
}

/** Instantiates and manages the lifetimes of {@linkcode EditableRuleset} and {@linkcode SoloRulesetEditor}. */
function useSoloRulesetEditor(initialRuleset: Ruleset): UseSoloRulesetEditorReturnType {
  const result = React.useRef(undefined as unknown as UseSoloRulesetEditorReturnType);
  if (result.current === undefined) {
    const editorSettings = parseEditorState(window.location.hash);
    const editableRuleset = new EditableRuleset({
      initialRuleset: editorSettings ? parseRuleset(editorSettings.ruleset) : initialRuleset,
    });
    const rulesetEditor = new SoloRulesetEditor({
      editableRuleset,
      monaco,
      initialContent: editorSettings?.ruleset,
      contributions: { submitButton: true },
    });
    result.current = { editableRuleset, rulesetEditor };
  }

  React.useEffect(() => {
    return () => {
      result.current.rulesetEditor.dispose();
      result.current.editableRuleset.dispose();
    };
  }, []);

  return result.current;
}

function parseRuleset(rulesetContent: string): Ruleset {
  try {
    const ruleset = JSON.parse(rulesetContent);
    return ruleset;
  } catch {
    return { id: "", rules: [] };
  }
}
