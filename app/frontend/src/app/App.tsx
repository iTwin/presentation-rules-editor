/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import "./App.scss";
import * as React from "react";
import { SvgImodelHollow } from "@itwin/itwinui-icons-react";
import { Footer, Header, HeaderBreadcrumbs, HeaderLogo } from "@itwin/itwinui-react";
import { BackendApi } from "../api/BackendApi";
import { appLayoutContext, AppLayoutContext, AppTab } from "./AppContext";
import { InitializedApp } from "./InitializedApp";

interface AppProps {
  initializer: () => Promise<BackendApi>;
}

export const App: React.FC<AppProps> = ({ initializer }) => {
  const backendApi = useBackendApi(initializer);
  const appLayoutContextValue = useAppLayout();

  return (
    <appLayoutContext.Provider value={appLayoutContextValue}>
      <div className="app">
        <Header
          appLogo={<HeaderLogo logo={<SvgImodelHollow />}>Presentation Rules Editor</HeaderLogo>}
          breadcrumbs={<Breadcrumbs />}
        />
        {backendApi !== undefined ? <InitializedApp backendApi={backendApi} /> : <span>Initializing...</span>}
        <Footer />
      </div>
    </appLayoutContext.Provider>
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

function useAppLayout(): AppLayoutContext {
  const [activeTab, setActiveTab] = React.useState(AppTab.Editor);
  const [breadcrumbs, setBreadcrumbs] = React.useState<React.ReactNode[]>([]);
  return { activeTab, setActiveTab, breadcrumbs, setBreadcrumbs };
}

function Breadcrumbs(): React.ReactElement {
  const appLayout = React.useContext(appLayoutContext);
  return <HeaderBreadcrumbs items={appLayout.breadcrumbs} />;
}
