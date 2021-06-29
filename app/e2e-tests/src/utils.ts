/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import { ElementHandle, Page } from "playwright";

export async function loadHomepage(page: Page): Promise<void> {
  await page.goto("http://localhost:8080");
  await page.waitForSelector("text=Select iModel");
}

export async function selectIModel(page: Page): Promise<void> {
  await page.click("text=Select iModel");
  await page.click("text=Baytown.bim");
}

export async function getWidget(page: Page, widget: string): Promise<ElementHandle<HTMLElement>> {
  return page.waitForSelector(`.nz-widget-widget:has([role=tab][title=${widget}]) .nz-widget-content`);
}
