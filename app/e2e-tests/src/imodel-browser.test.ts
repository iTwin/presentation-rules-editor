/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/

import { test } from "@playwright/test";
import { openIModelBrowser } from "./utils.js";

test.describe("iModel browser #local", () => {
  test.beforeEach(async ({ page }) => {
    await openIModelBrowser(page);
  });

  test("gives options for browsing snapshots, iTwins and demo iModels", async ({ page }) => {
    const tabList = page.getByRole("tablist");
    await tabList.waitFor();
    await Promise.all([
      page.getByRole("tab", { name: "Local snapshots" }).waitFor(),
      page.getByRole("tab", { name: "My iTwins" }).waitFor(),
      page.getByRole("tab", { name: "Demo iModels" }).waitFor(),
    ]);
  });

  test("allows opening a snapshot iModel", async ({ page }) => {
    await page.getByRole("tab", { name: "Local snapshots" }).click();
    await page.getByText("Baytown.bim").click();
    await page.getByText("Submit ruleset").waitFor();
  });
});

test.describe("iModel browser #web", () => {
  test.beforeEach(async ({ page }) => {
    await openIModelBrowser(page);
  });

  test("gives options for browsing iTwins and demo iModels", async ({ page }) => {
    const tabList = page.getByRole("tablist");
    await tabList.waitFor();
    await Promise.all([page.getByRole("tab", { name: "My iTwins" }).waitFor(), page.getByRole("tab", { name: "Demo iModels" }).waitFor()]);
  });

  test("allows opening a demo iModel", async ({ page }) => {
    await page.getByRole("tab", { name: "Demo iModels" }).click();
    await page.getByText("Bay Town Process Plant").click();
    await page.getByText("Submit ruleset").waitFor();
  });
});
