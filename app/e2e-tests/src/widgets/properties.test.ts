/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import { Page } from "playwright";
import { page } from "../setup";
import { getEditor, getWidget, openTestIModel } from "../utils";

describe("properties widget #local", () => {
  const contentUrlIdentifier = (url: URL) => {
    return url.pathname.includes("getPagedContent");
  };

  beforeEach(async () => {
    await openTestIModel(page);
  });

  afterEach(async () => {
    await page.context().unroute(contentUrlIdentifier);
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
    await editor.click();
    await editor.press("PageDown");
    await editor.press("PageDown");
    await editor.getByText(/^"SelectedNodeInstances"$/).click();
    await editor.press("End");
    await page.keyboard.type(`,
"propertyOverrides": [{ "name": "*", "categoryId": "custom" }],
"propertyCategories": [{ "id": "custom", "label": "custom_category" }]`);
    await editor.press("Alt+Enter");

    const propertiesWidget = getWidget(page, "Properties");
    await propertiesWidget.locator("text=custom_category").waitFor();
  });

  it("renders error status on error", async () => {
    const propertiesWidget = getWidget(page, "Properties");
    await propertiesWidget.locator("text=Select element(s) to view properties.").waitFor();

    // simulate network error
    await page.context().route(
      contentUrlIdentifier,
      async (route) => route.abort(),
    );

    await selectAnyTreeNode(page);
    await propertiesWidget.locator(`text="Error"`).waitFor();
  });

  // eslint-disable-next-line @typescript-eslint/no-shadow
  async function selectAnyTreeNode(page: Page): Promise<void> {
    const treeWidget = getWidget(page, "Tree");
    await treeWidget.locator(".core-tree-node").first().click();
  }
});
