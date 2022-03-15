/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import { page } from "../setup";
import { openTestIModel } from "../utils";

describe("viewport #local", () => {
  before(async () => {
    await openTestIModel(page);
  });

  it("displays an iModel", async () => {
    await page.click("text=Viewport");
    await page.waitForSelector("data-testid=viewport-component", { state: "visible" });
  });
});
