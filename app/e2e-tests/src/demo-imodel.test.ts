/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/

import { test } from "@playwright/test";
import { getWidget, openDemoIModel } from "./utils.js";

// TODO: enable this test when demo imodels work in all environments.
test.describe.skip("demo iModel #web", () => {
  test("opens", async ({ page }) => {
    await openDemoIModel(page);
    const treeWidget = getWidget(page, "Tree");
    await treeWidget.locator(".core-tree-node").first().waitFor();
  });
});
