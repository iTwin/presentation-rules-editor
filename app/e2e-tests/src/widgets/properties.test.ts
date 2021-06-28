/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import { page } from "../setup";
import { getWidget, loadHomepage, selectIModel } from "../utils";

describe("properties widget", () => {
  before(async () => {
    await loadHomepage(page);
  });

  it("displays properties", async () => {
    const propertiesWidget = await getWidget(page, "Properties");
    await propertiesWidget.waitForSelector("text=Select an iModel to view content.");

    await selectIModel(page);
    await propertiesWidget.waitForSelector("text=Select element(s) to view properties.");

    const treeWidget = await getWidget(page, "Tree");
    await treeWidget.waitForSelector(".core-tree-node");
    await (await treeWidget.$(".core-tree-node"))!.click();
    await propertiesWidget.waitForSelector("text=Selected Item(s)");
  });
});
