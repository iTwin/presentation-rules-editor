/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import * as React from "react";
import {
  IModelApp, IModelConnection, NotifyMessageDetails, OutputMessagePriority, OutputMessageType,
} from "@bentley/imodeljs-frontend";
import {
  ChildNodeSpecificationTypes, ContentSpecificationTypes, RegisteredRuleset, Ruleset, RuleTypes,
} from "@bentley/presentation-common";
import { Presentation } from "@bentley/presentation-frontend";
import { MessageManager, MessageRenderer } from "@bentley/ui-framework";
import { BackendApi } from "../api/BackendApi";
import { Frontstage } from "../ui-framework/Frontstage";
import { StagePanel } from "../ui-framework/StagePanel";
import { TabView, TabViewItem } from "../ui-framework/TabView/TabView";
import { UIFramework } from "../ui-framework/UIFramework";
import { Widget } from "../ui-framework/Widget";
import { backendApiContext } from "./AppContext";
import { Editor } from "./editor/Editor";
import { IModelSelector } from "./imodel-selector/IModelSelector";
import { Tree } from "./tree/Tree";
import { Viewport } from "./viewport/Viewport";

export interface InitializedAppProps {
  backendApi: BackendApi;
}

export function InitializedApp(props: InitializedAppProps): React.ReactElement {
  const [ruleset, setRuleset] = React.useState<RegisteredRuleset>();
  React.useEffect(
    () => {
      void (async () => { setRuleset(await Presentation.presentation.rulesets().add(defaultRuleset)); })();
    },
    [],
  );

  const [imodelPath, setIModelPath] = React.useState("");
  const imodel = useIModel(props.backendApi, imodelPath);
  const [initialRulesetText] = React.useState(() => JSON.stringify(defaultRuleset, undefined, 2));

  async function submitRuleset(rulesetText: string): Promise<void> {
    if (ruleset !== undefined) {
      setRuleset(await Presentation.presentation.rulesets().modify(ruleset, JSON.parse(rulesetText)));
    }
  }

  return (
    <backendApiContext.Provider value={props.backendApi}>
      <IModelSelector selectedIModelPath={imodelPath} setSelectedIModelPath={setIModelPath} />
      <div>
        <UIFramework>
          <Frontstage
            rightPanel={
              <StagePanel size={370}>
                <Widget id="TreeWidget" label={IModelApp.i18n.translate("App:label:tree-widget")}>
                  {imodel && ruleset && <Tree imodel={imodel} ruleset={ruleset} />}
                </Widget>
              </StagePanel>
            }
          >
            <TabView>
              <TabViewItem label={IModelApp.i18n.translate("App:label:editor")}>
                <Editor initialText={initialRulesetText} onTextSubmitted={submitRuleset} />
              </TabViewItem>
              <TabViewItem label={IModelApp.i18n.translate("App:label:viewport")}>
                {imodel && <Viewport imodel={imodel} />}
              </TabViewItem>
            </TabView>
          </Frontstage>
        </UIFramework>
        <MessageRenderer />
      </div>
    </backendApiContext.Provider>
  );
}

const defaultRuleset: Ruleset = {
  id: "Ruleset1",
  supportedSchemas: {
    schemaNames: [
      "BisCore",
      "Functional",
    ],
  },
  rules: [
    {
      ruleType: RuleTypes.RootNodes,
      specifications: [{
        specType: ChildNodeSpecificationTypes.InstanceNodesOfSpecificClasses,
        classes: {
          schemaName: "Functional",
          classNames: ["FunctionalElement"],
        },
        arePolymorphic: true,
        groupByClass: true,
        groupByLabel: false,
      }],
    },
    {
      ruleType: RuleTypes.Content,
      specifications: [{ specType: ContentSpecificationTypes.SelectedNodeInstances }],
    },
  ],
};

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
