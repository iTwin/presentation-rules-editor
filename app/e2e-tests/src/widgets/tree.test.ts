/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/

import { test } from "@playwright/test";
import { getEditor, getTreeWidget, openTestIModel } from "../utils.js";

test.describe("tree widget #local", () => {
  test.beforeEach(async ({ page }) => {
    await openTestIModel(page);
  });

  test("displays tree hierarchy", async ({ page }) => {
    const treeWidget = getTreeWidget(page);
    await treeWidget.locator(".core-tree-node").first().waitFor();
  });

  test("updates tree when ruleset changes", async ({ page }) => {
    const editor = getEditor(page);
    await editor.getByText(/^"rules"$/).click();
    await editor.press("Control+Enter");
    await page.keyboard.type('{ "ruleType": "CheckBox" },');
    await editor.press("Alt+Enter");

    const treeWidget = getTreeWidget(page);
    await treeWidget.locator("input[type=checkbox]").first().waitFor({ state: "attached" });
  });
});
