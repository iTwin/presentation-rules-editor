/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import "./index.css";
import * as React from "react";
import * as ReactDOM from "react-dom";
import { rpcInterfaces } from "@app/common";
import { Config, Logger, LogLevel } from "@bentley/bentleyjs-core";
import { IModelApp, WebViewerApp } from "@bentley/imodeljs-frontend";
import { PresentationUnitSystem } from "@bentley/presentation-common";
import { Presentation } from "@bentley/presentation-frontend";
import { UiComponents } from "@bentley/ui-components";
import { BackendApi } from "./api/BackendApi";
import { App } from "./app/App";

(async () => {
  const div = document.createElement("div");
  document.body.appendChild(div);
  ReactDOM.render(<App initializer={initializeApp} />, div);
})();

async function initializeApp(): Promise<BackendApi> {
  Logger.initializeToConsole();
  Logger.setLevelDefault(LogLevel.Warning);

  await WebViewerApp.startup({
    iModelApp: { rpcInterfaces: rpcInterfaces },
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
    UiComponents.initialize(IModelApp.i18n),
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
