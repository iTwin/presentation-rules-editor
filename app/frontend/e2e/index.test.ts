/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import { loadHomepage } from "./utils";

describe("index", () => {
  beforeAll(async () => {
    await loadHomepage(page);
  });

  it("displays an iModel", async () => {
    await page.selectOption(".IModelSelector select", { index: 1 });
    await page.waitForSelector("data-testid=viewport-component", { state: "visible" });
  });
});
