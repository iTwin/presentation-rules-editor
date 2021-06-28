/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import { page } from "../setup";
import { getWidget, loadHomepage, selectIModel } from "../utils";

describe("tree widget", () => {
  before(async () => {
    await loadHomepage(page);
  });

  it("displays tree hierarchy", async () => {
    const treeWidget = await getWidget(page, "Tree");
    await treeWidget.waitForSelector("text=Select an iModel to view content.");

    await selectIModel(page);
    await treeWidget.waitForSelector(".core-tree-node");
  });
});
