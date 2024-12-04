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

export const clientId = import.meta.env.VITE_OAUTH_CLIENT_ID;
export const urlPrefix = import.meta.env.VITE_IMJS_URL_PREFIX;
export const appInsightsConnectionString = import.meta.env.VITE_APPLICATION_INSIGHTS_CONNECTION_STRING;

export const EXPERIMENTAL_STATION_VALUE_RENDERER = true;
