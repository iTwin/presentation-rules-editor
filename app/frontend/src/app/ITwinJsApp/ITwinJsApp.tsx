/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/

import * as React from "react";
import { rpcInterfaces } from "@app/common";
import { AppNotificationManager, UiFramework } from "@itwin/appui-react";
import { Logger, LogLevel } from "@itwin/core-bentley";
import { AuthorizationClient, BentleyCloudRpcManager, ChangesetIndexAndId, IModelVersion, RpcConfiguration } from "@itwin/core-common";
import { FrontendHubAccess, IModelApp, IModelIdArg } from "@itwin/core-frontend";
import { ITwinLocalization } from "@itwin/core-i18n";
import { FrontendIModelsAccess } from "@itwin/imodels-access-frontend";
import { IModelsClient } from "@itwin/imodels-client-management";
import { Presentation } from "@itwin/presentation-frontend";
import { LoadingIndicator } from "../common/LoadingIndicator.js";
import { applyUrlPrefix, EXPERIMENTAL_STATION_VALUE_RENDERER } from "../utils/Environment.js";
import { BackendApi } from "./api/BackendApi.js";
import { demoIModels, IModelIdentifier } from "./IModelIdentifier.js";
import { InitializedApp } from "./InitializedApp.js";

if (EXPERIMENTAL_STATION_VALUE_RENDERER) {
  await import("../experimental/StationPropertyValueRenderer.js");
}

export interface ITwinJsAppProps {
  backendApiPromise: Promise<BackendApi>;
  iModelIdentifier: IModelIdentifier;
  authorizationClient: AuthorizationClient | undefined;
}

export function ITwinJsApp(props: ITwinJsAppProps): React.ReactElement {
  const [backendApi, setBackendApi] = React.useState<BackendApi>();

  React.useEffect(() => {
    let disposed = false;
    void (async () => {
      const loadedBackendApi = await props.backendApiPromise;
      if (!disposed) {
        setBackendApi(loadedBackendApi);
      }
    })();

    return () => {
      disposed = true;
    };
  }, [props.backendApiPromise]);

  if (backendApi === undefined) {
    return <LoadingIndicator>Initializing...</LoadingIndicator>;
  }

  return <InitializedApp backendApi={backendApi} iModelIdentifier={props.iModelIdentifier} authorizationClient={props.authorizationClient} />;
}

export async function initializeApp(): Promise<BackendApi> {
  Logger.initializeToConsole();
  Logger.setLevelDefault(LogLevel.Warning);

  RpcConfiguration.developmentMode = import.meta.env.DEPLOYMENT_TYPE === "dev";
  RpcConfiguration.disableRoutingValidation = import.meta.env.DEPLOYMENT_TYPE !== "web";
  const rpcParams =
    import.meta.env.DEPLOYMENT_TYPE === "web"
      ? { info: { title: "visualization", version: "v4.0" } }
      : {
          info: { title: "presentation-rules-editor", version: "v1.0" },
          uriPrefix: "http://localhost:3001",
        };

  await IModelApp.startup({
    rpcInterfaces,
    notifications: new AppNotificationManager(),
    localization: new ITwinLocalization({
      initOptions: { lng: "en" },
      // Default template lacks the leading forward slash, which results in relative urls being requested
      urlTemplate: "/locales/{{lng}}/{{ns}}.json",
    }),
    hubAccess: new HubAccess(),
  });
  const configuration = BentleyCloudRpcManager.initializeClient(rpcParams, rpcInterfaces);
  // eslint-disable-next-line @itwin/no-internal
  const backendApi = new BackendApi(configuration.protocol);
  await Promise.all([IModelApp.localization.registerNamespace("App"), initializePresentation(backendApi), initializeUIFramework()]);

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
  await UiFramework.initialize();
}

class HubAccess implements FrontendHubAccess {
  private demoAccess = new FrontendIModelsAccess(new IModelsClient({ api: { baseUrl: "https://api.bentley.com/imodels" } }));
  private privateAccess = new FrontendIModelsAccess(new IModelsClient({ api: { baseUrl: applyUrlPrefix("https://api.bentley.com/imodels") } }));

  private getHubAccess(arg: IModelIdArg): FrontendIModelsAccess {
    return demoIModels.has(arg.iModelId) ? this.demoAccess : this.privateAccess;
  }

  public async getLatestChangeset(arg: IModelIdArg): Promise<ChangesetIndexAndId> {
    return this.getHubAccess(arg).getLatestChangeset(arg);
  }

  public async getChangesetFromVersion(arg: IModelIdArg & { version: IModelVersion }): Promise<ChangesetIndexAndId> {
    return this.getHubAccess(arg).getChangesetFromVersion(arg);
  }

  public async getChangesetFromNamedVersion(arg: IModelIdArg & { versionName?: string | undefined }): Promise<ChangesetIndexAndId> {
    return this.getHubAccess(arg).getChangesetFromNamedVersion(arg);
  }
}
