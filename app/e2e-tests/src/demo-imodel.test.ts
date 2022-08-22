/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import { page } from "./setup";
import { getWidget, openDemoIModel } from "./utils";

describe("demo iModel #web", () => {
  it("opens", async () => {
    await openDemoIModel(page);
    const treeWidget = getWidget(page, "Tree");
    await treeWidget.locator(".core-tree-node").first().waitFor();
  });
});
