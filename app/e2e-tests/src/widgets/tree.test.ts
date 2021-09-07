/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import { page } from "../setup";
import { getEditor, getWidget, openTestIModel } from "../utils";

describe("tree widget", () => {
  before(async () => {
    await openTestIModel(page);
  });

  it("displays tree hierarchy", async () => {
    const treeWidget = await getWidget(page, "Tree");
    await treeWidget.waitForSelector(".core-tree-node");
  });

  it("updates tree when ruleset changes", async () => {
    const editor = await getEditor(page);
    await page.click('text=""rules""');
    await editor.press("Control+Enter");
    await editor.type('{ "ruleType": "CheckBox" },');
    await editor.press("Alt+Enter");

    const treeWidget = await getWidget(page, "Tree");
    await treeWidget.waitForSelector("input[type=checkbox]", { state: "attached" });
  });
});
