/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import { expect } from "chai";
import { page } from "../setup";
import { loadHomepage, selectIModel } from "../utils";

describe("viewport", () => {
  before(async () => {
    await loadHomepage(page);
  });

  it("displays an iModel", async () => {
    await page.click("text=Viewport");
    expect(await page.textContent(".tab-view > :nth-child(2)")).to.be.equal("Select an iModel to view content.");

    await selectIModel(page);
    await page.waitForSelector("data-testid=viewport-component", { state: "visible" });
  });
});
