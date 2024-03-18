/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import { expect } from "chai";
import { page } from "../setup";
import { getEditor, getWidget, openTestIModel } from "../utils";

describe("editor #local", () => {
  beforeEach(async () => {
    await openTestIModel(page);
  });

  it("is populated with template ruleset", async () => {
    const editor = getEditor(page);
    expect(await editor.textContent()).to.contain('"Ruleset1"');
  });

  it("suggests completions based on ruleset schema", async () => {
    const editor = getEditor(page);
    await editor.getByText(/^true$/).first().dblclick();
    await editor.press("Backspace");
    await editor.press("Control+Space");
    const options = editor.locator(".suggest-widget");
    await options.waitFor();
    expect(await options.locator("[role=option]").count()).to.be.equal(2);
    expect(await options.locator("[role=option]", { hasText: "false" }).elementHandle()).not.to.be.null;
    expect(await options.locator("[role=option]", { hasText: "true" }).elementHandle()).not.to.be.null;
  });

  describe("ruleset submission", () => {
    it("submits ruleset when button is clicked", async () => {
      const editor = getEditor(page);
      await editor.getByText(/^"Element"$/).dblclick();
      await editor.press("Backspace");

      await editor.locator("text=Submit ruleset").click();
      await getWidget(page, "Tree")
        .locator("text=The data required for this tree layout is not available in this iModel.")
        .waitFor();
    });

    it("submits ruleset when keyboard shortcut is pressed", async () => {
      const editor = getEditor(page);
      await editor.getByText(/^"Element"$/).dblclick();
      await editor.press("Backspace");

      await editor.press("Alt+Enter");
      await getWidget(page, "Tree")
        .locator("text=The data required for this tree layout is not available in this iModel.")
        .waitFor();
    });

    it("submits ruleset when command is invoked from the command palette", async () => {
      const editor = getEditor(page);
      await editor.getByText(/^"Element"$/).dblclick();
      await editor.press("Backspace");

      await editor.press("F1");
      await page.keyboard.type("Submit ruleset");
      await editor.press("Enter");
      await getWidget(page, "Tree")
        .locator("text=The data required for this tree layout is not available in this iModel.")
        .waitFor();
    });
  });
});
