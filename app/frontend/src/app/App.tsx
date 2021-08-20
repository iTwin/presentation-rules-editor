/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import "./App.scss";
import { Profile } from "oidc-client";
import * as React from "react";
import { BrowserRouter, Route, Switch, useHistory } from "react-router-dom";
import { SvgImodelHollow } from "@itwin/itwinui-icons-react";
import {
  Button, DropdownMenu, Footer, getUserColor, Header, HeaderBreadcrumbs, HeaderLogo, IconButton, MenuItem, UserIcon,
} from "@itwin/itwinui-react";
import { appLayoutContext, AppLayoutContext, AppTab } from "./AppContext";
import {
  AuthorizationState, createAuthorizationProvider, SignInCallback, SignInSilent, useAuthorization,
} from "./Authorization";
import { PageNotFound } from "./errors/PageNotFound";
import { Explainer } from "./utils/Explainer";
import { LoadingIndicator } from "./utils/LoadingIndicator";

const ITwinJsApp = React.lazy(async () => import("./ITwinJsApp/ITwinJsApp"));

export function App(): React.ReactElement {
  const appLayoutContextValue = useAppLayout();
  return (
    <div className="app">
      <AuthorizationProvider>
        <appLayoutContext.Provider value={appLayoutContextValue}>
          <BrowserRouter>
            <AppHeader />
            <Switch>
              <Route path="/" exact={true}>
                <Home />
              </Route>
              <Route path="/auth/callback">
                <SignInCallback returnTo="/">
                  <LoadingIndicator>
                    Signing in...
                  </LoadingIndicator>
                </SignInCallback>
              </Route>
              <Route path="/auth/silent">
                <SignInSilent />
              </Route>
              <Route path="*">
                <PageNotFound />
              </Route>
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

const AuthorizationProvider = (process.env.OAUTH_AUTHORITY && process.env.OAUTH_CLIENT_ID)
  ? createAuthorizationProvider({
    authority: process.env.OAUTH_AUTHORITY,
    client_id: process.env.OAUTH_CLIENT_ID,
    redirect_uri: "/auth/callback",
    silent_redirect_uri: "/auth/silent",
    post_logout_redirect_uri: "/",
    scope: "openid profile itwinjs",
  })
  : (props: React.PropsWithChildren<{}>) => <>{props.children}</>;

function AppHeader(): React.ReactElement {
  const { state, user, signIn, signOut } = useAuthorization();
  const history = useHistory();

  let actions: React.ReactNode[];
  switch (state) {
    case AuthorizationState.Offline:
      actions = [
        <span key="offlinemode">
          Offline mode
          <Explainer>To access online imodels, setup a .env file in repository root</Explainer>
        </span>,
      ];
      break;

    case AuthorizationState.SignedOut:
      actions = [<Button key="signin" styleType="borderless" onClick={signIn}>Sign In</Button>];
      break;

    default:
      actions = [];
      break;
  }

  const userIcon = (state === AuthorizationState.SignedIn && user !== undefined)
    ? <HeaderUserIcon profile={user.profile} signOut={signOut} />
    : null;

  return (
    <Header
      appLogo={
        <HeaderLogo logo={<SvgImodelHollow />} onClick={() => history.push("/")}>
          Presentation Rules Editor
        </HeaderLogo>
      }
      breadcrumbs={<Breadcrumbs />}
      actions={actions}
      userIcon={userIcon}
    />
  );
}

interface HeaderUserIconProps {
  /** User profile. Even though oidc-client types claim that User always has a profile, that is not always the case. */
  profile: Profile | undefined;
  signOut: () => void;
}

function HeaderUserIcon(props: HeaderUserIconProps): React.ReactElement | null {
  const { profile, signOut } = props;
  const preferredName = profile?.preferred_username || profile?.name || profile?.nickname;
  const initials = (profile?.given_name && profile?.family_name)
    ? profile.given_name[0] + profile.family_name[0]
    : (preferredName ?? "?").substr(0, 2);
  const displayName = preferredName ?? "Unknown Account";
  return (
    <DropdownMenu menuItems={() => [<MenuItem key="signout" onClick={signOut}>Sign Out</MenuItem>]}>
      <IconButton styleType="borderless" title="Account Actions">
        <UserIcon title={displayName} abbreviation={initials} backgroundColor={getUserColor(displayName)} />
      </IconButton>
    </DropdownMenu>
  );
}

function Breadcrumbs(): React.ReactElement {
  const appLayout = React.useContext(appLayoutContext);
  return <HeaderBreadcrumbs items={appLayout.breadcrumbs} />;
}

function Home(): React.ReactElement {
  return (
    <React.Suspense fallback={<LoadingIndicator>Loading...</LoadingIndicator>}>
      <ITwinJsApp />
    </React.Suspense>
  );
}
