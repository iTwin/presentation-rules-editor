/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/

import { Locator, Page } from "playwright";

export function getServiceUrl(): string {
  return process.env.SERVICE_URL ?? "http://localhost:3000";
}

export async function loadHomepage(page: Page): Promise<void> {
  await page.goto(getServiceUrl());
  await page.waitForSelector("text=Presentation Rules Editor");
}

export async function openIModelBrowser(page: Page): Promise<void> {
  await page.goto(`${getServiceUrl()}/browse-imodels`);
  await page.getByRole("heading", { name: "Browse iModels" }).waitFor();
}

export async function openTestIModel(page: Page): Promise<void> {
  await page.goto(`${getServiceUrl()}/open-imodel?snapshot=Baytown.bim`);
  await page.waitForSelector("id=app-loader", { state: "detached" });
}

export async function openDemoIModel(page: Page): Promise<void> {
  const iTwinId = "b27dc251-0e53-4a36-9a38-182fc309be07";
  const iModelId = "f30566da-8fdf-4cba-b09a-fd39f5397ae6";
  await page.goto(`${getServiceUrl()}/open-imodel?iTwinId=${iTwinId}&iModelId=${iModelId}`);
  await page.waitForSelector("id=app-loader", { state: "detached" });
}

export function getWidget(page: Page, widget: string): Locator {
  return page.locator(`.nz-widget-widget:has([role=tab][title=${widget}]) .nz-widget-content`);
}

export function getStagePanelGrip(page: Page, location: "bottom" | "right"): Locator {
  return page.locator(`.nz-widgetPanels-grip.nz-${location}[title="Resize widget panel"]`);
}

export function getEditor(page: Page): Locator {
  return page.locator("[role=code]");
}
