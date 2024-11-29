/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/

import { page } from "../setup.js";
import { openTestIModel } from "../utils.js";

describe("viewport #local", () => {
  beforeEach(async () => {
    await openTestIModel(page);
  });

  it("displays an iModel", async () => {
    await page.click("text=Viewport");
    await page.waitForSelector("data-testid=viewport-component", { state: "visible" });
  });
});
