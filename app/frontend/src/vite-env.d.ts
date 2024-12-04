/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_DEPLOYMENT_TYPE?: string;
  readonly VITE_OAUTH_CLIENT_ID?: string;
  readonly VITE_IMJS_URL_PREFIX?: string;
  readonly VITE_APPLICATION_INSIGHTS_CONNECTION_STRING?: string;
}
interface ImportMeta {
  readonly env: ImportMetaEnv;
}
