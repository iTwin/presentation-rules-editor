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
    const header = page.locator(".page-header nav");
    expect(await header.getByText("Local snapshots").isVisible()).to.be.true;
    expect(await header.getByText("Baytown.bim").isVisible()).to.be.true;
  });

  it("allows navigating to snapshot iModels browser", async () => {
    await page.getByText("Local snapshots").click();
    await page.getByRole("tab", { name: "Local snapshots", selected: true }).waitFor();
  });

  it("clears breadcrumbs after navigating to home", async () => {
    await page.getByText("Local snapshots").click();
    const header = page.locator(".page-header nav");
    await header.waitFor({ state: "attached" });
    expect(await header.textContent()).to.be.empty;
  });
});

describe("header #web", () => {
  beforeEach(async () => {
    await openDemoIModel(page);
  });

  it("populates header with opened demo iModel information", async () => {
    const header = page.locator(".page-header nav");
    await header.waitFor();
    expect(await header.getByText("Demo iModel").isVisible()).to.be.true;
    expect(await header.getByText("Bay Town Process Plant").isVisible()).to.be.true;
  });

  it("allows navigating to demo iModels browser", async () => {
    await page.getByText("Demo iModels").click();
    await page.getByRole("tab", { name: "Demo iModels", selected: true }).waitFor();
  });

  it("clears breadcrumbs after navigating to home", async () => {
    await page.getByText("Presentation Rules Editor").click();
    const header = page.locator(".page-header nav");
    await header.waitFor({ state: "attached" });
    expect(await header.textContent()).to.be.empty;
  });
});
