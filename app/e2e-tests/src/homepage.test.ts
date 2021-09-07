/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import { expect } from "chai";
import { page } from "./setup";
import { loadHomepage } from "./utils";

describe("homepage", () => {
  before(async () => {
    await loadHomepage(page);
  });

  it("allows opening local imodel snapshot", async () => {
    await page.click('.iui-tile:has-text("Baytown.bim") .iui-thumbnail');
    expect(page.url()).to.be.equal("http://localhost:8080/open-imodel?snapshot=Baytown.bim");
  });
});
