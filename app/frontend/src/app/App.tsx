/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import "./App.scss";
import * as React from "react";
import { IModelApp, IModelConnection } from "@bentley/imodeljs-frontend";
import {
  ChildNodeSpecificationTypes, ContentSpecificationTypes, RegisteredRuleset, Ruleset, RuleTypes,
} from "@bentley/presentation-common";
import { Presentation } from "@bentley/presentation-frontend";
import { TestComponent } from "@bentley/presentation-rules-editor";
import { BackendApi } from "../api/BackendApi";
import { backendApiContext } from "./AppContext";
import { IModelSelector } from "./imodel-selector/IModelSelector";
import { Tree } from "./tree/Tree";
import { ViewportContentComponent } from "./viewport/ViewportContentControl";

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
        void (async () => setRuleset(await Presentation.presentation.rulesets().add(defaultRuleset)))();
      }
    },
    [backendApi],
  );

  const [imodel, setImodel] = React.useState<IModelConnection>();

  if (backendApi === undefined) {
    return <span>Initializing...</span>;
  }

  return (
    <div className="app">
      <backendApiContext.Provider value={backendApi}>
        <div className="app-header">
          <h2>{IModelApp.i18n.translate("App:banner-message")}</h2>
          <TestComponent />
        </div>
        <IModelSelector onIModelSelected={setImodel} />
        {imodel && <ViewportContentComponent imodel={imodel} />}
        {imodel && ruleset && <Tree imodel={imodel} rulesetId={ruleset.id} />}
      </backendApiContext.Provider>
    </div>
  );
};

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
