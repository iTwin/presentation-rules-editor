/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import "./App.scss";
import * as React from "react";
import { BrowserRouter, Route, Routes, useLocation } from "react-router-dom";
import { Footer } from "@itwin/itwinui-react";
import { appLayoutContext, AppLayoutContext, AppTab } from "./AppContext";
import { AppHeader } from "./AppHeader";
import { createAuthorizationProvider, SignInCallback, SignInSilent, useAuthorization } from "./Authorization";
import { PageNotFound } from "./errors/PageNotFound";
import { Homepage } from "./Homepage";
import { ITwinJsAppData, OpenITwinIModel, OpenSnapshotIModel } from "./OpenIModel";
import { applyUrlPrefix } from "./utils/Environment";

export function App(): React.ReactElement {
  const appLayoutContextValue = useAppLayout();
  return (
    <div className="app">
      <AuthorizationProvider>
        <appLayoutContext.Provider value={appLayoutContextValue}>
          <BrowserRouter>
            <AppHeader />
            <Routes>
              <Route path="/auth/callback" element={<SignInCallback />} />
              <Route path="/auth/silent" element={<SignInSilent />} />
              <Route path="/*" element={<Main />} />
            </Routes>
            <Footer />
          </BrowserRouter>
        </appLayoutContext.Provider>
      </AuthorizationProvider>
    </div>
  );
}

function useAppLayout(): AppLayoutContext {
  const [activeTab, setActiveTab] = React.useState(AppTab.Editor);
  const [breadcrumbs, setBreadcrumbs] = React.useState<React.ReactNode[]>([]);
  return { activeTab, setActiveTab, breadcrumbs, setBreadcrumbs };
}

const AuthorizationProvider = process.env.OAUTH_CLIENT_ID
  ? createAuthorizationProvider({
    authority: applyUrlPrefix("https://ims.bentley.com"),
    client_id: process.env.OAUTH_CLIENT_ID,
    redirect_uri: "/auth/callback",
    silent_redirect_uri: "/auth/silent",
    post_logout_redirect_uri: "/",
    scope: "openid profile itwinjs imodels:read projects:read",
  })
  : (props: React.PropsWithChildren<{}>) => <>{props.children}</>;

function Main(): React.ReactElement {
  useApplicationInsights();
  const iTwinJsApp = useBackgroundITwinJsAppLoading();

  return (
    <Routes>
      <Route index element={<Homepage backendApiPromise={iTwinJsApp?.backendApiPromise} />} />
      <Route path="open-imodel" element={<OpenIModel iTwinJsApp={iTwinJsApp} />} />
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
}

function useBackgroundITwinJsAppLoading(): ITwinJsAppData | undefined {
  const [itwinJsApp, setITwinJsApp] = React.useState<ITwinJsAppData>();
  const { userManager } = useAuthorization();

  React.useEffect(
    () => {
      let disposed = false;
      void (async () => {
        const { ITwinJsApp: component, initializeApp } = await import("./ITwinJsApp/ITwinJsApp");
        if (!disposed) {
          setITwinJsApp({ component, backendApiPromise: initializeApp(userManager) });
        }
      })();

      return () => { disposed = true; };
    },
    [userManager],
  );

  return itwinJsApp;
}

function useApplicationInsights(): void {
  React.useEffect(
    () => {
      const connectionString = getConnectionString();
      if (connectionString) {
        void (async () => {
          try {
            const { initialize } = await import("./ApplicationInsights");
            initialize(connectionString);
          } catch (error) {
            // eslint-disable-next-line no-console
            console.warn("ApplicationInsights initialization failed", error);
          }
        })();
      }
    },
    [],
  );

  function getConnectionString(): string | undefined {
    const hostname = window.location.hostname;
    if (hostname.startsWith("dev-")) {
      return process.env.APPLICATION_INSIGHTS_CONNECTION_STRING_DEV;
    }

    if (hostname.startsWith("qa-")) {
      return process.env.APPLICATION_INSIGHTS_CONNECTION_STRING_QA;
    }

    return process.env.APPLICATION_INSIGHTS_CONNECTION_STRING_PROD;
  }
}

interface OpenIModelProps {
  iTwinJsApp: ITwinJsAppData | undefined;
}

function OpenIModel(props: OpenIModelProps): React.ReactElement {
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const snapshotPath = params.get("snapshot");
  if (snapshotPath) {
    return process.env.DEPLOYMENT_TYPE !== "web"
      ? <OpenSnapshotIModel iTwinJsApp={props.iTwinJsApp} iModelIdentifier={snapshotPath} />
      : <PageNotFound />;
  }

  // Attempt to get properly capitalized parameters and fallback to legacy capitalisation
  const iTwinId = params.get("iTwinId") ?? params.get("itwinId");
  const iModelId = params.get("iModelId") ?? params.get("imodelId");
  if (iTwinId && iModelId) {
    return <OpenITwinIModel iTwinJsApp={props.iTwinJsApp} iModelIdentifier={{ iTwinId, iModelId }} />;
  }

  return <PageNotFound />;
}
