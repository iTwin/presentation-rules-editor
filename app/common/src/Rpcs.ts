/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/

import { IModelReadRpcInterface, IModelTileRpcInterface } from "@itwin/core-common";
import { ECSchemaRpcInterface } from "@itwin/ecschema-rpcinterface-common";
import { PresentationRpcInterface } from "@itwin/presentation-common";
import { PresentationRulesEditorRpcInterface } from "./PresentationRulesEditorRpcInterface.js";

export const localRpcConfiguration = {
  backendUrl: "http://127.0.0.1:3001",
  frontendOrigin: "http://localhost:3000",
  sessionPath: "/local-session",
  sessionHeader: "X-Presentation-Rules-Editor-Session",
};

export const rpcInterfaces = [
  ECSchemaRpcInterface,
  IModelTileRpcInterface,
  IModelReadRpcInterface,
  PresentationRpcInterface,
  PresentationRulesEditorRpcInterface,
];
