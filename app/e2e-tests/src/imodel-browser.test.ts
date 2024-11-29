/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/

import { page } from "./setup.js";
import { openIModelBrowser } from "./utils.js";

describe("iModel browser #local", () => {
  beforeEach(async () => {
    await openIModelBrowser(page);
  });

  it("gives options for browsing snapshots, iTwins and demo iModels", async () => {
    const tabList = page.getByRole("tablist");
    await tabList.waitFor();
    await Promise.all([
      page.getByRole("tab", { name: "Local snapshots" }).waitFor(),
      page.getByRole("tab", { name: "My iTwins" }).waitFor(),
      page.getByRole("tab", { name: "Demo iModels" }).waitFor(),
    ]);
  });

  it("allows opening a snapshot iModel", async () => {
    await page.getByRole("tab", { name: "Local snapshots" }).click();
    await page.getByText("Baytown.bim").click();
    await page.getByText("Submit ruleset").waitFor();
  });
});

describe("iModel browser #web", () => {
  beforeEach(async () => {
    await openIModelBrowser(page);
  });

  it("gives options for browsing iTwins and demo iModels", async () => {
    const tabList = page.getByRole("tablist");
    await tabList.waitFor();
    await Promise.all([page.getByRole("tab", { name: "My iTwins" }).waitFor(), page.getByRole("tab", { name: "Demo iModels" }).waitFor()]);
  });

  it("allows opening a demo iModel", async () => {
    await page.getByRole("tab", { name: "Demo iModels" }).click();
    await page.getByText("Bay Town Process Plant").click();
    await page.getByText("Submit ruleset").waitFor();
  });
});
