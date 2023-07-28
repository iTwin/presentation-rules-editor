/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import { page } from "./setup";
import { openIModelBrowser } from "./utils";

describe("iModel browser #local", () => {
  beforeEach(async () => {
    await openIModelBrowser(page);
  });

  it("gives options for browsing snapshots, iTwins and demo iModels", async () => {
    await page.waitForSelector(".iui-tabs >> text=Local snapshots");
    await page.waitForSelector(".iui-tabs >> text=My iTwins");
    await page.waitForSelector(".iui-tabs >> text=Demo iModels");
  });

  it("allows opening a snapshot iModel", async () => {
    await page.click("text=Local snapshots");
    await page.click("text=Baytown.bim");
    await page.waitForSelector("text=Submit ruleset");
  });
});

describe("iModel browser #web", () => {
  beforeEach(async () => {
    await openIModelBrowser(page);
  });

  it("gives options for browsing iTwins and demo iModels", async () => {
    await page.waitForSelector(".iui-tabs >> text=My iTwins");
    await page.waitForSelector(".iui-tabs >> text=Demo iModels");
  });

  it("allows opening a demo iModel", async () => {
    await page.click("text=Demo iModels");
    await page.click("text=Bay Town Process Plant");
    await page.waitForSelector("text=Submit ruleset");
  });
});
