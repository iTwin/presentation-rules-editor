/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import * as React from "react";
import { Id64 } from "@bentley/bentleyjs-core";
import {
  IModelApp, IModelConnection, NotifyMessageDetails, OutputMessagePriority, OutputMessageType, ViewState,
} from "@bentley/imodeljs-frontend";
import {
  ChildNodeSpecificationTypes, ContentSpecificationTypes, RegisteredRuleset, Ruleset, RuleTypes,
} from "@bentley/presentation-common";
import { viewWithUnifiedSelection } from "@bentley/presentation-components";
import { Presentation } from "@bentley/presentation-frontend";
import { ViewportComponent } from "@bentley/ui-components";
import { MessageManager, MessageRenderer } from "@bentley/ui-framework";
import { BackendApi } from "../api/BackendApi";
import { Frontstage } from "../ui-framework/Frontstage";
import { StagePanel } from "../ui-framework/StagePanel";
import { TabView, TabViewItem } from "../ui-framework/TabView";
import { UIFramework } from "../ui-framework/UIFramework";
import { Widget } from "../ui-framework/Widget";
import { backendApiContext } from "./AppContext";
import { Editor } from "./editor/Editor";
import { IModelSelector } from "./imodel-selector/IModelSelector";
import { Tree } from "./tree/Tree";

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
  const viewState = useViewState(imodel);
  const [initialRulesetText] = React.useState(() => JSON.stringify(defaultRuleset, undefined, 2));

  function submitRuleset(rulesetText: string): void {
    if (ruleset !== undefined) {
      void Presentation.presentation.rulesets().modify(ruleset, JSON.parse(rulesetText));
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
                  {imodel && ruleset && <Tree imodel={imodel} rulesetId={ruleset.id} />}
                </Widget>
              </StagePanel>
            }
          >
            <TabView>
              <TabViewItem label={IModelApp.i18n.translate("App:label:editor")}>
                <Editor initialText={initialRulesetText} onTextSubmitted={submitRuleset} />
              </TabViewItem>
              <TabViewItem label={IModelApp.i18n.translate("App:label:viewport")}>
                {imodel && viewState && <UnifiedSelectionViewport imodel={imodel} viewState={viewState} />}
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
        groupByClass: false,
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
      let imodelPromise: Promise<IModelConnection>;
      void (async () => {
        try {
          const openedIModel = await (path === "" ? Promise.resolve(undefined) : backendApi.openIModel(path));
          setIModel(openedIModel);
        } catch (error) {
          displayErrorToast(IModelApp.i18n.translate("App:error:imodel-open", { imodel: path }), error.message);
        }
      })();

      return () => {
        void (async () => {
          try {
            await (await imodelPromise).close();
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

function useViewState(imodel: IModelConnection | undefined): ViewState | undefined {
  const [viewState, setViewState] = React.useState<ViewState>();
  React.useEffect(
    () => {
      if (imodel === undefined) {
        return;
      }

      void (async () => {
        let viewId = await imodel.views.queryDefaultViewId();
        if (viewId === Id64.invalid) {
          viewId = (await imodel.views.queryProps({ wantPrivate: false, limit: 1 }))[0]?.id ?? Id64.invalid;
        }

        if (viewId !== Id64.invalid) {
          setViewState(await imodel.views.load(viewId));
        }
      })();
    },
    [imodel],
  );

  return viewState;
}

const UnifiedSelectionViewport = viewWithUnifiedSelection(ViewportComponent);

function displayErrorToast(messageShort: string, messageDetail: string): void {
  const messageDetails = new NotifyMessageDetails(
    OutputMessagePriority.Error,
    messageShort,
    messageDetail,
    OutputMessageType.Toast,
  );
  MessageManager.outputMessage(messageDetails);
}
