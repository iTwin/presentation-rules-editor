/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/

import { expect, test } from "@playwright/test";
import { getEditor, getServiceUrl, getWidget, openDemoIModel, openTestIModel } from "./utils.js";

test.describe("share button #local #web", () => {
  const testConfiguration = process.env.WEB_TEST
    ? {
        openIModel: openDemoIModel,
        /* cspell: disable-next-line */
        expectedLink: `${getServiceUrl()}/open-imodel?iTwinId=b27dc251-0e53-4a36-9a38-182fc309be07&iModelId=f30566da-8fdf-4cba-b09a-fd39f5397ae6#editor/N4IgTgrgNgpgzjALiAXCR9EAJKwdjAD2QF8g`,
      }
    : {
        openIModel: openTestIModel,
        /* cspell: disable-next-line */
        expectedLink: `${getServiceUrl()}/open-imodel?snapshot=Baytown.bim#editor/N4IgTgrgNgpgzjALiAXCR9EAJKwdjAD2QF8g`,
      };

  test.beforeEach(async ({ page }) => {
    await page.context().grantPermissions(["clipboard-read", "clipboard-write"]);
    await testConfiguration.openIModel(page);
    const editor = getEditor(page);
    await editor.locator("text={").first().click();
    await editor.press("Control+a");
    await page.keyboard.type("test ruleset text");
    await page.click('button:has-text("Share")');
  });

  test("updates address bar with a new URL", async ({ page }) => {
    const location = await page.evaluate(async () => window.location.toString());
    expect(location).toBe(testConfiguration.expectedLink);
  });
  test("copies ruleset URL to clipboard", async ({ page }) => {
    const clipboard = await page.evaluate(async () => navigator.clipboard.readText());
    expect(clipboard).toBe(testConfiguration.expectedLink);
  });
});

test.describe("opening shared link #local #web", () => {
  const baseAddress = process.env.WEB_TEST
    ? `${getServiceUrl()}/open-imodel?iTwinId=b27dc251-0e53-4a36-9a38-182fc309be07&iModelId=f30566da-8fdf-4cba-b09a-fd39f5397ae6`
    : `${getServiceUrl()}/open-imodel?snapshot=Baytown.bim`;

  // TODO: enable this test when demo imodels work in all environments.
  test.skip("populates editor with ruleset and loads widget data when link is valid", async ({ page }) => {
    await page.goto(
      /* cspell: disable-next-line */
      `${baseAddress}#editor/N4IgTgrgNgpgzjALiAXCYAdAdgAhxkASwBMCV8RF5EB9SWBRAgGmzwPvjJwG028cmXAPbhoMACoBPAA4xuBAEoB7ZYgByy4lxCthIgnDkBjQgDNCxgIaJCyrHG599Iwf1cDDJ6XIUgAwhBwiMoAtpraLO4eFIiy8qix1FEuHgRQVgBGMFB+VME0WFoJ0SIAvqU4ALrRFcI1WGUgZUA`,
    );
    // When only hash part of the URL changes, the reload will not happen, so we trigger it manually
    await page.reload();

    const editor = getEditor(page);
    await editor.locator("text=test_ruleset").waitFor();

    const treeWidget = getWidget(page, "Tree");
    await treeWidget.locator("text=test_node").waitFor();
  });

  test("populates editor with ruleset when shared ruleset is invalid", async ({ page }) => {
    /* cspell: disable-next-line */
    await page.goto(`${baseAddress}#editor/N4IgTgrgNgpgzjALiAXCAlgOwG4EMroAmA+ovIsZLAsgL5A`);
    // When only hash part of the URL changes, the reload will not happen, so we trigger it manually
    await page.reload();

    const editor = getEditor(page);
    const editorContent = await editor.locator(".lines-content").textContent();
    expect(editorContent).toBe("invalid_test_ruleset");
  });

  test("shows an error when shared link is invalid", async ({ page }) => {
    await page.goto(`${baseAddress}#editor/invalid_link_data`);
    // When only hash part of the URL changes, the reload will not happen, so we trigger it manually
    await page.reload();

    const editor = getEditor(page);
    const editorContent = await editor.locator(".lines-content").textContent();
    // A non-breaking space is separating these words
    expect(editorContent).toBe("<invalid\xa0ruleset>");
  });

  test("offers user to sign in when link points to a private iModel", async ({ page }) => {
    await page.goto(`${getServiceUrl()}/open-imodel?iTwinId=test_itwin&iModelId=test_imodel`);

    const appHeader = page.getByRole("banner");
    const options = page.locator(".landing-page-options");
    await Promise.all([appHeader.waitFor(), options.waitFor()]);

    const offlineMode = appHeader.getByText("Offline mode");
    const isOfflineModeVisible = await offlineMode.isVisible();
    expect(await options?.textContent()).toContain(process.env.WEB_TEST || isOfflineModeVisible === false ? "Sign In" : "Go to homepage");
  });
});

test.describe("opening snapshot link in #web", () => {
  test("shows user 404 error", async ({ page }) => {
    await page.goto(`${getServiceUrl()}/open-imodel?snapshot=test_snapshot`);
    await page.getByText("Page Not Found").waitFor();
  });
});
