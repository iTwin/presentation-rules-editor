/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import { RpcInterface, RpcManager, RpcOperation, RpcRequestTokenSupplier_T } from "@bentley/imodeljs-common";

const localDeploymentOnly: RpcRequestTokenSupplier_T = () => ({ iModelId: "none", key: "" });

export abstract class PresentationRulesEditorRpcInterface extends RpcInterface {
  /** The immutable name of the interface. */
  public static readonly interfaceName = "PresentationRulesEditorRpcInterface";

  /** The version of the interface. */
  public static interfaceVersion = "1.0.0";

  public static getClient(): PresentationRulesEditorRpcInterface {
    return RpcManager.getClientForInterface(PresentationRulesEditorRpcInterface);
  }

  @RpcOperation.setRoutingProps(localDeploymentOnly)
  public async getAvailableIModels(): Promise<string[]> { return this.forward(arguments); }
}
