/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/

import * as React from "react";
import { LoadingIndicator } from "../../common/LoadingIndicator";

export function LoadingHint(): React.ReactElement {
  return <LoadingIndicator>Loading...</LoadingIndicator>;
}
