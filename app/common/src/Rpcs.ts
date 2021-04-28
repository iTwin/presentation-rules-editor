/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import { IModelReadRpcInterface, IModelTileRpcInterface, SnapshotIModelRpcInterface } from "@bentley/imodeljs-common";
import { PresentationRpcInterface } from "@bentley/presentation-common";
import { PresentationRulesEditorRpcInterface } from "./PresentationRulesEditorRpcInterface";

export const rpcInterfaces = [
  IModelTileRpcInterface,
  IModelReadRpcInterface,
  SnapshotIModelRpcInterface,
  PresentationRpcInterface,
  PresentationRulesEditorRpcInterface,
];
