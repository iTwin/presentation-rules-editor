/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import { UserManager } from "oidc-client";
import { PresentationRulesEditorRpcInterface } from "@app/common";
import { AccessToken, Guid, Id64, Id64String, Logger } from "@itwin/core-bentley";
import { AuthorizationClient, IModelVersion } from "@itwin/core-common";
import { CheckpointConnection, IModelConnection, SnapshotConnection } from "@itwin/core-frontend";
import { IModelIdentifier, isDemoIModel, isSnapshotIModel } from "../IModelIdentifier";

export class BackendApi {
  constructor(private readonly authorizationClient: AuthClient) {}

  public async getAvailableIModels(): Promise<string[]> {
    return PresentationRulesEditorRpcInterface.getClient().getAvailableIModels();
  }

  public async openIModelsDirectory(): Promise<void> {
    return PresentationRulesEditorRpcInterface.getClient().openIModelsDirectory();
  }

  public async openIModel(iModelIdentifier: IModelIdentifier): Promise<IModelConnection> {
    if (isSnapshotIModel(iModelIdentifier)) {
      Logger.logInfo("presentation", `Opening snapshot: ${iModelIdentifier}`);
      return SnapshotConnection.openFile(iModelIdentifier);
    }

    if (isDemoIModel(iModelIdentifier)) {
      this.authorizationClient.useDemoUser = true;
      return CheckpointConnection.openRemote(
        iModelIdentifier.iTwinId,
        iModelIdentifier.iModelId,
        IModelVersion.latest(),
      );
    }

    this.authorizationClient.useDemoUser = false;
    return CheckpointConnection.openRemote(iModelIdentifier.iTwinId, iModelIdentifier.iModelId);
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

export class AuthClient implements AuthorizationClient {
  private userManager: UserManager | undefined;
  private demoAccessToken: Promise<string> | undefined = undefined;

  public useDemoUser = false;

  constructor(userManager?: UserManager) {
    this.userManager = userManager;
  }

  public async getAccessToken(): Promise<AccessToken> {
    if (this.useDemoUser) {
      this.demoAccessToken ??= (async () => {
        const response = await fetch(
          "https://prod-imodeldeveloperservices-eus.azurewebsites.net/api/v0/sampleShowcaseUser/devUser",
        );
        const result = await response.json();
        setTimeout(
          () => this.demoAccessToken = undefined,
          new Date(result._expiresAt).getTime() - new Date().getTime() - 5000,
        );
        return `Bearer ${result._jwt}`;
      })();
      return this.demoAccessToken;
    }

    const user = await this.userManager?.getUser();
    return user ? `${user.token_type} ${user.access_token}` : "";
  }
}
