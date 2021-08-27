/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import "./InitializedApp.scss";
import * as React from "react";
import {
  IModelApp, IModelConnection, NotifyMessageDetails, OutputMessagePriority, OutputMessageType,
} from "@bentley/imodeljs-frontend";
import {
  ChildNodeSpecificationTypes, ContentSpecificationTypes, RegisteredRuleset, Ruleset, RuleTypes,
} from "@bentley/presentation-common";
import { Presentation } from "@bentley/presentation-frontend";
import { WidgetState } from "@bentley/ui-abstract";
import { MessageManager, StatusMessageRenderer } from "@bentley/ui-framework";
import { appLayoutContext } from "../AppContext";
import { LoadingIndicator } from "../utils/LoadingIndicator";
import { BackendApi } from "./api/BackendApi";
import { ContentTabs } from "./content-tabs/ContentTabs";
import { IModelSelector } from "./imodel-selector/IModelSelector";
import { backendApiContext } from "./ITwinJsAppContext";
import { Frontstage } from "./ui-framework/Frontstage";
import { StagePanel, StagePanelZone } from "./ui-framework/StagePanel";
import { UIFramework } from "./ui-framework/UIFramework";
import { Widget } from "./ui-framework/Widget/Widget";
import { SelectIModelHint } from "./utils/SelectIModelHint";
import { PropertyGrid } from "./widgets/PropertyGrid";
import { Tree } from "./widgets/Tree";

export interface InitializedAppProps {
  backendApi: BackendApi;
}

export function InitializedApp(props: InitializedAppProps): React.ReactElement {
  const [imodelPath, setIModelPath] = React.useState("");
  const imodel = useIModel(props.backendApi, imodelPath);
  const [registeredRuleset, modifyRuleset] = useRegisteredRuleset();

  const { setBreadcrumbs } = React.useContext(appLayoutContext);
  React.useEffect(
    () => {
      setBreadcrumbs([
        <IModelSelector key="imodel-selector" selectedIModelPath={imodelPath} setSelectedIModelPath={setIModelPath} />,
      ]);
    },
    [imodelPath, setBreadcrumbs],
  );

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
                        : <SelectIModelHint />
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
                        : <SelectIModelHint />
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

function useIModel(backendApi: BackendApi, path: string): IModelConnection | undefined {
  const [imodel, setIModel] = React.useState<IModelConnection>();

  React.useEffect(
    () => {
      let disposed = false;
      let imodelPromise: Promise<IModelConnection | undefined>;
      void (async () => {
        try {
          imodelPromise = (path === "" ? Promise.resolve(undefined) : backendApi.openIModel(path));
          const openedIModel = await imodelPromise;
          if (!disposed) {
            setIModel(openedIModel);
          }
        } catch (error) {
          displayErrorToast(IModelApp.i18n.translate("App:error:imodel-open", { imodel: path }), error.message);
        }
      })();

      return () => {
        disposed = true;
        void (async () => {
          try {
            const openedIModel = await imodelPromise;
            if (openedIModel !== undefined) {
              await openedIModel.close();
            }
          } catch (error) {
            displayErrorToast(IModelApp.i18n.translate("App:error:imodel-close", { imodel: path }), error.message);
          }
        })();
      };
    },
    [backendApi, path],
  );

  return imodel;
}

function displayErrorToast(messageShort: string, messageDetail: string): void {
  const messageDetails = new NotifyMessageDetails(
    OutputMessagePriority.Error,
    messageShort,
    messageDetail,
    OutputMessageType.Toast,
  );
  MessageManager.outputMessage(messageDetails);
}
