/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/

import { expect, test } from "@playwright/test";
import { getServiceUrl, loadHomepage } from "./utils.js";

test.describe("homepage #local", () => {
  test.beforeEach(async ({ page }) => {
    await loadHomepage(page);
  });

  test("opens iModel browser", async ({ page }) => {
    expect(page.url().startsWith(`${getServiceUrl()}/browse-imodels`)).toBeTruthy();
  });
});

test.describe("homepage #web", () => {
  test.beforeEach(async ({ page }) => {
    await loadHomepage(page);
  });

  test("opens default demo iModel", async ({ page }) => {
    expect(page.url()).toContain(`${getServiceUrl()}/open-imodel`);
  });
});
