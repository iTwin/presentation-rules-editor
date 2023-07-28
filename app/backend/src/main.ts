/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import * as dotenv from "dotenv";
import { rpcInterfaces } from "@app/common";
import { IModelHost, IModelHostConfiguration } from "@itwin/core-backend";
import { Logger, LogLevel } from "@itwin/core-bentley";
import { RpcConfiguration } from "@itwin/core-common";
import { ECSchemaRpcImpl } from "@itwin/ecschema-rpcinterface-impl";
import { BackendIModelsAccess } from "@itwin/imodels-access-backend";
import { Presentation, PresentationBackendLoggerCategory, PresentationBackendNativeLoggerCategory } from "@itwin/presentation-backend";
import { PresentationRulesEditorRpcImpl } from "./PresentationRulesEditorRpcImpl";
import { SnapshotFileNameResolver } from "./SnapshotFileNameResolver";
import { initialize } from "./web/BackendServer";

dotenv.config({ path: "../../.env" });

void (async () => {
  Logger.initializeToConsole();
  Logger.setLevelDefault(LogLevel.Warning);
  Logger.setLevel(PresentationBackendNativeLoggerCategory.ECObjects, LogLevel.Warning);
  Logger.setLevel(PresentationBackendNativeLoggerCategory.ECPresentation, LogLevel.Info);
  Logger.setLevel(PresentationBackendLoggerCategory.Package, LogLevel.Info);

  const config = new IModelHostConfiguration();
  // eslint-disable-next-line @itwin/no-internal
  config.hubAccess = new BackendIModelsAccess();
  await IModelHost.startup(config);
  IModelHost.snapshotFileNameResolver = new SnapshotFileNameResolver();

  Presentation.initialize({
    workerThreadsCount: 1,
    useMmap: true,
  });

  RpcConfiguration.developmentMode = true;
  // eslint-disable-next-line @itwin/no-internal
  ECSchemaRpcImpl.register();
  PresentationRulesEditorRpcImpl.register();

  await initialize(rpcInterfaces);

  // eslint-disable-next-line no-console
  console.log(`Backend process id: ${process.pid}`);
})();
