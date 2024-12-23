/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/

import { IModelMetadata, PresentationRulesEditorRpcInterface } from "@app/common";
import { Guid, Id64, Id64String, Logger } from "@itwin/core-bentley";
import { BentleyCloudRpcProtocol, IModelVersion } from "@itwin/core-common";
import { CheckpointConnection, IModelConnection, SnapshotConnection } from "@itwin/core-frontend";
import { IModelIdentifier, isDemoIModel, isSnapshotIModel } from "../IModelIdentifier.js";

export class BackendApi {
  constructor(public protocol: BentleyCloudRpcProtocol) {}

  public async getAvailableIModels(): Promise<IModelMetadata[]> {
    return PresentationRulesEditorRpcInterface.getClient().getAvailableIModels();
  }

  public async openIModelsDirectory(): Promise<void> {
    return PresentationRulesEditorRpcInterface.getClient().openIModelsDirectory();
  }

  public async openIModel(iModelIdentifier: IModelIdentifier): Promise<IModelConnection> {
    if (isSnapshotIModel(iModelIdentifier)) {
      Logger.logInfo("presentation", `Opening snapshot: ${iModelIdentifier}`);
      return SnapshotConnection.openFile(`assets/imodels/${iModelIdentifier}`);
    }

    if (isDemoIModel(iModelIdentifier)) {
      return CheckpointConnection.openRemote(iModelIdentifier.iTwinId, iModelIdentifier.iModelId, IModelVersion.latest());
    }

    return CheckpointConnection.openRemote(iModelIdentifier.iTwinId, iModelIdentifier.iModelId);
  }

  public getClientId(): string {
    const key = "presentation-rules-editor/client-id";
    let value = localStorage.getItem(key);
    if (!value) {
      value = Guid.createValue();
      localStorage.setItem(key, value);
    }

    return value;
  }

  public async getViewDefinition(imodel: IModelConnection): Promise<Id64String> {
    // eslint-disable-next-line @typescript-eslint/no-deprecated
    const viewId = await imodel.views.queryDefaultViewId();
    if (viewId !== Id64.invalid) {
      return viewId;
    }

    const viewDefinitionProps = await imodel.views.queryProps({ wantPrivate: false, limit: 1 });
    return viewDefinitionProps[0].id ?? Id64.invalid;
  }
}
