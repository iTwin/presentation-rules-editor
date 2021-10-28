/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import { ElementHandle, Page } from "playwright";

export function getServiceUrl(): string {
  return process.env.SERVICE_URL ?? "http://localhost:8080";
}

export async function loadHomepage(page: Page): Promise<void> {
  await page.goto(getServiceUrl());
  await page.waitForSelector("text=Presentation Rules Editor");
}

export async function openTestIModel(page: Page): Promise<void> {
  await page.goto(`${getServiceUrl()}/open-imodel?snapshot=Baytown.bim`);
  await page.waitForSelector("id=app-loader", { state: "detached" });
}

export async function getWidget(page: Page, widget: string): Promise<ElementHandle<HTMLElement>> {
  return page.waitForSelector(`.nz-widget-widget:has([role=tab][title=${widget}]) .nz-widget-content`);
}

export async function getEditor(page: Page): Promise<ElementHandle<HTMLElement>> {
  const element = await page.waitForSelector("[role=code]");
  // Wait for syntax highlighting to kick in so that text nodes do not disappear while we interact with them
  await element.waitForSelector(".mtk20");
  return element;
}
