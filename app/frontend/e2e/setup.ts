/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import { JestDevServerOptions, setup as setupDevServers, teardown as teardownDevServers } from "jest-dev-server";
import { Socket } from "net";
import { chromium, ChromiumBrowser, Page } from "playwright";

export let browser: ChromiumBrowser;
export let page: Page;

before(async function () {
  this.timeout(60000);
  const debug = !!process.env.PWDEBUG;
  await Promise.all([setupBrowser({ debug }), setupServers({ backendPort: 3001, frontendPort: 8080, debug })]);
});

after(async () => {
  await teardownDevServers();
});

async function setupBrowser({ debug }: { debug: boolean; }): Promise<void> {
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

  if (await isPortAvailable(3001)) {
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
    console.log(`Backend server port (${backendPort}) is already taken.`);
  }

  if (await isPortAvailable(8080)) {
    console.log("Launching frontend server...");
    servers.push({
      command: "npm start",
      protocol: "http",
      port: frontendPort,
      usedPortAction: "error",
      launchTimeout: 60000,
      debug,
    });
  } else {
    console.log(`Frontend server port (${frontendPort}) is already taken.`);
  }

  await setupDevServers(servers);
}


async function isPortAvailable(port: number) {
  const socket = new Socket();

  const result = await new Promise((resolve) => {
    socket.once('error', () => resolve(true));
    socket.connect(port, "localhost", () => resolve(false));
  });

  socket.destroy();
  return result;
}

after(async () => {
  await browser.close();
});
