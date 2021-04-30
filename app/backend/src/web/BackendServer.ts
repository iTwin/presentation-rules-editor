/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import { IModelJsExpressServer } from "@bentley/express-server";
import { BentleyCloudRpcManager, RpcInterfaceDefinition } from "@bentley/imodeljs-common";

/** Initializes backend Web Server */
export default async function initialize(rpcs: RpcInterfaceDefinition[]): Promise<void> {
  // Tell BentleyCloudRpcManager which RPC interfaces to handle
  const rpcConfig = BentleyCloudRpcManager.initializeImpl(
    { info: { title: "presentation-rules-editor", version: "v1.0" } },
    rpcs,
  );

  // Create a basic express web server
  const port = Number(process.env.PORT || 3001);
  const server = new IModelJsExpressServer(rpcConfig.protocol);
  await server.initialize(port);
  console.log(`Web backend for presentation-rules-editor listening on port ${port}`);
}
