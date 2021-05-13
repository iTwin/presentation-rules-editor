/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import "./App.scss";
import * as React from "react";
import { Id64 } from "@bentley/bentleyjs-core";
import { IModelApp, IModelConnection, ViewState } from "@bentley/imodeljs-frontend";
import {
  ChildNodeSpecificationTypes, ContentSpecificationTypes, RegisteredRuleset, Ruleset, RuleTypes,
} from "@bentley/presentation-common";
import { viewWithUnifiedSelection } from "@bentley/presentation-components";
import { Presentation } from "@bentley/presentation-frontend";
import { ViewportComponent } from "@bentley/ui-components";
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

interface AppProps {
  initializer: () => Promise<BackendApi>;
}

export const App: React.FC<AppProps> = ({ initializer }) => {
  const backendApi = useBackendApi(initializer);

  const [ruleset, setRuleset] = React.useState<RegisteredRuleset>();
  React.useEffect(
    () => {
      if (backendApi !== undefined) {
        void (async () => {
          setRuleset(await Presentation.presentation.rulesets().add(defaultRuleset));
        })();
      }
    },
    [backendApi],
  );

  const [imodel, setIModel] = React.useState<IModelConnection>();
  const viewState = useViewState(imodel);

  const [initialRulesetText] = React.useState(() => JSON.stringify(defaultRuleset, undefined, 2));

  if (backendApi === undefined) {
    return <span>Initializing...</span>;
  }

  function submitRuleset(rulesetText: string): void {
    if (ruleset !== undefined) {
      void Presentation.presentation.rulesets().modify(ruleset, JSON.parse(rulesetText));
    }
  }

  return (
    <div className="app">
      <backendApiContext.Provider value={backendApi}>
        <IModelSelector onIModelSelected={setIModel} />
        <div>
          <UIFramework>
            <Frontstage
              rightPanel={
                <StagePanel size={370}>
                  <Widget id="TreeWidget">
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
        </div>
      </backendApiContext.Provider>
    </div>
  );
};

function useBackendApi(initializer: () => Promise<BackendApi>): BackendApi | undefined {
  const [backendApi, setBackendApi] = React.useState<BackendApi>();
  React.useEffect(
    () => {
      void (async () => { setBackendApi(await initializer()); })();
    },
    [initializer],
  );

  return backendApi;
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
