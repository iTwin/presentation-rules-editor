/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
/* eslint-disable @itwin/no-internal */

import { randomUUID } from "node:crypto";
import * as fs from "node:fs";
import { get, IncomingMessage, Server } from "node:http";
import { AddressInfo } from "node:net";
import * as os from "node:os";
import * as path from "node:path";
import { promisify } from "node:util";
import { localRpcConfiguration, PresentationRulesEditorRpcInterface } from "@app/common";
import { IModelHost, SnapshotDb } from "@itwin/core-backend";
import { IModelReadRpcInterface, RpcInterfaceDefinition } from "@itwin/core-common";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PresentationRulesEditorRpcImpl } from "../PresentationRulesEditorRpcImpl.js";
import { initialize } from "../web/BackendServer.js";

function getAddress(server: Server): AddressInfo {
  const address = server.address();
  expect(address).toBeTypeOf("object");
  return address as AddressInfo;
}

describe("Local RPC server", () => {
  // Cover absent, opaque, deceptive, and alternate loopback origins; only the configured editor origin is trusted.
  const untrustedOrigins = [undefined, "null", "https://attacker.example", "http://localhost:3000.attacker.example", "http://127.0.0.1:3000"];
  let server: Server;
  let directory: string;
  let baseUrl: string;
  let sessionToken: string;

  beforeAll(async () => {
    directory = fs.mkdtempSync(path.join(os.tmpdir(), "presentation-rules-editor-rpc-"));
    const assetsDirectory = path.join(directory, "assets");
    fs.mkdirSync(path.join(assetsDirectory, "imodels"), { recursive: true });
    await IModelHost.startup({ appAssetsDir: assetsDirectory, cacheDir: path.join(directory, "cache") });

    // Use real snapshots so the RPC and query tests exercise the backend's normal model handling.
    SnapshotDb.createEmpty(path.join(assetsDirectory, "imodels", "test.bim"), { rootSubject: { name: "Allowed local snapshot" } }).close();
    SnapshotDb.createEmpty(path.join(directory, "outside.bim"), { rootSubject: { name: "Outside local snapshot" } }).close();

    PresentationRulesEditorRpcImpl.register();

    // Let the OS choose an available port so the test doesn't depend on a fixed port being free.
    server = await initialize([PresentationRulesEditorRpcInterface, IModelReadRpcInterface], 0);

    baseUrl = `http://127.0.0.1:${getAddress(server).port}`;

    const response = await fetch(`${baseUrl}${localRpcConfiguration.sessionPath}`, { headers: { origin: localRpcConfiguration.frontendOrigin } });
    expect(response.status).toBe(200);
    sessionToken = await response.text();
  });

  afterAll(async () => {
    await promisify(server.close.bind(server))();
    SnapshotDb.findByFilename(path.join(directory, "assets", "imodels", "test.bim"))?.close();
    await IModelHost.shutdown();
    fs.rmSync(directory, { recursive: true, force: true });
  });

  function rpcUrl(definition: RpcInterfaceDefinition, operation: string, imodelId = "none"): string {
    return `${baseUrl}/presentation-rules-editor/v1.0/mode/1/context/none/imodel/${imodelId}/changeset/0/${definition.interfaceName}-${definition.interfaceVersion}-${operation}`;
  }

  function rpcHeaders(): Record<string, string> {
    // Keep requests valid by default so each test can isolate the header it is checking.
    return {
      origin: localRpcConfiguration.frontendOrigin,
      "Content-Type": "text/plain",
      "X-Correlation-Id": randomUUID(),
      [localRpcConfiguration.sessionHeader]: sessionToken,
    };
  }

  it("listens only on IPv4 loopback and exposes a data-free health check", async () => {
    expect(getAddress(server).address).toBe("127.0.0.1");
    const response = await fetch(`${baseUrl}/ping`);
    expect(response.status).toBe(200);
    expect(await response.text()).toBe("Success");
  });

  it("reports listen failures instead of leaving initialization pending", async () => {
    await expect(initialize([], getAddress(server).port)).rejects.toMatchObject({ code: "EADDRINUSE" });
  });

  it("issues an uncached session capability to the frontend origin", async () => {
    const response = await fetch(`${baseUrl}${localRpcConfiguration.sessionPath}`, { headers: { origin: localRpcConfiguration.frontendOrigin } });
    expect(response.status).toBe(200);
    expect(response.headers.get("Access-Control-Allow-Origin")).toBe(localRpcConfiguration.frontendOrigin);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(await response.text()).toMatch(/^[a-f0-9]{64}$/);
  });

  for (const origin of untrustedOrigins) {
    it(`rejects session bootstrap and preflight with origin ${String(origin)}`, async () => {
      // Check both token retrieval and preflight; neither should disclose a token or advertise wildcard CORS.
      for (const method of ["GET", "OPTIONS"]) {
        const response = await fetch(`${baseUrl}${localRpcConfiguration.sessionPath}`, { method, headers: origin ? { origin } : {} });
        expect(response.status).toBe(403);
        expect(response.headers.get("Access-Control-Allow-Origin")).not.toBe("*");
        expect(await response.text()).not.toContain(sessionToken);
      }
    });
  }

  it("rejects a DNS rebinding host even with the correct origin and capability", async () => {
    // Keep origin and capability valid so the hostile Host header is the reason for rejection.
    const response = await new Promise<IncomingMessage>((resolve, reject) => {
      get(`${baseUrl}${localRpcConfiguration.sessionPath}`, { headers: { ...rpcHeaders(), host: "attacker.example" } }, resolve).once("error", reject);
    });
    response.resume();
    expect(response.statusCode).toBe(403);
    expect(response.headers["access-control-allow-origin"]).toBeUndefined();
  });

  it("allows preflight only for the frontend origin and includes the session header", async () => {
    // These headers mimic the browser's OPTIONS request before it sends the RPC.
    const preflight = async (origin: string | undefined) =>
      fetch(rpcUrl(PresentationRulesEditorRpcInterface, "getAvailableIModels"), {
        method: "OPTIONS",
        headers: {
          ...(origin ? { origin } : {}),
          "Access-Control-Request-Method": "POST",
          "Access-Control-Request-Headers": localRpcConfiguration.sessionHeader,
        },
      });

    const response = await preflight(localRpcConfiguration.frontendOrigin);
    expect(response.status).toBe(204);
    expect(response.headers.get("Access-Control-Allow-Origin")).toBe(localRpcConfiguration.frontendOrigin);
    expect(response.headers.get("Access-Control-Allow-Headers")).toContain(localRpcConfiguration.sessionHeader);

    for (const origin of untrustedOrigins) {
      expect((await preflight(origin)).status, String(origin)).toBe(403);
    }
  });

  for (const operation of ["getAvailableIModels", "getConnectionProps", "closeConnection", "openIModelsDirectory", "queryRows"]) {
    it(`requires a valid capability for ${operation}`, async () => {
      const definition = operation === "queryRows" ? IModelReadRpcInterface : PresentationRulesEditorRpcInterface;
      // Exercise missing, empty, and incorrect credentials on every exposed operation.
      for (const token of [undefined, "", "invalid-session"]) {
        const headers = rpcHeaders();
        if (token === undefined) {
          delete headers[localRpcConfiguration.sessionHeader];
        } else {
          headers[localRpcConfiguration.sessionHeader] = token;
        }
        const response = await fetch(rpcUrl(definition, operation), { method: "POST", headers, body: "[]" });
        expect(response.status).toBe(401);
      }
    });
  }

  it("protects GET RPCs and the API description as well as POST RPCs", async () => {
    // RPCs and API metadata are separate routes, so both need the same authentication guard.
    for (const url of [rpcUrl(IModelReadRpcInterface, "queryRows"), `${baseUrl}/v3/swagger.json`]) {
      const response = await fetch(url);
      expect(response.status).toBe(401);
    }
  });

  it("opens, reads, and closes an allowed snapshot with an authenticated session", async () => {
    const open = await fetch(rpcUrl(PresentationRulesEditorRpcInterface, "getConnectionProps"), {
      method: "POST",
      headers: rpcHeaders(),
      body: JSON.stringify(["test.bim"]),
    });
    expect(open.status).toBe(200);

    const props = (await open.json()) as { key: string; iModelId: string };
    expect(props.key).toBeTypeOf("string");
    expect(props.iModelId).toBeTypeOf("string");
    const queryBody = JSON.stringify([props, { query: "SELECT CodeValue FROM BisCore.Subject WHERE ECInstanceId = 0x1" }]);
    const queryUrl = rpcUrl(IModelReadRpcInterface, "queryRows", props.iModelId);

    // RPC supports GET as well as POST; verify both transports return the same query result.
    const postQuery = await fetch(queryUrl, { method: "POST", headers: rpcHeaders(), body: queryBody });
    expect(postQuery.status, await postQuery.clone().text()).toBe(200);
    expect(await postQuery.json()).toMatchObject({ data: [["Allowed local snapshot"]] });
    const getQuery = await fetch(`${queryUrl}?parameters=${encodeURIComponent(Buffer.from(queryBody).toString("base64"))}`, { headers: rpcHeaders() });
    expect(getQuery.status).toBe(200);
    expect(await getQuery.json()).toMatchObject({ data: [["Allowed local snapshot"]] });

    for (const method of ["GET", "POST"]) {
      // Reject hostile origins regardless of which HTTP method is used to reach the RPC.
      const hostile = await fetch(queryUrl, {
        method,
        headers: { ...rpcHeaders(), origin: "https://attacker.example" },
        ...(method === "POST" ? { body: queryBody } : {}),
      });
      expect(hostile.status).toBe(403);
      expect(hostile.headers.get("Access-Control-Allow-Origin")).toBeNull();
    }

    const close = await fetch(rpcUrl(PresentationRulesEditorRpcInterface, "closeConnection"), {
      method: "POST",
      headers: rpcHeaders(),
      body: JSON.stringify(["test.bim"]),
    });
    expect(close.status).toBe(200);
    expect(SnapshotDb.findByFilename(path.join(directory, "assets", "imodels", "test.bim"))).toBeUndefined();
  });

  it("rejects outside paths and malformed filenames even with an authenticated session", async () => {
    for (const name of [path.join(directory, "outside.bim"), null, 42, {}, []]) {
      const response = await fetch(rpcUrl(PresentationRulesEditorRpcInterface, "getConnectionProps"), {
        method: "POST",
        headers: rpcHeaders(),
        body: JSON.stringify([name]),
      });
      expect(response.status).toBe(500);
    }
    expect(SnapshotDb.findByFilename(path.join(directory, "outside.bim"))).toBeUndefined();
  });

  it("does not accept a capability issued by another server instance", async () => {
    // Each process-local server must have its own session token, even on the same host.
    const otherServer = await initialize([], 0);
    try {
      const otherUrl = `http://127.0.0.1:${getAddress(otherServer).port}`;
      const response = await fetch(`${otherUrl}${localRpcConfiguration.sessionPath}`, { headers: { origin: localRpcConfiguration.frontendOrigin } });
      expect(await response.text()).not.toBe(sessionToken);
      const unauthorized = await fetch(`${otherUrl}/v3/swagger.json`, { headers: rpcHeaders() });
      expect(unauthorized.status).toBe(401);
    } finally {
      await promisify(otherServer.close.bind(otherServer))();
    }
  });
});
