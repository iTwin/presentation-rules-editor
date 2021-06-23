/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import { page } from "./setup";
import { loadHomepage } from "./utils";

describe("index", () => {
  before(async () => {
    await loadHomepage(page);
  });

  it("displays an iModel", async () => {
    await page.click("text=Viewport");
    await page.click("text=Select iModel");
    await page.click("text=Baytown.bim");
    await page.waitForSelector("data-testid=viewport-component", { state: "visible" });
  });
});
