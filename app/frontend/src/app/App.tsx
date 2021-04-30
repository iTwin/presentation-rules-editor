/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import "./App.scss";
import * as React from "react";
import { IModelApp, IModelConnection } from "@bentley/imodeljs-frontend";
import { TestComponent } from "@bentley/presentation-rules-editor";
import { BackendApi } from "../api/BackendApi";
import { backendApiContext } from "./AppContext";
import { IModelSelector } from "./imodel-selector/IModelSelector";
import { ViewportContentComponent } from "./viewport/ViewportContentControl";

interface AppProps {
  initializer: () => Promise<BackendApi>;
}

export const App: React.FC<AppProps> = (props) => {
  const [backendApi, setBackendApi] = React.useState<BackendApi>();
  const [imodel, setImodel] = React.useState<IModelConnection>();

  React.useEffect(
    () => {
      (async () => { setBackendApi(await props.initializer()); })();
    },
    [],
  );

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
      </backendApiContext.Provider>
    </div>
  );
};
