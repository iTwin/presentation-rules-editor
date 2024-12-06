/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/

import * as React from "react";
import { IModelApp } from "@itwin/core-frontend";
import { LoadingIndicator } from "../../common/LoadingIndicator.js";

export function OpeningIModelHint(): React.ReactElement {
  return <LoadingIndicator>{IModelApp.localization.getLocalizedString("App:opening-imodel")}</LoadingIndicator>;
}
