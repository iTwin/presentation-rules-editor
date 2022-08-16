/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import * as React from "react";
import { rpcInterfaces } from "@app/common";
import {
  AppNotificationManager, ConfigurableUiManager, FrameworkReducer, StateManager, UiFramework,
} from "@itwin/appui-react";
import { Logger, LogLevel } from "@itwin/core-bentley";
import { AuthorizationClient, BentleyCloudRpcManager, RpcConfiguration } from "@itwin/core-common";
import { IModelApp } from "@itwin/core-frontend";
import { ITwinLocalization } from "@itwin/core-i18n";
import { FrontendIModelsAccess } from "@itwin/imodels-access-frontend";
import { IModelsClient } from "@itwin/imodels-client-management";
import { Presentation } from "@itwin/presentation-frontend";
import { LoadingIndicator } from "../common/LoadingIndicator";
import { applyUrlPrefix } from "../utils/Environment";
import { BackendApi } from "./api/BackendApi";
import { IModelIdentifier } from "./IModelIdentifier";
import { InitializedApp } from "./InitializedApp";

export interface ITwinJsAppProps {
  backendApiPromise: Promise<BackendApi>;
  iModelIdentifier: IModelIdentifier;
  authorizationClient: AuthorizationClient | undefined;
}

export function ITwinJsApp(props: ITwinJsAppProps): React.ReactElement {
  const [backendApi, setBackendApi] = React.useState<BackendApi>();

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

  if (backendApi === undefined) {
    return <LoadingIndicator>Initializing...</LoadingIndicator>;
  }

  return (
    <InitializedApp
      backendApi={backendApi}
      iModelIdentifier={props.iModelIdentifier}
      authorizationClient={props.authorizationClient}
    />
  );
}

export async function initializeApp(): Promise<BackendApi> {
  Logger.initializeToConsole();
  Logger.setLevelDefault(LogLevel.Warning);

  RpcConfiguration.developmentMode = process.env.DEPLOYMENT_TYPE === "dev";
  RpcConfiguration.disableRoutingValidation = process.env.DEPLOYMENT_TYPE !== "web";
  const rpcParams = process.env.DEPLOYMENT_TYPE === "web"
    ? {
      info: { title: "visualization", version: "v3.0" },
      uriPrefix: applyUrlPrefix("https://api.bentley.com/imodeljs"),
    }
    : {
      info: { title: "presentation-rules-editor", version: "v1.0" },
      uriPrefix: "http://localhost:3001",
    };

  const iModelsClient = new IModelsClient({ api: { baseUrl: applyUrlPrefix("https://api.bentley.com/imodels") } });
  await IModelApp.startup({
    rpcInterfaces,
    notifications: new AppNotificationManager(),
    localization: new ITwinLocalization({
      initOptions: {
        lng: "en",
      },
      // Default template lacks the leading forward slash, which results in relative urls being requested
      urlTemplate: "/locales/{{lng}}/{{ns}}.json",
    }),
    hubAccess: new FrontendIModelsAccess(iModelsClient),
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
  await UiFramework.initialize(undefined);
  new StateManager({ frameworkState: FrameworkReducer });
  ConfigurableUiManager.initialize();
}
