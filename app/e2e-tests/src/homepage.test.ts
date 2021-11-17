/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import { expect } from "chai";
import { page } from "./setup";
import { getServiceUrl, loadHomepage } from "./utils";

describe("#local homepage", () => {
  before(async () => {
    // eslint-disable-next-line no-console
    console.time("Homepage load");
    await loadHomepage(page);
    // eslint-disable-next-line no-console
    console.timeEnd("Homepage load");
  });

  it("allows opening local imodel snapshot", async () => {
    await page.click('.iui-tile:has-text("Baytown.bim") .iui-thumbnail');
    expect(page.url()).to.be.equal(`${getServiceUrl()}/open-imodel?snapshot=Baytown.bim`);
  });
});

describe("#web homepage", () => {
  before(async () => {
    await loadHomepage(page);
  });

  it("gives options to sign in or clone", async () => {
    expect(await page.waitForSelector("text=Sign In"));
    expect(await page.waitForSelector("text=Clone"));
  });
});
