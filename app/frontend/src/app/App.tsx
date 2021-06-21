/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import "./App.scss";
import * as React from "react";
import { SvgImodelHollow } from "@itwin/itwinui-icons-react";
import { Footer, Header, HeaderBreadcrumbs, HeaderLogo } from "@itwin/itwinui-react";
import { BackendApi } from "../api/BackendApi";
import { InitializedApp } from "./InitializedApp";

interface AppProps {
  initializer: () => Promise<BackendApi>;
}

export const App: React.FC<AppProps> = ({ initializer }) => {
  const backendApi = useBackendApi(initializer);
  const firstBreadcrumbRef = React.useRef<HTMLDivElement>(null);

  return (
    <div className="app">
      <Header
        appLogo={<HeaderLogo logo={<SvgImodelHollow />}>Presentation Rules Editor</HeaderLogo>}
        breadcrumbs={<HeaderBreadcrumbs items={[<div key="imodel-selector" ref={firstBreadcrumbRef} />]} />}
      />
      {
        backendApi !== undefined && firstBreadcrumbRef.current !== null
          ? <InitializedApp backendApi={backendApi} firstBreadcrumbElement={firstBreadcrumbRef.current} />
          : <span>Initializing...</span>
      }
      <Footer />
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
