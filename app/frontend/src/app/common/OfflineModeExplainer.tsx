/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/

import * as React from "react";
import { Explainer } from "./Explainer.js";

export function OfflineModeExplainer(): React.ReactElement {
  return <Explainer>To access online imodels, setup a .env file in repository root</Explainer>;
}
