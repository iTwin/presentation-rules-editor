/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import * as React from "react";
import { rpcInterfaces } from "@app/common";
import { Config, Logger, LogLevel } from "@bentley/bentleyjs-core";
import { IModelApp, WebViewerApp } from "@bentley/imodeljs-frontend";
import { PresentationUnitSystem } from "@bentley/presentation-common";
import { Presentation } from "@bentley/presentation-frontend";
import {
  AppNotificationManager, ConfigurableUiManager, FrameworkReducer, StateManager, UiFramework,
} from "@bentley/ui-framework";
import { LoadingIndicator } from "../utils/LoadingIndicator";
import { BackendApi } from "./api/BackendApi";
import { InitializedApp } from "./InitializedApp";

export default ITwinJsApp;

export function ITwinJsApp(): React.ReactElement {
  const [backendApi, setBackendApi] = React.useState<BackendApi>();
  React.useEffect(
    () => {
      void (async () => {
        setBackendApi(await initializeApp());
      })();
    },
    [],
  );

  return backendApi !== undefined
    ? <InitializedApp backendApi={backendApi} />
    : <LoadingIndicator>Initializing...</LoadingIndicator>;
}

async function initializeApp(): Promise<BackendApi> {
  Logger.initializeToConsole();
  Logger.setLevelDefault(LogLevel.Warning);

  await WebViewerApp.startup({
    iModelApp: { rpcInterfaces, notifications: new AppNotificationManager() },
    webViewerApp: {
      rpcParams: { info: { title: "presentation-rules-editor", version: "v1.0" }, uriPrefix: "http://localhost:3001" },
    },
  });

  // Configure a CORS proxy in development mode.
  if (process.env.NODE_ENV === "development") {
    Config.App.set("imjs_dev_cors_proxy_server", `http://${window.location.hostname}:3001`);
  }

  const backendApi = new BackendApi();
  await Promise.all([
    IModelApp.i18n.registerNamespace("App").readFinished,
    initializePresentation(backendApi),
    initializeUIFramework(),
  ]);
  return backendApi;
}

async function initializePresentation(appFrontend: BackendApi): Promise<void> {
  await Presentation.initialize({
    clientId: appFrontend.getClientId(),
    activeLocale: "en",
    activeUnitSystem: PresentationUnitSystem.Metric,
  });

  Presentation.selection.scopes.activeScope = "top-assembly";
}

async function initializeUIFramework(): Promise<void> {
  await UiFramework.initialize(undefined, IModelApp.i18n);
  new StateManager({ frameworkState: FrameworkReducer });
  ConfigurableUiManager.initialize();
}
