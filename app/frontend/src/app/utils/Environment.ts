/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/

/** Adds process.env.IMJS_URL_PREFIX to URL hostname. */
export function applyUrlPrefix(url: string): string {
  if (!process.env.IMJS_URL_PREFIX) {
    return url;
  }

  const modifierUrl = new URL(url);
  modifierUrl.hostname = process.env.IMJS_URL_PREFIX + modifierUrl.hostname;
  return modifierUrl.toString();
}
