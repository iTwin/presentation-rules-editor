/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/

import { AccessToken } from "@itwin/core-bentley";
import { AuthorizationClient } from "@itwin/core-common";
import { PageLayout } from "@itwin/itwinui-layouts-react";
import { Code } from "@itwin/itwinui-react";
import { User, UserManager, WebStorageStateStore } from "oidc-client-ts";
import * as React from "react";
import { useNavigate } from "react-router-dom";
import { LoadingIndicator } from "./common/LoadingIndicator.js";
import { ErrorPage } from "./errors/ErrorPage.js";
import { applyUrlPrefix } from "./utils/Environment.js";

export interface AuthorizationProviderConfig {
  authority: string;
  client_id: string;
  redirect_uri: string;
  silent_redirect_uri: string;
  post_logout_redirect_uri: string;
  scope: string;
}

/** Creates a context provider for authorization state. */
export function createAuthorizationProvider(config: AuthorizationProviderConfig): React.ComponentType {
  const userManager = new UserManager({
    authority: config.authority,
    client_id: config.client_id,
    redirect_uri: `${window.location.origin}${config.redirect_uri}`,
    silent_redirect_uri: `${window.location.origin}${config.silent_redirect_uri}`,
    post_logout_redirect_uri: `${window.location.origin}${config.post_logout_redirect_uri}`,
    scope: config.scope,
    response_type: "code",
    automaticSilentRenew: true,
    accessTokenExpiringNotificationTimeInSeconds: 120,
    userStore: new WebStorageStateStore({ store: localStorage }),
  });
  userManager.events.addSilentRenewError((error) => {
    // eslint-disable-next-line no-console
    console.warn(error);
  });
  userManager.events.addAccessTokenExpiring(async () => {
    try {
      await userManager.signinSilent();
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error(`Silent sign in failed:`, error);
    }
  });

  const demoAuthorizationClient = new DemoAuthClient();

  const signIn = async () => {
    try {
      await userManager.signinRedirect({
        state: window.location.pathname + window.location.search + window.location.hash,
      });
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn(err);
    }
  };

  const signOut = async () => {
    try {
      await userManager.signoutRedirect();
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn(err);
    }
  };

  return function AuthorizationProvider(props: React.PropsWithChildren<{}>): React.ReactElement {
    const [authorizationContextValue, setAuthorizationContextValue] = React.useState<AuthorizationContext>({
      userManager,
      demoAuthorizationClient,
      state: AuthorizationState.Pending,
      user: undefined,
      userAuthorizationClient: undefined,
      signIn,
      signOut,
    });

    React.useEffect(() => {
      const handleUserLoaded = (user: User) => {
        setAuthorizationContextValue({
          userManager,
          demoAuthorizationClient,
          state: AuthorizationState.SignedIn,
          user,
          userAuthorizationClient: new AuthClient(userManager),
          signIn,
          signOut,
        });
      };

      const handleUserUnloaded = () => {
        setAuthorizationContextValue({
          userManager,
          demoAuthorizationClient,
          state: AuthorizationState.SignedOut,
          user: undefined,
          userAuthorizationClient: undefined,
          signIn,
          signOut,
        });
      };

      userManager.events.addUserLoaded(handleUserLoaded);
      userManager.events.addUserUnloaded(handleUserUnloaded);

      userManager
        .getUser()
        .then((user) => {
          if (user === null) {
            handleUserUnloaded();
            return;
          }
          handleUserLoaded(user);
        })
        .catch((e) => {
          // eslint-disable-next-line no-console
          console.warn(e);
          handleUserUnloaded();
        });

      return () => {
        userManager.events.removeUserLoaded(handleUserLoaded);
        userManager.events.removeUserUnloaded(handleUserUnloaded);
      };
    }, []);

    return <authorizationContext.Provider value={authorizationContextValue}>{props.children}</authorizationContext.Provider>;
  };
}

export type AuthorizationContext = {
  userManager: UserManager;
  demoAuthorizationClient: AuthorizationClient;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
} & (AuthorizationContextWithUser | AuthorizationContextWithoutUser);

interface AuthorizationContextWithUser {
  state: AuthorizationState.SignedIn;
  user: User;
  userAuthorizationClient: AuthorizationClient;
}

interface AuthorizationContextWithoutUser {
  state: Exclude<AuthorizationState, AuthorizationState.SignedIn>;
  user: undefined;
  userAuthorizationClient: undefined;
}

export enum AuthorizationState {
  Offline,
  Pending,
  SignedOut,
  SignedIn,
}

class AuthClient implements AuthorizationClient {
  constructor(private userManager: UserManager) {}

  public async getAccessToken(): Promise<AccessToken> {
    const user = await this.userManager.getUser();
    return user ? `${user.token_type} ${user.access_token}` : "";
  }
}

class DemoAuthClient implements AuthorizationClient {
  private accessToken: Promise<string> | undefined = undefined;

  public async getAccessToken(): Promise<string> {
    this.accessToken ??= (async () => {
      const response = await fetch("https://connect-itwinjscodesandbox.bentley.com/api/usertoken");
      const result = await response.json();
      setTimeout(() => (this.accessToken = undefined), new Date(result._expiresAt).getTime() - new Date().getTime() - 5000);
      return `Bearer ${result._jwt}`;
    })();
    return this.accessToken;
  }
}

/** Returns current authorization state. */
export function useAuthorization(): AuthorizationContext {
  return React.useContext(authorizationContext);
}

const authorizationContext = React.createContext<AuthorizationContext>({
  userManager: new UserManager({ authority: "", client_id: "", redirect_uri: "" }),
  demoAuthorizationClient: new DemoAuthClient(),
  state: AuthorizationState.Offline,
  user: undefined,
  userAuthorizationClient: undefined,
  signIn: async () => {},
  signOut: async () => {},
});

/** Finalizes signin process when user is redirected back to the application. */
export function SignInCallback(): React.ReactElement {
  const { userManager } = useAuthorization();
  const navigate = useNavigate();
  const [authError, setAuthError] = React.useState<OAuthError>();

  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const errorCode = params.get("error");
    const errorDescription = params.get("error_description");
    if (isOAuthErrorCode(errorCode)) {
      // eslint-disable-next-line no-console
      console.error(`Authorization error (${errorCode}): ${errorDescription ?? ""}`);
      setAuthError({ code: errorCode, description: errorDescription ?? undefined });
      return;
    }

    let disposed = false;
    void (async () => {
      try {
        const user = await userManager.signinRedirectCallback();
        if (disposed) {
          return;
        }

        await navigate(user.state || "/", { replace: true });
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error(error);

        if (!disposed) {
          setAuthError({ code: "unknown_error" });
        }
      }
    })();

    return () => {
      disposed = true;
    };
  }, [userManager, navigate]);

  if (authError === undefined) {
    return (
      <PageLayout.Content>
        <LoadingIndicator style={{ height: "100%" }}>Signing in...</LoadingIndicator>
      </PageLayout.Content>
    );
  }

  return <AuthenticationError error={authError} />;
}

const authErrors = new Set([
  "access_denied",
  "invalid_request",
  "unauthorized_client",
  "unsupported_response_type",
  "invalid_scope",
  "server_error",
  "temporarily_unavailable",
] as const);

interface OAuthError {
  code: OAuthErrorCode | "unknown_error";
  description?: string;
}

type OAuthErrorCode = typeof authErrors extends Set<infer T> ? T : never;

function isOAuthErrorCode(code: any): code is OAuthErrorCode {
  return authErrors.has(code);
}

interface AuthenticationErrorProps {
  error: OAuthError;
}

function AuthenticationError(props: AuthenticationErrorProps): React.ReactElement {
  const { userManager } = useAuthorization();

  if (props.error.code === "invalid_scope") {
    return (
      <ErrorPage title="Authorization Error" troubleshooting={getTroubleshootingText(userManager)}>
        The requested scope is unknown, malformed, or exceeds what application is permitted to request.
      </ErrorPage>
    );
  }

  return <ErrorPage title="Authorization Error">{props.error.description ?? "Unknown error has occurred"}</ErrorPage>;
}

function getTroubleshootingText(userManager: UserManager): React.ReactNode {
  const scopes = userManager.settings.scope?.split(" ");
  if (scopes === undefined || scopes.length === 0) {
    // oidc-client usually fails with an exception when no scopes are specified, so we should not reach this branch
    return null;
  }

  const scopeList: React.ReactElement[] = [];
  scopes.forEach((scope, index) => {
    scopeList.push(
      scopeList.length === 0 ? (
        <Code key={index}>{scope}</Code>
      ) : (
        <React.Fragment key={index}>
          , <Code>{scope}</Code>
        </React.Fragment>
      ),
    );
  });

  return (
    <>
      Visit the application&apos;s registration page on{" "}
      <a title="iTwin Platform" href={applyUrlPrefix("https://developer.bentley.com/")}>
        iTwin Platform
      </a>{" "}
      to check if it has access to the following scopes: {scopeList}.
    </>
  );
}

/** Finalizes signin process for silent authorization when iframe is redirected back to the application. */
export function SignInSilent(): React.ReactElement {
  const { userManager } = useAuthorization();
  React.useEffect(() => {
    void (async () => {
      try {
        await userManager.signinSilentCallback();
      } catch (error) {
        // eslint-disable-next-line no-console
        console.warn(error);
      }
    })();
  }, [userManager]);

  return <></>;
}
