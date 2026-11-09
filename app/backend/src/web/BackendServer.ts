/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/

import { randomBytes } from "node:crypto";
import { Server } from "node:http";
import { localRpcConfiguration } from "@app/common";
import { BentleyCloudRpcConfiguration, BentleyCloudRpcManager, RpcInterfaceDefinition } from "@itwin/core-common";
import { IModelJsExpressServer } from "@itwin/express-server";

/** Initializes backend Web Server */
export async function initialize(rpcs: RpcInterfaceDefinition[], port = Number(process.env.PORT || 3001)): Promise<Server> {
  // Tell BentleyCloudRpcManager which RPC interfaces to handle
  const rpcConfig = BentleyCloudRpcManager.initializeImpl({ info: { title: "presentation-rules-editor", version: "v1.0" } }, rpcs);

  // eslint-disable-next-line @itwin/no-internal
  const server = await new LocalRpcServer(rpcConfig.protocol).initialize(port);
  // eslint-disable-next-line no-console
  console.log(`Web backend for presentation-rules-editor listening on 127.0.0.1:${port}`);
  return server;
}

class LocalRpcServer extends IModelJsExpressServer {
  private readonly _sessionToken = randomBytes(32).toString("hex");

  protected override _configureHeaders(): void {
    this._app.use((req, res, next) => {
      const origin = req.get("Origin");
      const host = req.get("Host");
      const port = req.socket.localPort;
      if (
        port === undefined ||
        (host !== `localhost:${port}` && host !== `127.0.0.1:${port}`) ||
        (origin !== undefined && origin !== localRpcConfiguration.frontendOrigin)
      ) {
        res.status(403).send("Local RPC requests require the editor's host and origin.");
        return;
      }

      if (req.method === "GET" && req.path === "/ping") {
        res.status(200).send("Success");
        return;
      }

      res.set("Access-Control-Allow-Origin", localRpcConfiguration.frontendOrigin);
      res.vary("Origin");
      res.set("Access-Control-Allow-Methods", BentleyCloudRpcConfiguration.accessControl.allowMethods);
      res.set("Access-Control-Allow-Headers", `${BentleyCloudRpcConfiguration.accessControl.allowHeaders}, ${localRpcConfiguration.sessionHeader}`);

      if (req.method === "OPTIONS" || (req.method === "GET" && req.path === localRpcConfiguration.sessionPath)) {
        if (origin !== localRpcConfiguration.frontendOrigin) {
          res.status(403).send("A local RPC session requires the editor's origin.");
          return;
        }

        res.set("Cache-Control", "no-store");
        if (req.method === "OPTIONS") {
          res.sendStatus(204);
        } else {
          res.type("text/plain").send(this._sessionToken);
        }
        return;
      }

      if (req.get(localRpcConfiguration.sessionHeader) !== this._sessionToken) {
        res.status(401).send("Missing or invalid local RPC session.");
        return;
      }

      next();
    });
  }

  public override async initialize(port: number): Promise<Server> {
    // Reject untrusted requests before parsing their bodies or dispatching any RPC.
    this._configureHeaders();
    this._configureMiddleware();
    this._configureRoutes();
    return new Promise((resolve, reject) => {
      const server = this._app.listen(port, "127.0.0.1", () => resolve(server));
      server.once("error", reject);
    });
  }
}
