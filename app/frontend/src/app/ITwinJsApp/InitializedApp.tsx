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

  const [initialRulesetText] = React.useState(() => JSON.stringify(defaultRuleset, undefined, 2));
  const [ruleset, setRuleset] = React.useState(defaultRuleset);
  const registeredRuleset = useRegisteredRuleset(ruleset);

  async function submitRuleset(newRuleset: Ruleset): Promise<void> {
    setRuleset(newRuleset);
  }

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
                        ? registeredRuleset && <Tree imodel={imodel} ruleset={registeredRuleset} />
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
                        ? registeredRuleset && <PropertyGrid imodel={imodel} ruleset={registeredRuleset} />
                        : <SelectIModelHint />
                    }
                  </Widget>
                </StagePanelZone>
              </StagePanel>
            }
          >
            <ContentTabs imodel={imodel} defaultRuleset={initialRulesetText} submitRuleset={submitRuleset} />
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

function useRegisteredRuleset(ruleset: Ruleset): RegisteredRuleset | undefined {
  const [registeredRuleset, setRegisteredRuleset] = React.useState<RegisteredRuleset>();
  React.useEffect(
    () => {
      setRegisteredRuleset(undefined);

      let disposed = false;
      let registeredRulesetPromise: Promise<RegisteredRuleset>;

      void (async () => {
        registeredRulesetPromise = Presentation.presentation.rulesets().add(ruleset);
        if (!disposed) {
          setRegisteredRuleset(await registeredRulesetPromise);
        }
      })();

      return () => {
        disposed = true;
        void (async () => {
          await Presentation.presentation.rulesets().remove(await registeredRulesetPromise);
        })();
      };
    },
    [ruleset],
  );

  return registeredRuleset;
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
