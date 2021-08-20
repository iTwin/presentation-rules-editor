/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import { User, UserManager, WebStorageStateStore } from "oidc-client";
import * as React from "react";
import { useHistory } from "react-router-dom";
import { Code } from "@itwin/itwinui-react";
import { ErrorPage } from "./errors/ErrorPage";

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
    accessTokenExpiringNotificationTime: 120,
    userStore: new WebStorageStateStore({ store: new VoidWebStorage() }),
  });
  userManager.events.addSilentRenewError((error) => {
    // eslint-disable-next-line no-console
    console.warn(error);
  });

  const signIn = async () => userManager.signinRedirect();
  const signOut = async () => userManager.signoutRedirect();

  return function AuthorizationProvider(props: React.PropsWithChildren<{}>): React.ReactElement {
    const [authorizationContextValue, setAuthorizationContextValue] = React.useState<AuthorizationContext>({
      userManager,
      state: AuthorizationState.Pending,
      user: undefined,
      signIn,
      signOut,
    });

    React.useEffect(
      () => {
        const handleUserLoaded = (user: User) => {
          setAuthorizationContextValue({
            userManager,
            state: AuthorizationState.SignedIn,
            user,
            signIn,
            signOut,
          });
        };

        const handleUserUnloaded = () => {
          setAuthorizationContextValue({
            userManager,
            state: AuthorizationState.SignedOut,
            user: undefined,
            signIn,
            signOut,
          });
        };

        userManager.events.addUserLoaded(handleUserLoaded);
        userManager.events.addUserUnloaded(handleUserUnloaded);

        return () => {
          userManager.events.removeUserLoaded(handleUserLoaded);
          userManager.events.removeUserUnloaded(handleUserUnloaded);
        };
      },
      [],
    );

    React.useEffect(
      () => {
        if (window.self !== window.top) {
          // It could be that parent document has already initiated silent sign-in in an invisible iframe, and now the
          // identity provider has redirected the iframe back to the app.
          return;
        }

        let disposed = false;
        void (async () => {
          try {
            await userManager.signinSilent();
            await userManager.clearStaleState();
          } catch (error) {
            if (disposed) {
              return;
            }

            setAuthorizationContextValue({
              userManager,
              state: AuthorizationState.SignedOut,
              user: undefined,
              signIn,
              signOut,
            });
          }
        })();

        return () => { disposed = true; };
      },
      [],
    );

    return(
      <authorizationContext.Provider value={authorizationContextValue}>
        {props.children}
      </authorizationContext.Provider>
    );
  };
}

class VoidWebStorage implements Storage {
  public readonly length = 0;
  public key(): null {
    return null;
  }
  public getItem(): null {
    return null;
  }
  public setItem(): void {}
  public removeItem(): void {}
  public clear(): void {}
}

export interface AuthorizationContext {
  userManager: UserManager;
  state: AuthorizationState;
  user: User | undefined;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
}

export enum AuthorizationState {
  Offline,
  Pending,
  SignedOut,
  SignedIn,
}

/** Returns current authorization state. */
export function useAuthorization(): AuthorizationContext {
  return React.useContext(authorizationContext);
}

const authorizationContext = React.createContext<AuthorizationContext>({
  userManager: new UserManager({}),
  state: AuthorizationState.Offline,
  user: undefined,
  signIn: async () => { },
  signOut: async () => { },
});

export interface SignInCallbackProps {
  /** Application URL to activate when signin is complete. */
  returnTo: string;
  /** Content to display while processing signin response. */
  children?: React.ReactNode | Array<React.ReactNode>;
}

/** Finalizes signin process when user is redirected back to the application. */
export function SignInCallback(props: SignInCallbackProps): React.ReactElement {
  const { userManager } = useAuthorization();
  const history = useHistory();
  const [authError, setAuthError] = React.useState<OAuthError>();

  React.useEffect(
    () => {
      const params = new URLSearchParams(window.location.search);
      const errorCode = params.get("error");
      const errorDescription = params.get("error_description");
      if (isOAuthErrorCode(errorCode)) {
        // eslint-disable-next-line no-console
        console.error(`Authorization error (${errorCode}): ${errorDescription}`);
        setAuthError({ code: errorCode, description: errorDescription ?? undefined });
        return;
      }

      let disposed = false;
      void (async () => {
        try {
          await userManager.signinRedirectCallback();
          if (disposed) {
            return;
          }

          history.replace(props.returnTo);
        } catch (error) {
          // eslint-disable-next-line no-console
          console.error(error);

          if (!disposed) {
            setAuthError({ code: "unknown_error" });
          }
        }
      })();

      return () => { disposed = true; };
    },
    [userManager, props.returnTo, history],
  );

  if (authError === undefined) {
    return <>{props.children}</>;
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

  return (
    <ErrorPage title="Authorization Error">
      {props.error.description ?? "Unknown error has occured"}
    </ErrorPage>
  );
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
      scopeList.length === 0
        ? <Code key={index}>{scope}</Code>
        : <React.Fragment key={index}>, <Code>{scope}</Code></React.Fragment>,
    );
  });

  return (
    <>
      Visit the application&apos;s registration page
      on <a title="iTwin Platform" href="https://developer.bentley.com/my-apps/">iTwin Platform</a> to check if it has
      access to the following scopes: {scopeList}.
    </>
  );
}

/** Finalizes signin process for silent authorization when iframe is redirected back to the application. */
export function SignInSilent(): React.ReactElement {
  const { userManager } = useAuthorization();
  React.useEffect(
    () => {
      void (async () => {
        try {
          await userManager.signinSilentCallback();
        } catch (error) {
          // eslint-disable-next-line no-console
          console.warn(error);
        }
      })();
    },
    [userManager],
  );

  return <></>;
}
