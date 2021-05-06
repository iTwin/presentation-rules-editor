/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import { rpcInterfaces } from "@app/common";
import { Logger, LogLevel } from "@bentley/bentleyjs-core";
import { IModelHost } from "@bentley/imodeljs-backend";
import { RpcConfiguration } from "@bentley/imodeljs-common";
import {
  Presentation, PresentationBackendLoggerCategory, PresentationBackendNativeLoggerCategory, PresentationManagerMode,
} from "@bentley/presentation-backend";
import { RequestPriority } from "@bentley/presentation-common";
import { PresentationRulesEditorRpcImpl } from "./PresentationRulesEditorRpcImpl";

void (async () => {
  Logger.initializeToConsole();
  Logger.setLevelDefault(LogLevel.Warning);
  Logger.setLevel(PresentationBackendNativeLoggerCategory.ECObjects, LogLevel.Warning);
  Logger.setLevel(PresentationBackendNativeLoggerCategory.ECPresentation, LogLevel.Info);
  Logger.setLevel(PresentationBackendLoggerCategory.Package, LogLevel.Info);

  await IModelHost.startup();

  Presentation.initialize({
    mode: PresentationManagerMode.ReadOnly,
    taskAllocationsMap: { [RequestPriority.Max]: 1 },
    useMmap: true,
  });

  RpcConfiguration.developmentMode = true;
  PresentationRulesEditorRpcImpl.register();

  const init = (await import("./web/BackendServer")).default;
  await init(rpcInterfaces);

  // eslint-disable-next-line no-console
  console.log(`Backend process id: ${process.pid}`);
})();
