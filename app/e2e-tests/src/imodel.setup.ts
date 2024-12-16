/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/

import { exec } from "child_process";
import * as fs from "fs";
import { test as setup } from "@playwright/test";

setup("Setup Baytown", async () => {
  if (!process.env.WEB_TEST) {
    await setupIModel();
  }
});

async function setupIModel(): Promise<void> {
  const testIModelPath = "../backend/assets/imodels/Baytown.bim";
  const testIModelUrl = "https://github.com/imodeljs/desktop-starter/raw/master/assets/Baytown.bim";

  if (!(await isFileOnDisk(testIModelPath))) {
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
  await new Promise((resolve, reject) => exec(command, (error) => (error ? reject(error) : resolve(undefined))));
}
