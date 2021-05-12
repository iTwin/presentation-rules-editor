/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import "./App.scss";
import * as React from "react";
import { IModelConnection, ViewState } from "@bentley/imodeljs-frontend";
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
import { IModelSelector } from "./imodel-selector/IModelSelector";
import { Tree } from "./tree/Tree";

interface AppProps {
  initializer: () => Promise<BackendApi>;
}

export const App: React.FC<AppProps> = ({ initializer }) => {
  const [backendApi, setBackendApi] = React.useState<BackendApi>();
  React.useEffect(
    () => {
      void (async () => { setBackendApi(await initializer()); })();
    },
    [initializer],
  );

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
  const [viewState, setViewState] = React.useState<ViewState>();
  React.useEffect(
    () => {
      if (imodel === undefined) {
        return;
      }

      void (async () => {
        const viewId = await imodel.views.queryDefaultViewId();
        if (viewId) {
          setViewState(await imodel.views.load(viewId));
        }
      })();
    },
    [imodel],
  );

  if (backendApi === undefined) {
    return <span>Initializing...</span>;
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
              }>
              <TabView>
                <TabViewItem label="Editor">
                  <div style={{ width: "100%", height: "100%", padding: 11, boxSizing: "border-box" }}>
                    <textarea style={{ width: "100%", height: "100%", boxSizing: "border-box" }} />
                  </div>
                </TabViewItem>
                <TabViewItem label="Viewport">
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

const UnifiedSelectionViewport = viewWithUnifiedSelection(ViewportComponent);

const defaultRuleset: Ruleset = {
  id: "presentation_rules_editor:default_ruleset",
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
