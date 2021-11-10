/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import { ApplicationInsights } from "@microsoft/applicationinsights-web";

export function initialize(connectionString: string): void {
  const appInsights = new ApplicationInsights({
    config: {
      connectionString,
      disableAjaxTracking: true,
    },
  });
  appInsights.loadAppInsights();
  appInsights.trackPageView();
}
