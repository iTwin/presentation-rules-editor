/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import "./App.scss";
import * as React from "react";
import { BackendApi } from "../api/BackendApi";
import { InitializedApp } from "./InitializedApp";

interface AppProps {
  initializer: () => Promise<BackendApi>;
}

export const App: React.FC<AppProps> = ({ initializer }) => {
  const backendApi = useBackendApi(initializer);

  if (backendApi === undefined) {
    return <span>Initializing...</span>;
  }

  return (
    <div className="app">
      <InitializedApp backendApi={backendApi} />
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
