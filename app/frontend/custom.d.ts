/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      readonly APPLICATION_INSIGHTS_CONNECTION_STRING: string | undefined;
      readonly DEPLOYMENT_TYPE: "dev" | "web" | "local";
      readonly IMJS_URL_PREFIX: string | undefined;
      readonly OAUTH_CLIENT_ID: string | undefined;
    }
  }
}

export {};
