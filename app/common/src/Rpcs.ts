/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/

import { IModelReadRpcInterface, IModelTileRpcInterface, SnapshotIModelRpcInterface } from "@itwin/core-common";
import { ECSchemaRpcInterface } from "@itwin/ecschema-rpcinterface-common";
import { PresentationRpcInterface } from "@itwin/presentation-common";
import { PresentationRulesEditorRpcInterface } from "./PresentationRulesEditorRpcInterface";

export const rpcInterfaces = [
  ECSchemaRpcInterface,
  IModelTileRpcInterface,
  IModelReadRpcInterface,
  SnapshotIModelRpcInterface,
  PresentationRpcInterface,
  PresentationRulesEditorRpcInterface,
];
