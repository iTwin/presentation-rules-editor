/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import * as asyncHooks from "async_hooks";
import { exec } from "child_process";
import * as fs from "fs";
import { JestDevServerOptions, setup as setupDevServers, teardown as teardownDevServers } from "jest-dev-server";
import { Socket } from "net";
import { chromium, ChromiumBrowser, Page } from "playwright";
import { loadHomepage } from "./utils";

interface Resource {
  type: string;
  stack: string | undefined;
  resource: object;
}

const activeResources = new Map<number, Resource>();

asyncHooks.createHook({
  init(asyncId, type, _triggerAsyncId, resource) {
    if (type === "TIMERWRAP" || type === "PROMISE") {
      return;
    }

    activeResources.set(asyncId, { type, stack: new Error().stack, resource });
  },
  destroy(asyncId) {
    activeResources.delete(asyncId);
  },
}).enable();

export let browser: ChromiumBrowser;
export let page: Page;

before(async function () {
  this.timeout(90000);
  const debug = !!process.env.PWDEBUG;

  // mocha will hang if teardownDevServers is called before dev server finishes initialising
  await settleAllPromises([
    setupIModel(),
    setupBrowser({ debug }),
    setupServers({ backendPort: 3001, frontendPort: 8080, debug }),
  ]);

  // Make sure the server is responding before beginning any tests
  // eslint-disable-next-line no-console
  console.log("Preloading homepage...");
  await loadHomepage(page);
});

after(async () => {
  await browser.close();
  await teardownDevServers();

  setTimeout(() => {
    console.log(activeResources);
  }, 5000);
});

/** Implements Promise.allSettled behaviour */
async function settleAllPromises(args: Array<Promise<unknown>>): Promise<void> {
  type WrappedPromise<T> = Promise<{ status: "fulfilled", value: T } | { status: "rejected", error: unknown }>;

  async function wrapPromise<T>(promise: Promise<T>): WrappedPromise<T> {
    return promise
      .then((value) => ({ status: "fulfilled" as const, value }))
      .catch((error) => ({ status: "rejected" as const, error }));
  }

  const results = await Promise.all(args.map(async (promise) => wrapPromise(promise)));
  for (const result of results) {
    if (result.status === "rejected") {
      throw result.error;
    }
  }
}

async function setupIModel(): Promise<void> {
  const testIModelPath = "../backend/assets/imodels/Baytown.bim";
  const testIModelUrl = "https://github.com/imodeljs/desktop-starter/raw/master/assets/Baytown.bim";

  if (!await isFileOnDisk(testIModelPath)) {
    // eslint-disable-next-line no-console
    console.log("Downloading test imodel...");
    await execute(`curl --location --fail --silent --output ${testIModelPath} ${testIModelUrl}`);
  }
}

async function isFileOnDisk(filepath: string): Promise<boolean> {
  return new Promise((resolve) => {
    fs.stat(filepath, (err, stats) => resolve(!err && stats.isFile()));
  });
}

async function execute(command: string): Promise<void> {
  await new Promise((resolve, reject) => exec(command, (error) => error ? reject(error) : resolve(undefined)));
}

async function setupBrowser({ debug }: { debug: boolean }): Promise<void> {
  browser = await chromium.launch({ headless: !debug, slowMo: debug ? 1000 : undefined });
  page = await browser.newPage();
}

interface SetupServersArgs {
  backendPort: number;
  frontendPort: number;
  debug: boolean;
}

async function setupServers({ backendPort, frontendPort, debug }: SetupServersArgs): Promise<void> {
  const servers: JestDevServerOptions[] = [];

  if (await isPortAvailable(backendPort)) {
    // eslint-disable-next-line no-console
    console.log("Launching backend server...");
    servers.push({
      command: "npm start --prefix ../backend",
      protocol: "http",
      port: backendPort,
      usedPortAction: "error",
      launchTimeout: 10000,
      debug,
    });
  } else {
    // eslint-disable-next-line no-console
    console.log(`Backend server port (${backendPort}) is already taken.`);
  }

  if (await isPortAvailable(frontendPort)) {
    // eslint-disable-next-line no-console
    console.log("Launching frontend server...");
    servers.push({
      command: "npm start --prefix ../frontend",
      protocol: "http",
      port: frontendPort,
      usedPortAction: "error",
      launchTimeout: 90000,
      debug,
    });
  } else {
    // eslint-disable-next-line no-console
    console.log(`Frontend server port (${frontendPort}) is already taken.`);
  }

  await setupDevServers(servers);
}

async function isPortAvailable(port: number) {
  const socket = new Socket();

  const result = await new Promise((resolve) => {
    socket.once("error", () => resolve(true));
    socket.connect(port, "localhost", () => resolve(false));
  });

  socket.destroy();
  return result;
}
