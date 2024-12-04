/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/

import { expect, test } from "@playwright/test";
import { openDemoIModel, openTestIModel } from "./utils.js";

test.describe("header #local", () => {
  test.beforeEach(async ({ page }) => {
    await openTestIModel(page);
  });

  test("populates header with opened snapshot information", async ({ page }) => {
    const header = page.getByRole("navigation", { name: "breadcrumbs" });
    expect(await header.getByText("Local snapshots").isVisible()).toBeTruthy();
    expect(await header.getByText("Baytown.bim").isVisible()).toBeTruthy();
  });

  test("allows navigating to snapshot iModels browser", async ({ page }) => {
    await page.getByText("Local snapshots").click();
    await page.getByRole("tab", { name: "Local snapshots", selected: true }).waitFor();
  });

  test("clears breadcrumbs after navigating to home", async ({ page }) => {
    await page.getByText("Local snapshots").click();
    await page.getByText("Demo iModels").waitFor({ state: "visible" });
    const header = page.getByRole("navigation", { name: "breadcrumbs" });
    await header.waitFor({ state: "attached" });
    expect(await header.textContent()).toEqual("");
  });
});

test.describe("header #web", () => {
  test.beforeEach(async ({ page }) => {
    await openDemoIModel(page);
  });

  test("populates header with opened demo iModel information", async ({ page }) => {
    const header = page.getByRole("navigation", { name: "breadcrumbs" });
    await header.waitFor();
    expect(await header.getByText("Demo iModel").isVisible()).toBeTruthy();
    expect(await header.getByText("Bay Town Process Plant").isVisible()).toBeTruthy();
  });

  test("allows navigating to demo iModels browser", async ({ page }) => {
    await page.getByText("Demo iModels").click();
    await page.getByRole("tab", { name: "Demo iModels", selected: true }).waitFor();
  });

  test("clears breadcrumbs after navigating to home", async ({ page }) => {
    await page.getByText("Presentation Rules Editor").click();
    await page.getByText("Demo iModels").waitFor({ state: "visible" });
    const header = page.getByRole("navigation", { name: "breadcrumbs" });
    await header.waitFor({ state: "attached" });
    expect(await header.textContent()).toEqual("");
  });
});
