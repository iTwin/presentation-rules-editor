/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import "./App.scss";
import "@itwin/itwinui-layouts-css/styles.css";
import * as React from "react";
import { Navigate, Route, Routes, useNavigate } from "react-router-dom";
import { SvgDeveloper, SvgFolderOpened } from "@itwin/itwinui-icons-react";
import { PageLayout } from "@itwin/itwinui-layouts-react";
import { Footer, SidenavButton, SideNavigation, ThemeProvider } from "@itwin/itwinui-react";
import { appNavigationContext, AppNavigationContext } from "./AppContext";
import { AppHeader, breadcrumbsContext } from "./AppHeader";
import { AuthorizationState, createAuthorizationProvider, SignInCallback, SignInSilent, useAuthorization } from "./Authorization";
import { CheckingSignInStatusHint } from "./common/CheckingSignInStatusHint";
import { PageNotFound } from "./errors/PageNotFound";
import { DemoIModelBrowser } from "./IModelBrowser/DemoIModelBrowser";
import { IModelBrowser, IModelBrowserTab, IModelBrowserTabs } from "./IModelBrowser/IModelBrowser";
import { ITwinBrowser, ITwinIModelBrowser } from "./IModelBrowser/ITwinIModelBrowser";
import { LocalIModelBrowser } from "./IModelBrowser/LocalIModelBrowser";
import { isSnapshotIModel } from "./ITwinJsApp/IModelIdentifier";
import { ITwinJsAppData, OpenIModel } from "./OpenIModel";
import { appInsightsConnectionString, applyUrlPrefix, clientId } from "./utils/Environment";

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
    scope: "itwinjs imodelaccess:read imodels:read itwins:read openid profile",
  })
  : (props: React.PropsWithChildren<{}>) => <>{props.children}</>;

function Main(): React.ReactElement {
  useApplicationInsights();
  const iTwinJsApp = useBackgroundITwinJsAppLoading();

  return (
    <Routes>
      <Route index element={<IndexRedirect />} />
      <Route path="open-imodel" element={<OpenIModel iTwinJsApp={iTwinJsApp} />} />
      <Route path="browse-imodels" element={<IModelBrowser backendApiPromise={iTwinJsApp?.backendApiPromise} />}>
        <Route index element={<Navigate replace to={process.env.DEPLOYMENT_TYPE === "web" ? "iTwins" : "local"} />} />
        {
          process.env.DEPLOYMENT_TYPE !== "web" &&
          <Route path="local" element={<IModelBrowserTabs activeTab={IModelBrowserTab.Local} />}>
            <Route index element={<LocalIModelBrowser backendApiPromise={iTwinJsApp?.backendApiPromise} />} />
          </Route>
        }
        <Route path="iTwins" element={<IModelBrowserTabs activeTab={IModelBrowserTab.iTwins} />}>
          <Route index element={<ITwinBrowser />} />
          <Route path=":iTwin" element={<ITwinIModelBrowser />} />
        </Route>
        <Route path="demo" element={<IModelBrowserTabs activeTab={IModelBrowserTab.Demo} />}>
          <Route index element={<DemoIModelBrowser />} />
        </Route>
      </Route>
      <Route path="*" element={<PageLayout.Content><PageNotFound /></PageLayout.Content>} />
    </Routes>
  );
}

function useAppNavigationContext(): AppNavigationContext {
  const navigate = useNavigate();
  return React.useMemo(
    () => ({
      openRulesetEditor: (iModelIdentifier) => {
        if (!iModelIdentifier) {
          navigate("/open-imodel");
        } else {
          navigate(
            `/open-imodel?${isSnapshotIModel(iModelIdentifier)
              ? `snapshot=${iModelIdentifier}`
              : `iTwinId=${iModelIdentifier.iTwinId}&iModelId=${iModelIdentifier.iModelId}`}`,
          );
        }
      },
      openIModelBrowser: (tab) => {
        if (!tab) {
          navigate("/browse-imodels");
        } else {
          navigate(`/browse-imodels/${tab}`);
        }
      },
    }),
    [navigate],
  );
}

function useBackgroundITwinJsAppLoading(): ITwinJsAppData | undefined {
  const [itwinJsApp, setITwinJsApp] = React.useState<ITwinJsAppData>();
  React.useEffect(
    () => {
      let disposed = false;
      void (async () => {
        const { ITwinJsApp: component, initializeApp } = await import("./ITwinJsApp/ITwinJsApp");
        if (!disposed) {
          setITwinJsApp({ component, backendApiPromise: initializeApp() });
        }
      })();

      return () => { disposed = true; };
    },
    [],
  );
  return itwinJsApp;
}

function useApplicationInsights(): void {
  React.useEffect(
    () => {
      if (appInsightsConnectionString) {
        void (async () => {
          try {
            const { initialize } = await import("./ApplicationInsights");
            initialize(appInsightsConnectionString);
          } catch (error) {
            // eslint-disable-next-line no-console
            console.warn("ApplicationInsights initialization failed", error);
          }
        })();
      }
    },
    [],
  );
}

interface AppSideNavigationProps {
  activePage: AppPage;
}

export enum AppPage {
  RulesetEditor = "ruleset-editor",
  iModelBrowser = "imodel-browser",
}

export const AppSideNavigation = React.memo<AppSideNavigationProps>(
  function AppSideNavigation(props) {
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
              onClick={() => navigation.openRulesetEditor()}
            >
              Ruleset Editor
            </SidenavButton>,
            <SidenavButton
              key={AppPage.iModelBrowser}
              startIcon={<SvgFolderOpened />}
              isActive={props.activePage === AppPage.iModelBrowser}
              onClick={() => navigation.openIModelBrowser()}
            >
              Browse iModels
            </SidenavButton>,
          ]}
        />
      </PageLayout.SideNavigation>
    );
  },
);

function IndexRedirect(): React.ReactElement {
  const { state } = useAuthorization();

  if (process.env.DEPLOYMENT_TYPE !== "web") {
    return <Navigate replace to={"/browse-imodels"} />;
  }

  if (state === AuthorizationState.Pending) {
    return <><div /><CheckingSignInStatusHint /></>;
  }

  return <Navigate replace to={state === AuthorizationState.SignedIn ? "/browse-imodels" : "/open-imodel"} />;
}
