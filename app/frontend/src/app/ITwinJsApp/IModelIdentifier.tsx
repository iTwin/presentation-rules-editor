/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
export type IModelIdentifier = SnapshotIModelIdentifier | ITwinIModelIdentifier;

export type SnapshotIModelIdentifier = string;

export interface ITwinIModelIdentifier {
  itwinId: string;
  imodelId: string;
}

export function isSnapshotIModel(identifier: IModelIdentifier): identifier is SnapshotIModelIdentifier {
  return typeof identifier === "string";
}
