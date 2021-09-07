/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import "./InitializedApp.scss";
import * as React from "react";
import {
  CheckpointConnection, IModelApp, IModelConnection, NotifyMessageDetails, OutputMessagePriority, OutputMessageType,
} from "@bentley/imodeljs-frontend";
import {
  ChildNodeSpecificationTypes, ContentSpecificationTypes, RegisteredRuleset, Ruleset, RuleTypes,
} from "@bentley/presentation-common";
import { Presentation } from "@bentley/presentation-frontend";
import { WidgetState } from "@bentley/ui-abstract";
import { MessageManager, StatusMessageRenderer } from "@bentley/ui-framework";
import { LoadingIndicator } from "../utils/LoadingIndicator";
import { BackendApi } from "./api/BackendApi";
import { ContentTabs } from "./content-tabs/ContentTabs";
import { IModelIdentifier, isSnapshotIModel } from "./IModelIdentifier";
import { backendApiContext } from "./ITwinJsAppContext";
import { Frontstage } from "./ui-framework/Frontstage";
import { StagePanel, StagePanelZone } from "./ui-framework/StagePanel";
import { UIFramework } from "./ui-framework/UIFramework";
import { Widget } from "./ui-framework/Widget/Widget";
import { OpeningIModelHint } from "./utils/OpeningIModelHint";
import { PropertyGrid } from "./widgets/PropertyGrid";
import { Tree } from "./widgets/Tree";

export interface InitializedAppProps {
  backendApi: BackendApi;
  imodelIdentifier: IModelIdentifier;
}

export function InitializedApp(props: InitializedAppProps): React.ReactElement {
  const imodel = useIModel(props.backendApi, props.imodelIdentifier);
  const [registeredRuleset, modifyRuleset] = useRegisteredRuleset();

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
                    label={IModelApp.i18n.translate("App:label:tree-widget")}
                    defaultState={WidgetState.Open}
                  >
                    {
                      imodel !== undefined
                        ? registeredRuleset !== undefined
                          ? <Tree imodel={imodel} rulesetId={registeredRuleset.id} />
                          : <LoadingIndicator>Loading...</LoadingIndicator>
                        : <OpeningIModelHint />
                    }
                  </Widget>
                </StagePanelZone>
                <StagePanelZone>
                  <Widget
                    id="PropertyGridWidget"
                    label={IModelApp.i18n.translate("App:label:property-grid-widget")}
                    defaultState={WidgetState.Open}
                  >
                    {
                      imodel !== undefined
                        ? registeredRuleset !== undefined
                          ? <PropertyGrid imodel={imodel} ruleset={registeredRuleset} />
                          : <LoadingIndicator>Loading...</LoadingIndicator>
                        : <OpeningIModelHint />
                    }
                  </Widget>
                </StagePanelZone>
              </StagePanel>
            }
          >
            <ContentTabs imodel={imodel} defaultRuleset={defaultRulesetText} submitRuleset={modifyRuleset} />
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

const defaultRulesetText = JSON.stringify(defaultRuleset, undefined, 2);

function useRegisteredRuleset(): [RegisteredRuleset | undefined, (newRuleset: Ruleset) => Promise<void>] {
  interface MutableState {
    lastRegisteredRuleset: RegisteredRuleset | undefined;
    componentIsDisposed: boolean;
  }

  const mutableState = React.useRef<MutableState>({
    lastRegisteredRuleset: undefined,
    componentIsDisposed: false,
  }).current;

  const [registeredRuleset, setRegisteredRuleset] = React.useState<RegisteredRuleset>();

  React.useEffect(
    () => {
      // On mount, register the default ruleset
      void (async () => {
        const addedRuleset = await Presentation.presentation.rulesets().add(defaultRuleset);
        if (mutableState.componentIsDisposed) {
          await Presentation.presentation.rulesets().remove(addedRuleset);
          return;
        }

        mutableState.lastRegisteredRuleset = addedRuleset;
        setRegisteredRuleset(addedRuleset);
      })();

      // On unmount, unregister the last registered ruleset
      return () => {
        mutableState.componentIsDisposed = true;
        if (mutableState.lastRegisteredRuleset !== undefined) {
          void Presentation.presentation.rulesets().remove(mutableState.lastRegisteredRuleset);
          mutableState.lastRegisteredRuleset = undefined;
        }
      };
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const modifyRuleset = async (newRuleset: Ruleset) => {
    if (mutableState.lastRegisteredRuleset === undefined) {
      return;
    }

    const modifiedRuleset = await Presentation.presentation.rulesets()
      .modify(mutableState.lastRegisteredRuleset, newRuleset);
    if (mutableState.componentIsDisposed) {
      await Presentation.presentation.rulesets().remove(modifiedRuleset);
      return;
    }

    mutableState.lastRegisteredRuleset = modifiedRuleset;
    setRegisteredRuleset(modifiedRuleset);
  };

  return [registeredRuleset, modifyRuleset];
}

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
              IModelApp.i18n.translate("App:error:imodel-open-local", { imodel: imodelIdentifier }),
              error,
            );
          } else {
            displayIModelError(IModelApp.i18n.translate("App:error:imodel-open-remote"), error);
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
                IModelApp.i18n.translate("App:error:imodel-close-local", { imodel: imodelIdentifier }),
                error,
              );
            } else {
              displayIModelError(IModelApp.i18n.translate("App:error:imodel-close-remote"), error);
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
  displayErrorToast(
    message,
    typeof errorMessage === "string" ? errorMessage : undefined,
  );
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
