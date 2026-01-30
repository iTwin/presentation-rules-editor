/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/

import { test } from "@playwright/test";
import { getTreeWidget, openDemoIModel } from "./utils.js";

test.describe("demo iModel #web", () => {
  test("opens", async ({ page }) => {
    await openDemoIModel(page);
    const treeWidget = getTreeWidget(page);
    await treeWidget.getByRole("treeitem", { name: "Expand 2D Display Style" }).waitFor();
  });
});
