/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import { expect } from "chai";
import { page } from "./setup";
import { getServiceUrl, loadHomepage } from "./utils";

describe("homepage #local", () => {
  beforeEach(async () => {
    await loadHomepage(page);
  });

  it("opens iModel browser", async () => {
    expect(page.url().startsWith(`${getServiceUrl()}/browse-imodels`)).to.be.true;
  });
});

describe("homepage #web", () => {
  beforeEach(async () => {
    await loadHomepage(page);
  });

  it("opens default demo iModel", async () => {
    expect(page.url().startsWith(`${getServiceUrl()}/open-imodel?`)).to.be.true;
  });
});
