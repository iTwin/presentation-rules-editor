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
import { BackendApi } from "./ITwinJsApp/api/BackendApi";
import { IModelIdentifier, isSnapshotIModel } from "./ITwinJsApp/IModelIdentifier";
import { ITwinJsApp } from "./ITwinJsApp/ITwinJsApp";
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
                <SignInCallback returnTo="/">
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
              return <ITwinJsAppAwaiter itwinJsApp={itwinJsApp} imodelIdentifier={snapshotPath} />;
            }

            const itwinId = params.get("itwinId");
            const imodelId = params.get("imodelId");
            if (itwinId && imodelId) {
              return <ITwinJsAppAwaiter itwinJsApp={itwinJsApp} imodelIdentifier={{ itwinId, imodelId }} />;
            }

            return <PageNotFound />;
          }
        }
      </Route>
      <Route path="*" component={PageNotFound} />
    </Switch>
  );
}

interface ITwinJsAppData {
  component: typeof ITwinJsApp;
  backendApiPromise: Promise<BackendApi>;
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

interface ITwinJsAppAwaiterProps {
  itwinJsApp: ITwinJsAppData | undefined;
  imodelIdentifier: IModelIdentifier;
}

function ITwinJsAppAwaiter(props: ITwinJsAppAwaiterProps): React.ReactElement {
  // Keep the same identifier object between renders if its properties have not changed
  const imodelIdentifier = React.useMemo(
    () => props.imodelIdentifier,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    isSnapshotIModel(props.imodelIdentifier)
      ? [props.imodelIdentifier]
      : [props.imodelIdentifier.imodelId, props.imodelIdentifier.itwinId],
  );

  if (props.itwinJsApp === undefined) {
    return <LoadingIndicator id="app-loader">Loading...</LoadingIndicator>;
  }

  return React.createElement(
    props.itwinJsApp.component,
    {
      backendApiPromise: props.itwinJsApp.backendApiPromise,
      imodelIdentifier,
    },
  );
}
