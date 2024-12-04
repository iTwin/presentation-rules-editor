/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/

import { expect, test } from "@playwright/test";
import { getEditor, getWidget, openTestIModel } from "../utils.js";

test.describe("editor #local", () => {
  test.beforeEach(async ({ page }) => {
    await openTestIModel(page);
  });

  test("is populated with template ruleset", async ({ page }) => {
    const editor = getEditor(page);
    expect(await editor.textContent()).toContain('"Ruleset1"');
  });

  test("suggests completions based on ruleset schema", async ({ page }) => {
    const editor = getEditor(page);
    await editor
      .getByText(/^true$/)
      .first()
      .dblclick();
    await editor.press("Backspace");
    await editor.press("Control+Space");
    const options = editor.locator(".suggest-widget");
    await options.waitFor();
    await expect(options.locator("[role=option]")).toHaveCount(2);
    expect(await options.locator("[role=option]", { hasText: "false" }).elementHandle()).not.toBeNull();
    expect(await options.locator("[role=option]", { hasText: "true" }).elementHandle()).not.toBeNull();
  });

  test.describe("ruleset submission", () => {
    test("submits ruleset when button is clicked", async ({ page }) => {
      const editor = getEditor(page);
      await editor.getByText(/^"Element"$/).dblclick();
      await editor.press("Backspace");

      await editor.locator("text=Submit ruleset").click();
      await getWidget(page, "Tree").locator("text=The data required for this tree layout is not available in this iModel.").waitFor();
    });

    test("submits ruleset when keyboard shortcut is pressed", async ({ page }) => {
      const editor = getEditor(page);
      await editor.getByText(/^"Element"$/).dblclick();
      await editor.press("Backspace");

      await editor.press("Alt+Enter");
      await getWidget(page, "Tree").locator("text=The data required for this tree layout is not available in this iModel.").waitFor();
    });

    test("submits ruleset when command is invoked from the command palette", async ({ page }) => {
      const editor = getEditor(page);
      await editor.getByText(/^"Element"$/).dblclick();
      await editor.press("Backspace");

      await editor.press("F1");
      await page.keyboard.type("Submit ruleset");
      await editor.press("Enter");
      await getWidget(page, "Tree").locator("text=The data required for this tree layout is not available in this iModel.").waitFor();
    });
  });
});
