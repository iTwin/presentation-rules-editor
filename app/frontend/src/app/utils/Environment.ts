/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/

/** Adds urlPrefix to URL hostname. */
export function applyUrlPrefix(url: string): string {
  if (!urlPrefix) {
    return url;
  }

  const modifierUrl = new URL(url);
  modifierUrl.hostname = urlPrefix + modifierUrl.hostname;
  return modifierUrl.toString();
}

export const clientId = getAppMetadata("clientId");
export const urlPrefix = getAppMetadata("urlPrefix");
export const appInsightsConnectionString = getAppMetadata("appInsights");

function getAppMetadata(propertyName: string): string {
  return document.head.querySelector(`meta[itemprop=${propertyName}]`)?.getAttribute("content") ?? "";
}
