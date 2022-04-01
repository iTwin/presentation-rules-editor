/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import { expect } from "chai";
import { page } from "./setup";
import { getEditor, getServiceUrl, getWidget, openDemoIModel, openTestIModel } from "./utils";

describe("share button #local #web", () => {
  const testConfiguration = process.env.WEB_TEST
    ? {
      openIModel: openDemoIModel,
      expectedLink: `${getServiceUrl()}/open-imodel?iTwinId=b27dc251-0e53-4a36-9a38-182fc309be07&iModelId=f30566da-8fdf-4cba-b09a-fd39f5397ae6#editor/N4IgTgrgNgpgzjALiAXCR9EAJKwdjAD2QF8g`,
    }
    : {
      openIModel: openTestIModel,
      expectedLink: `${getServiceUrl()}/open-imodel?snapshot=Baytown.bim#editor/N4IgTgrgNgpgzjALiAXCR9EAJKwdjAD2QF8g`,
    };

  before(async () => {
    await testConfiguration.openIModel(page);
    const editor = await getEditor(page);
    await (await editor.$("text={"))?.click();
    await editor.press("Control+a");
    await editor.type("test ruleset text");
    await page.click('button:has-text("Share")');
  });

  it("updates address bar with a new URL", async () => {
    const location = await page.evaluate(async () => window.location.toString());
    expect(location).to.be.equal(testConfiguration.expectedLink);
  });

  it("copies ruleset URL to clipboard", async () => {
    const clipboard = await page.evaluate(async () => navigator.clipboard.readText());
    expect(clipboard).to.be.equal(testConfiguration.expectedLink);
  });
});

describe("opening shared link #local #web", () => {
  const baseAddress = process.env.WEB_TEST
    ? `${getServiceUrl()}/open-imodel?iTwinId=b27dc251-0e53-4a36-9a38-182fc309be07&iModelId=f30566da-8fdf-4cba-b09a-fd39f5397ae6`
    : `${getServiceUrl()}/open-imodel?snapshot=Baytown.bim`;

  it("populates editor with ruleset and loads widget data when link is valid", async () => {
    await page.goto(
      `${baseAddress}#editor/N4IgTgrgNgpgzjALiAXCYAdAdgAhxkASwBMCV8RF5EB9SWBRAgGmzwPvjJwG028cmXAPbhoMACoBPAA4xuBAEoB7ZYgByy4lxCthIgnDkBjQgDNCxgIaJCyrHG599Iwf1cDDJ6XIUgAwhBwiMoAtpraLO4eFIiy8qix1FEuHgRQVgBGMFB+VME0WFoJ0SIAvqU4ALrRFcI1WGUgZUA`,
    );
    // When only hash part of the URL changes, the reload will not happen, so we trigger it manually
    await page.reload();

    const editor = await getEditor(page);
    expect(await editor.$("text=test_ruleset")).not.to.be.null;

    const treeWidget = await getWidget(page, "Tree");
    expect(await treeWidget.waitForSelector("text=test_node")).not.to.be.null;
  });

  it("populates editor with ruleset when shared ruleset is invalid", async () => {
    await page.goto(`${baseAddress}#editor/N4IgTgrgNgpgzjALiAXCAlgOwG4EMroAmA+ovIsZLAsgL5A`);
    // When only hash part of the URL changes, the reload will not happen, so we trigger it manually
    await page.reload();

    const editor = await getEditor(page);
    const editorContent = await (await editor.$(".lines-content"))?.textContent();
    expect(editorContent).to.be.equal("invalid_test_ruleset");
  });

  it("shows an error when shared link is invalid", async () => {
    await page.goto(`${baseAddress}#editor/invalid_link_data`);
    // When only hash part of the URL changes, the reload will not happen, so we trigger it manually
    await page.reload();

    const editor = await getEditor(page);
    const editorContent = await (await editor.$(".lines-content"))?.textContent();
    // A non-breaking space is separating these words
    expect(editorContent).to.be.equal("<invalid\xa0ruleset>");
  });

  it("offers user to sign in when link points to a private iModel", async () => {
    await page.goto(`${getServiceUrl()}/open-imodel?iTwinId=test_itwin&iModelId=test_imodel`);

    const appHeader = await page.waitForSelector(".iui-page-header");
    const options = await page.waitForSelector(".landing-page-options");
    expect(await options?.textContent()).to.contain(
      (process.env.WEB_TEST || await appHeader.$('text="Offline mode"') === null) ? "Sign In" : "Go to homepage",
    );
  });
});

describe("opening snapshot link in #web", () => {
  it("shows user 404 error", async () => {
    await page.goto(`${getServiceUrl()}/open-imodel?snapshot=test_snapshot`);
    await page.waitForSelector('text="Page Not Found"');
  });
});
