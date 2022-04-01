/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import "./App.scss";
import * as React from "react";
import { BrowserRouter, Route, Switch } from "react-router-dom";
import { Footer } from "@itwin/itwinui-react";
import { appLayoutContext, AppLayoutContext, AppTab } from "./AppContext";
import { AppHeader } from "./AppHeader";
import { createAuthorizationProvider, SignInCallback, SignInSilent, useAuthorization } from "./Authorization";
import { LoadingIndicator } from "./common/LoadingIndicator";
import { PageNotFound } from "./errors/PageNotFound";
import { Homepage } from "./Homepage/Homepage";
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
            <Switch>
              <Route path="/auth/callback">
                <SignInCallback>
                  <LoadingIndicator>
                    Signing in...
                  </LoadingIndicator>
                </SignInCallback>
              </Route>
              <Route path="/auth/silent" component={SignInSilent} />
              <Route path="/" component={Main} />
            </Switch>
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
  const itwinJsApp = useBackgroundITwinJsAppLoading();

  return (
    <Switch>
      <Route path="/" exact={true}>
        <Homepage backendApiPromise={itwinJsApp?.backendApiPromise} />
      </Route>
      <Route path="/open-imodel">
        {
          (props) => {
            const params = new URLSearchParams(props.location.search);
            const snapshotPath = params.get("snapshot");
            if (snapshotPath) {
              return process.env.DEPLOYMENT_TYPE !== "web"
                ? <OpenSnapshotIModel iTwinJsApp={itwinJsApp} iModelIdentifier={snapshotPath} />
                : <PageNotFound />;
            }

            // Attempt to get properly capitalized parameters and fallback to legacy capitalisation
            const iTwinId = params.get("iTwinId") ?? params.get("itwinId");
            const iModelId = params.get("iModelId") ?? params.get("imodelId");
            if (iTwinId && iModelId) {
              return <OpenITwinIModel iTwinJsApp={itwinJsApp} iModelIdentifier={{ iTwinId, iModelId }} />;
            }

            return <PageNotFound />;
          }
        }
      </Route>
      <Route path="*" component={PageNotFound} />
    </Switch>
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
