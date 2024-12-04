/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/

import { Svg404 } from "@itwin/itwinui-illustrations-react";
import * as React from "react";
import { ErrorPage } from "./ErrorPage.js";

/** Component to display in case of 404: Page not found error. */
export function PageNotFound(): React.ReactElement {
  return (
    <ErrorPage illustration={Svg404} title={"Page Not Found"}>
      Current URL does not match any application path.
    </ErrorPage>
  );
}
