/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import { Page } from "playwright";
import { page } from "../setup";
import { getEditor, getStagePanelGrip, getWidget, openTestIModel } from "../utils";

describe("table widget #local", () => {
  const contentDescriptorUrlIdentifier = (url: URL) => {
    return url.pathname.includes("getContentDescriptor");
  };

  beforeEach(async () => {
    await openTestIModel(page);

    // expand the stage panel
    const grip = getStagePanelGrip(page, "bottom");
    await grip.dblclick();
  });

  afterEach(async () => {
    await page.context().unroute(contentDescriptorUrlIdentifier);
  });

  it("displays properties", async () => {
    const tableWidget = getWidget(page, "Table");
    await tableWidget.locator("text=Select element(s) to view properties.").waitFor();

    await selectAnyTreeNode(page);
    await tableWidget.locator("role=table").waitFor();
  });

  it("updates properties when ruleset changes", async () => {
    await selectAnyTreeNode(page);

    const editor = getEditor(page);
    await editor.click();
    await editor.press("PageDown");
    await editor.press("PageDown");
    await editor.getByText(/^"SelectedNodeInstances"$/).click();
    await editor.press("End");
    await editor.fill(`,
"propertyOverrides": [{ "name": "Model", "labelOverride": "Custom Property Label" }]`);
    await editor.press("Alt+Enter");

    const tableWidget = getWidget(page, "Table");
    await tableWidget.locator(`text="Custom Property Label"`).waitFor();
  });

  it("renders error status on error", async () => {
    const tableWidget = getWidget(page, "Table");
    await tableWidget.locator("text=Select element(s) to view properties.").waitFor();

    // simulate network error
    await page.context().route(
      contentDescriptorUrlIdentifier,
      async (route) => route.abort(),
    );

    await selectAnyTreeNode(page);
    await tableWidget.locator(`text="Error"`).waitFor();
  });

  // eslint-disable-next-line @typescript-eslint/no-shadow
  async function selectAnyTreeNode(page: Page): Promise<void> {
    const treeWidget = getWidget(page, "Tree");
    await treeWidget.locator(".core-tree-node").first().click();
  }
});
