/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import "./InitializedApp.scss";
import * as monaco from "monaco-editor";
import * as React from "react";
import { WidgetState } from "@itwin/appui-abstract";
import { MessageManager, StatusMessageRenderer } from "@itwin/appui-react";
import {
  CheckpointConnection, IModelApp, IModelConnection, NotifyMessageDetails, OutputMessagePriority, OutputMessageType,
} from "@itwin/core-frontend";
import { ChildNodeSpecificationTypes, ContentSpecificationTypes, Ruleset, RuleTypes } from "@itwin/presentation-common";
import { EditableRuleset, SoloRulesetEditor } from "@itwin/presentation-rules-editor-react";
import { BackendApi } from "./api/BackendApi";
import { ContentTabs } from "./content-tabs/ContentTabs";
import { IModelIdentifier, isSnapshotIModel } from "./IModelIdentifier";
import { backendApiContext } from "./ITwinJsAppContext";
import { Frontstage } from "./ui-framework/Frontstage";
import { StagePanel, StagePanelZone } from "./ui-framework/StagePanel";
import { UIFramework } from "./ui-framework/UIFramework";
import { Widget } from "./ui-framework/Widget/Widget";
import { PropertyGridWidget } from "./widgets/PropertyGridWidget";
import { TreeWidget } from "./widgets/TreeWidget";

export interface InitializedAppProps {
  backendApi: BackendApi;
  imodelIdentifier: IModelIdentifier;
}

export function InitializedApp(props: InitializedAppProps): React.ReactElement | null {
  const imodel = useIModel(props.backendApi, props.imodelIdentifier);
  const { editableRuleset, rulesetEditor } = useSoloRulesetEditor(defaultRuleset);

  return (
    <backendApiContext.Provider value={props.backendApi}>
      <div className="content">
        <UIFramework>
          <Frontstage
            rightPanel={
              <StagePanel size={450}>
                <StagePanelZone>
                  <Widget
                    id="TreeWidget"
                    label={IModelApp.localization.getLocalizedString("App:label:tree-widget")}
                    defaultState={WidgetState.Open}
                  >
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
          >
            <ContentTabs imodel={imodel} editor={rulesetEditor} />
          </Frontstage>
        </UIFramework>
        <StatusMessageRenderer />
      </div>
    </backendApiContext.Provider>
  );
}

const defaultRuleset: Ruleset = {
  id: "Ruleset1",
  rules: [
    {
      ruleType: RuleTypes.RootNodes,
      specifications: [{
        specType: ChildNodeSpecificationTypes.InstanceNodesOfSpecificClasses,
        classes: {
          schemaName: "BisCore",
          classNames: ["Element"],
        },
        arePolymorphic: true,
        groupByClass: true,
      }],
    },
    {
      ruleType: RuleTypes.Content,
      specifications: [{ specType: ContentSpecificationTypes.SelectedNodeInstances }],
    },
  ],
};

function useIModel(backendApi: BackendApi, imodelIdentifier: IModelIdentifier): IModelConnection | undefined {
  const [imodel, setIModel] = React.useState<IModelConnection>();

  React.useEffect(
    () => {
      setIModel(undefined);

      let disposed = false;
      let imodelPromise: Promise<IModelConnection>;
      void (async () => {
        try {
          imodelPromise = isSnapshotIModel(imodelIdentifier)
            ? backendApi.openIModel(imodelIdentifier)
            : CheckpointConnection.openRemote(imodelIdentifier.itwinId, imodelIdentifier.imodelId);
          const openedIModel = await imodelPromise;
          if (!disposed) {
            setIModel(openedIModel);
          }
        } catch (error) {
          if (isSnapshotIModel(imodelIdentifier)) {
            displayIModelError(
              IModelApp.localization.getLocalizedString("App:error:imodel-open-local", { imodel: imodelIdentifier }),
              error,
            );
          } else {
            displayIModelError(IModelApp.localization.getLocalizedString("App:error:imodel-open-remote"), error);
          }
        }
      })();

      return () => {
        disposed = true;
        void (async () => {
          const openedIModel = await imodelPromise;
          try {
            await openedIModel.close();
          } catch (error) {
            if (isSnapshotIModel(imodelIdentifier)) {
              displayIModelError(
                IModelApp.localization.getLocalizedString("App:error:imodel-close-local", { imodel: imodelIdentifier }),
                error,
              );
            } else {
              displayIModelError(IModelApp.localization.getLocalizedString("App:error:imodel-close-remote"), error);
            }
          }
        })();
      };
    },
    [backendApi, imodelIdentifier],
  );

  return imodel;
}

function displayIModelError(message: string, error: unknown): void {
  const errorMessage = (error && typeof error === "object") ? (error as { message: unknown }).message : error;
  displayErrorToast(message, typeof errorMessage === "string" ? errorMessage : undefined);
}

function displayErrorToast(messageShort: string, messageDetail: string | undefined): void {
  const messageDetails = new NotifyMessageDetails(
    OutputMessagePriority.Error,
    messageShort,
    messageDetail,
    OutputMessageType.Toast,
  );
  MessageManager.outputMessage(messageDetails);
}

interface UseSoloRulesetEditorReturnType {
  editableRuleset: EditableRuleset;
  rulesetEditor: SoloRulesetEditor;
}

/** Instantiates and manages the lifetimes of {@linkcode EditableRuleset} and {@linkcode SoloRulesetEditor}. */
function useSoloRulesetEditor(initialRuleset: Ruleset): UseSoloRulesetEditorReturnType {
  const result = React.useRef(undefined as unknown as UseSoloRulesetEditorReturnType);
  if (result.current === undefined) {
    const editableRuleset = new EditableRuleset({ initialRuleset });
    const rulesetEditor = new SoloRulesetEditor({ editableRuleset, monaco });
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
