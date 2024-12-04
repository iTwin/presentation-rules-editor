/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/

import { test } from "@playwright/test";
import { openTestIModel } from "../utils.js";

test.describe("viewport #local", () => {
  test.beforeEach(async ({ page }) => {
    await openTestIModel(page);
  });

  test("displays an iModel", async ({ page }) => {
    await page.click("text=Viewport");
    await page.waitForSelector("data-testid=viewport-component", { state: "visible" });
  });
});
