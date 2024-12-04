/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly DEPLOYMENT_TYPE?: string;
  readonly OAUTH_CLIENT_ID?: string;
  readonly IMJS_URL_PREFIX?: string;
  readonly APPLICATION_INSIGHTS_CONNECTION_STRING?: string;
}
interface ImportMeta {
  readonly env: ImportMetaEnv;
}
