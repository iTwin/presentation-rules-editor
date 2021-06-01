/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import { PresentationRulesEditorRpcInterface } from "@app/common";
import { Guid, Id64, Id64String, Logger } from "@bentley/bentleyjs-core";
import { IModelConnection, SnapshotConnection } from "@bentley/imodeljs-frontend";

export class BackendApi {
  public async getAvailableIModels(): Promise<string[]> {
    return PresentationRulesEditorRpcInterface.getClient().getAvailableIModels();
  }

  public async openIModel(path: string): Promise<IModelConnection> {
    Logger.logInfo("presentation", `Opening snapshot: ${path}`);
    const imodel = await SnapshotConnection.openFile(path);
    Logger.logInfo("presentation", `Opened snapshot: ${imodel.name}`);
    return imodel;
  }

  public getClientId(): string {
    const key = "presentation-rules-editor/client-id";
    let value = window.localStorage.getItem(key);
    if (!value) {
      value = Guid.createValue();
      window.localStorage.setItem(key, value);
    }

    return value;
  }

  public async getViewDefinition(imodel: IModelConnection): Promise<Id64String> {
    const viewId = await imodel.views.queryDefaultViewId();
    if (viewId !== Id64.invalid) {
      return viewId;
    }

    const viewDefinitionProps = await imodel.views.queryProps({ wantPrivate: false, limit: 1 });
    return viewDefinitionProps[0].id ?? Id64.invalid;
  }
}
