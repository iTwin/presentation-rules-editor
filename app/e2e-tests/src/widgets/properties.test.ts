/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import { Page } from "playwright";
import { page } from "../setup";
import { getEditor, getWidget, openTestIModel } from "../utils";

describe("properties widget #local", () => {
  before(async () => {
    await openTestIModel(page);
  });

  it("displays properties", async () => {
    const propertiesWidget = getWidget(page, "Properties");
    await propertiesWidget.locator("text=Select element(s) to view properties.").waitFor();

    await selectAnyTreeNode(page);
    await propertiesWidget.locator("text=Selected Item(s)").waitFor();
  });

  it("updates properties when ruleset changes", async () => {
    await selectAnyTreeNode(page);

    const editor = getEditor(page);
    await page.click('text=""SelectedNodeInstances""');
    await editor.press("End");
    await editor.type(`,
"propertyOverrides": [{ "name": "*", "categoryId": "custom" }],
"propertyCategories": [{ "id": "custom", "label": "custom_category" }]`);
    await editor.press("Alt+Enter");

    const propertiesWidget = getWidget(page, "Properties");
    await propertiesWidget.locator("text=custom_category").waitFor();
  });

  // eslint-disable-next-line @typescript-eslint/no-shadow
  async function selectAnyTreeNode(page: Page): Promise<void> {
    const treeWidget = getWidget(page, "Tree");
    await treeWidget.locator(".core-tree-node").first().click();
  }
});
