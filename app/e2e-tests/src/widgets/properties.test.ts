/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import { Page } from "playwright";
import { page } from "../setup";
import { getEditor, getWidget, openTestIModel } from "../utils";

describe("#local properties widget", () => {
  before(async () => {
    await openTestIModel(page);
  });

  it("displays properties", async () => {
    const propertiesWidget = await getWidget(page, "Properties");
    await propertiesWidget.waitForSelector("text=Select element(s) to view properties.");

    await selectAnyTreeNode(page);
    await propertiesWidget.waitForSelector("text=Selected Item(s)");
  });

  it("updates properties when ruleset changes", async () => {
    await selectAnyTreeNode(page);

    const editor = await getEditor(page);
    await page.click('text=""SelectedNodeInstances""');
    await editor.press("End");
    await editor.type(`,
"propertyOverrides": [{ "name": "*", "categoryId": "custom" }],
"propertyCategories": [{ "id": "custom", "label": "custom_category" }]`);
    await editor.press("Alt+Enter");

    const propertiesWidget = await getWidget(page, "Properties");
    await propertiesWidget.waitForSelector("text=custom_category");
  });

  // eslint-disable-next-line @typescript-eslint/no-shadow
  async function selectAnyTreeNode(page: Page): Promise<void> {
    const treeWidget = await getWidget(page, "Tree");
    await treeWidget.waitForSelector(".core-tree-node");
    await (await treeWidget.$(".core-tree-node"))!.click();
  }
});
