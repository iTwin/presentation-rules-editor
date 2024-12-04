/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/

import * as React from "react";
import { LoadingIndicator } from "./LoadingIndicator.js";

export function CheckingSignInStatusHint(): React.ReactElement {
  return <LoadingIndicator>Checking signin status...</LoadingIndicator>;
}
