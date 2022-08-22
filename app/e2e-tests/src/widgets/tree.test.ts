/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import { page } from "../setup";
import { getEditor, getWidget, openTestIModel } from "../utils";

describe("tree widget #local", () => {
  before(async () => {
    await openTestIModel(page);
  });

  it("displays tree hierarchy", async () => {
    const treeWidget = getWidget(page, "Tree");
    await treeWidget.locator(".core-tree-node").first().waitFor();
  });

  it("updates tree when ruleset changes", async () => {
    const editor = getEditor(page);
    await page.click('text=""rules""');
    await editor.press("Control+Enter");
    await editor.type('{ "ruleType": "CheckBox" },');
    await editor.press("Alt+Enter");

    const treeWidget = getWidget(page, "Tree");
    await treeWidget.locator("input[type=checkbox]").first().waitFor({ state: "attached" });
  });
});
