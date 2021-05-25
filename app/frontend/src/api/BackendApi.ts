/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import { PresentationRulesEditorRpcInterface } from "@app/common";
import { Guid, Logger } from "@bentley/bentleyjs-core";
import { ViewQueryParams } from "@bentley/imodeljs-common";
import { IModelConnection, SnapshotConnection } from "@bentley/imodeljs-frontend";

export interface ViewDefinition {
  id: string;
  class: string;
  label: string;
}

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

  public async getViewDefinitions(imodel: IModelConnection): Promise<ViewDefinition[]> {
    const viewQueryParams: ViewQueryParams = { wantPrivate: false };
    const viewSpecs = await imodel.views.queryProps(viewQueryParams);
    return viewSpecs
      .filter((spec) => !spec.isPrivate)
      .map((spec) => ({
        id: spec.id!,
        class: spec.classFullName,
        label: spec.userLabel ?? spec.code.value!,
      }));
  }
}
