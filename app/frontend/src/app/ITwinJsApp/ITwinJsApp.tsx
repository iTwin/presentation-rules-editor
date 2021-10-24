/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import { UserManager } from "oidc-client";
import * as React from "react";
import { rpcInterfaces } from "@app/common";
import { IModelHubFrontend } from "@bentley/imodelhub-client";
import {
  AppNotificationManager, ConfigurableUiManager, FrameworkReducer, StateManager, UiFramework,
} from "@itwin/appui-react";
import { AccessToken, Logger, LogLevel } from "@itwin/core-bentley";
import { AuthorizationClient, BentleyCloudRpcManager } from "@itwin/core-common";
import { IModelApp } from "@itwin/core-frontend";
import { ITwinLocalization } from "@itwin/core-i18n";
import { Presentation } from "@itwin/presentation-frontend";
import { AuthorizationState, useAuthorization } from "../Authorization";
import { LoadingIndicator } from "../common/LoadingIndicator";
import { applyUrlPrefix } from "../utils/Environment";
import { BackendApi } from "./api/BackendApi";
import { IModelIdentifier } from "./IModelIdentifier";
import { InitializedApp } from "./InitializedApp";

export interface ITwinJsAppProps {
  backendApiPromise: Promise<BackendApi>;
  imodelIdentifier: IModelIdentifier;
}

export function ITwinJsApp(props: ITwinJsAppProps): React.ReactElement {
  const [backendApi, setBackendApi] = React.useState<BackendApi>();
  const { state } = useAuthorization();

  React.useEffect(
    () => {
      let disposed = false;
      void (async () => {
        const loadedBackendApi = await props.backendApiPromise;
        if (!disposed) {
          setBackendApi(loadedBackendApi);
        }
      })();

      return () => { disposed = true; };
    },
    [props.backendApiPromise],
  );

  if (backendApi === undefined || state === AuthorizationState.Pending) {
    return <LoadingIndicator>Initializing...</LoadingIndicator>;
  }

  return <InitializedApp backendApi={backendApi} imodelIdentifier={props.imodelIdentifier} />;
}

export async function initializeApp(userManager: UserManager): Promise<BackendApi> {
  Logger.initializeToConsole();
  Logger.setLevelDefault(LogLevel.Warning);

  const rpcParams = process.env.DEPLOYMENT_TYPE === "web"
    ? {
      info: { title: "visualization", version: "v3.0" },
      uriPrefix: applyUrlPrefix("https://api.bentley.com/imodeljs"),
    }
    : {
      info: { title: "presentation-rules-editor", version: "v1.0" },
      uriPrefix: "http://localhost:3001",
    };

  const authClient = new AuthClient(userManager);
  await IModelApp.startup({
    rpcInterfaces,
    notifications: new AppNotificationManager(),
    authorizationClient: authClient,
    localization: new ITwinLocalization({
      initOptions: {
        lng: "en",
      },
      // Default template lacks the leading forward slash, which results in relative urls being requested
      urlTemplate: "/locales/{{lng}}/{{ns}}.json",
    }),
    hubAccess: new IModelHubFrontend(),
  });
  BentleyCloudRpcManager.initializeClient(rpcParams, rpcInterfaces);

  const backendApi = new BackendApi();
  await Promise.all([
    IModelApp.localization.registerNamespace("App"),
    initializePresentation(backendApi),
    initializeUIFramework(),
  ]);

  return backendApi;
}

async function initializePresentation(appFrontend: BackendApi): Promise<void> {
  await Presentation.initialize({
    presentation: {
      clientId: appFrontend.getClientId(),
      activeLocale: "en",
      activeUnitSystem: "metric",
    },
  });

  Presentation.selection.scopes.activeScope = "top-assembly";
}

async function initializeUIFramework(): Promise<void> {
  await UiFramework.initialize(undefined, IModelApp.localization);
  new StateManager({ frameworkState: FrameworkReducer });
  ConfigurableUiManager.initialize();
}

class AuthClient implements AuthorizationClient {

  constructor(private userManager: UserManager) { }

  public async getAccessToken(): Promise<AccessToken> {
    const user = await this.userManager.getUser();
    return user === null ? "" : `${user.token_type} ${user.access_token}`;
  }
}
