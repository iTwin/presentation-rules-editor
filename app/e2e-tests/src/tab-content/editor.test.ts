/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import { expect } from "chai";
import { page } from "../setup";
import { getWidget, loadHomepage, selectIModel } from "../utils";

describe("editor", () => {
  before(async () => {
    await loadHomepage(page);
  });

  it("is populated with template ruleset", async () => {
    expect(await page.textContent("[role=code]")).to.contain('"Ruleset1"');
  });

  it("suggests completions based on ruleset schema", async () => {
    const editor = (await page.$("[role=code]"))!;

    await (await editor.$("text=true"))!.dblclick();
    await editor.press("Backspace");
    await editor.press("Control+Space");
    const suggestions = await editor.waitForSelector(".suggest-widget");

    const options = await suggestions.$$("[role=option]");
    expect(options.length).to.be.equal(2);
    expect(await options[0].$("text=false")).not.to.be.null;
    expect(await options[1].$("text=true")).not.to.be.null;
  });

  describe("ruleset submission", () => {
    beforeEach(async () => {
      await loadHomepage(page);
      await selectIModel(page);
    });

    it("submits ruleset when button is clicked", async () => {
      const editor = (await page.$("[role=code]"))!;

      await (await editor.$("text=Element"))!.dblclick();
      await editor.press("Backspace");

      await (await editor.$("text=Submit ruleset"))!.click();
      const treeWidget = await getWidget(page, "Tree");
      await treeWidget.waitForSelector("text=The data required for this tree layout is not available in this iModel.");
    });

    it("submits ruleset when keyboard shortcut is pressed", async () => {
      const editor = (await page.$("[role=code]"))!;

      await (await editor.$("text=Element"))!.dblclick();
      await editor.press("Backspace");

      await editor.press("Alt+Enter");
      const treeWidget = await getWidget(page, "Tree");
      await treeWidget.waitForSelector("text=The data required for this tree layout is not available in this iModel.");
    });

    it("submits ruleset when command is invoked from the command palette", async () => {
      const editor = (await page.$("[role=code]"))!;

      await (await editor.$("text=Element"))!.dblclick();
      await editor.press("Backspace");

      await editor.press("F1");
      await editor.type("Submit ruleset");
      await editor.press("Enter");
      const treeWidget = await getWidget(page, "Tree");
      await treeWidget.waitForSelector("text=The data required for this tree layout is not available in this iModel.");
    });
  });
});
