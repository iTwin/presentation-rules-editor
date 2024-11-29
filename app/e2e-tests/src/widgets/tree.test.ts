/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/

import { page } from "../setup.js";
import { getEditor, getWidget, openTestIModel } from "../utils.js";

describe("tree widget #local", () => {
  beforeEach(async () => {
    await openTestIModel(page);
  });

  it("displays tree hierarchy", async () => {
    const treeWidget = getWidget(page, "Tree");
    await treeWidget.locator(".core-tree-node").first().waitFor();
  });

  it("updates tree when ruleset changes", async () => {
    const editor = getEditor(page);
    await editor.getByText(/^"rules"$/).click();
    await editor.press("Control+Enter");
    await page.keyboard.type('{ "ruleType": "CheckBox" },');
    await editor.press("Alt+Enter");

    const treeWidget = getWidget(page, "Tree");
    await treeWidget.locator("input[type=checkbox]").first().waitFor({ state: "attached" });
  });
});
