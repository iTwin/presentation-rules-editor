/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/

import "@itwin/itwinui-layouts-css/styles.css";
import "@itwin/itwinui-react/styles.css";
import "./App.scss";
import * as React from "react";
import { Navigate, Route, Routes, useNavigate } from "react-router";
import { SvgDeveloper, SvgFolderOpened } from "@itwin/itwinui-icons-react";
import { PageLayout } from "@itwin/itwinui-layouts-react";
import { Footer, SidenavButton, SideNavigation, ThemeProvider } from "@itwin/itwinui-react";
import { appNavigationContext, AppNavigationContext } from "./AppContext.js";
import { AppHeader, breadcrumbsContext } from "./AppHeader.js";
import { AuthorizationState, createAuthorizationProvider, SignInCallback, SignInSilent, useAuthorization } from "./Authorization.js";
import { CheckingSignInStatusHint } from "./common/CheckingSignInStatusHint.js";
import { PageNotFound } from "./errors/PageNotFound.js";
import { DemoIModelBrowser } from "./IModelBrowser/DemoIModelBrowser.js";
import { IModelBrowser, IModelBrowserTab, IModelBrowserTabs } from "./IModelBrowser/IModelBrowser.js";
import { ITwinBrowser, ITwinIModelBrowser } from "./IModelBrowser/ITwinIModelBrowser.js";
import { LocalIModelBrowser } from "./IModelBrowser/LocalIModelBrowser.js";
import { isSnapshotIModel } from "./ITwinJsApp/IModelIdentifier.js";
import { ITwinJsAppData, OpenIModel } from "./OpenIModel.js";
import { appInsightsConnectionString, applyUrlPrefix, clientId } from "./utils/Environment.js";

export function App(): React.ReactElement {
  const appContextValue = useAppNavigationContext();
  const [breadcrumbs, setBreadcrumbs] = React.useState<React.ReactNode[]>([]);
  return (
    <AuthorizationProvider>
      <appNavigationContext.Provider value={appContextValue}>
        <breadcrumbsContext.Provider value={{ breadcrumbs, setBreadcrumbs }}>
          <ThemeProvider theme="os">
            <PageLayout>
              <PageLayout.Header>
                <AppHeader />
              </PageLayout.Header>
              <Routes>
                <Route path="/auth/callback" element={<SignInCallback />} />
                <Route path="/auth/silent" element={<SignInSilent />} />
                <Route path="/*" element={<Main />} />
              </Routes>
              <Footer />
            </PageLayout>
          </ThemeProvider>
        </breadcrumbsContext.Provider>
      </appNavigationContext.Provider>
    </AuthorizationProvider>
  );
}

const AuthorizationProvider = clientId
  ? createAuthorizationProvider({
      authority: applyUrlPrefix("https://ims.bentley.com"),
      client_id: clientId,
      redirect_uri: "/auth/callback",
      silent_redirect_uri: "/auth/silent",
      post_logout_redirect_uri: "/",
      scope: "itwin-platform openid profile",
    })
  : (props: React.PropsWithChildren<object>) => <>{props.children}</>;

function Main(): React.ReactElement {
  useApplicationInsights();
  const iTwinJsApp = useBackgroundITwinJsAppLoading();

  return (
    <Routes>
      <Route index element={<IndexRedirect />} />
      <Route path="open-imodel" element={<OpenIModel iTwinJsApp={iTwinJsApp} />} />
      <Route path="browse-imodels" element={<IModelBrowser backendApiPromise={iTwinJsApp?.backendApiPromise} />}>
        <Route index element={<Navigate replace to={import.meta.env.DEPLOYMENT_TYPE === "web" ? "iTwins" : "local"} />} />
        {import.meta.env.DEPLOYMENT_TYPE !== "web" && (
          <Route path="local" element={<IModelBrowserTabs activeTab={IModelBrowserTab.Local} />}>
            <Route index element={<LocalIModelBrowser backendApiPromise={iTwinJsApp?.backendApiPromise} />} />
          </Route>
        )}
        <Route path="iTwins" element={<IModelBrowserTabs activeTab={IModelBrowserTab.iTwins} />}>
          <Route index element={<ITwinBrowser />} />
          <Route path=":iTwin" element={<ITwinIModelBrowser />} />
        </Route>
        <Route path="demo" element={<IModelBrowserTabs activeTab={IModelBrowserTab.Demo} />}>
          <Route index element={<DemoIModelBrowser />} />
        </Route>
      </Route>
      <Route
        path="*"
        element={
          <PageLayout.Content>
            <PageNotFound />
          </PageLayout.Content>
        }
      />
    </Routes>
  );
}

function useAppNavigationContext(): AppNavigationContext {
  const navigate = useNavigate();
  return React.useMemo(
    () => ({
      openRulesetEditor: async (iModelIdentifier) => {
        if (!iModelIdentifier) {
          await navigate("/open-imodel");
        } else {
          await navigate(
            `/open-imodel?${
              isSnapshotIModel(iModelIdentifier) ? `snapshot=${iModelIdentifier}` : `iTwinId=${iModelIdentifier.iTwinId}&iModelId=${iModelIdentifier.iModelId}`
            }`,
          );
        }
      },
      openIModelBrowser: async (tab) => {
        if (!tab) {
          await navigate("/browse-imodels");
        } else {
          await navigate(`/browse-imodels/${tab}`);
        }
      },
    }),
    [navigate],
  );
}

function useBackgroundITwinJsAppLoading(): ITwinJsAppData | undefined {
  const [itwinJsApp, setITwinJsApp] = React.useState<ITwinJsAppData>();
  React.useEffect(() => {
    let disposed = false;
    void (async () => {
      const { ITwinJsApp: component, initializeApp } = await import("./ITwinJsApp/ITwinJsApp.js");
      if (!disposed) {
        setITwinJsApp({ component, backendApiPromise: initializeApp() });
      }
    })();

    return () => {
      disposed = true;
    };
  }, []);
  return itwinJsApp;
}

function useApplicationInsights(): void {
  React.useEffect(() => {
    if (appInsightsConnectionString) {
      void (async () => {
        try {
          const { initialize } = await import("./ApplicationInsights.js");
          initialize(appInsightsConnectionString);
        } catch (error) {
          // eslint-disable-next-line no-console
          console.warn("ApplicationInsights initialization failed", error);
        }
      })();
    }
  }, []);
}

interface AppSideNavigationProps {
  activePage: AppPage;
}

export enum AppPage {
  RulesetEditor = "ruleset-editor",
  iModelBrowser = "imodel-browser",
}

export const AppSideNavigation = React.memo<AppSideNavigationProps>(function AppSideNavigation(props) {
  const navigation = React.useContext(appNavigationContext);
  return (
    <PageLayout.SideNavigation>
      <SideNavigation
        expanderPlacement="bottom"
        items={[
          <SidenavButton
            key={AppPage.RulesetEditor}
            startIcon={<SvgDeveloper />}
            isActive={props.activePage === AppPage.RulesetEditor}
            onClick={async () => navigation.openRulesetEditor()}
          >
            Ruleset Editor
          </SidenavButton>,
          <SidenavButton
            key={AppPage.iModelBrowser}
            startIcon={<SvgFolderOpened />}
            isActive={props.activePage === AppPage.iModelBrowser}
            onClick={async () => navigation.openIModelBrowser()}
          >
            Browse iModels
          </SidenavButton>,
        ]}
      />
    </PageLayout.SideNavigation>
  );
});

function IndexRedirect(): React.ReactElement {
  const { state } = useAuthorization();

  if (import.meta.env.DEPLOYMENT_TYPE !== "web") {
    return <Navigate replace to={"/browse-imodels"} />;
  }

  if (state === AuthorizationState.Pending) {
    return (
      <>
        <div />
        <CheckingSignInStatusHint />
      </>
    );
  }

  return <Navigate replace to={state === AuthorizationState.SignedIn ? "/browse-imodels" : "/open-imodel"} />;
}
