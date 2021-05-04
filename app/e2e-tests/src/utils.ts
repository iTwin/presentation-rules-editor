/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import { Page } from "playwright";

export async function loadHomepage(page: Page): Promise<void> {
  await page.goto("http://localhost:8080");
}
