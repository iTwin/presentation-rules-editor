/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import { expect } from "chai";
import { page } from "./setup";
import { openDemoIModel, openTestIModel } from "./utils";

describe("header #local", () => {
  beforeEach(async () => {
    await openTestIModel(page);
  });

  it("populates header with opened snapshot information", async () => {
    const header = await page.waitForSelector(".iui-page-header nav");
    expect(await header.waitForSelector('text="Local snapshots"'));
    expect(await header.waitForSelector("text=Baytown.bim"));
  });

  it("allows navigating to snapshot iModels browser", async () => {
    await page.click('text="Local snapshots"');
    expect(await page.waitForSelector("button.iui-tab.iui-active >> text='Local snapshots'"));
  });

  it("clears breadcrumbs after navigating to home", async () => {
    await page.click('text="Local snapshots"');
    const header = await page.waitForSelector(".iui-page-header nav", { state: "attached" });
    expect(await header.textContent()).to.be.empty;
  });
});

describe("header #web", () => {
  beforeEach(async () => {
    await openDemoIModel(page);
  });

  it("populates header with opened demo iModel information", async () => {
    const header = await page.waitForSelector(".iui-page-header nav");
    expect(header.$('text="Demo iModel"'));
    expect(header.$('text="Bay Town Process Plant"'));
  });

  it("allows navigating to demo iModels browser", async () => {
    await page.click('text="Demo iModels"');
    expect(await page.waitForSelector("button.iui-tab.iui-active >> text='Demo iModels'"));
  });

  it("clears breadcrumbs after navigating to home", async () => {
    await page.click('text="Presentation Rules Editor"');
    const header = await page.waitForSelector(".iui-page-header nav", { state: "attached" });
    expect(await header.textContent()).to.be.empty;
  });
});
