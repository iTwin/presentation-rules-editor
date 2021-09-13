/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import * as React from "react";
import { IModelApp } from "@bentley/imodeljs-frontend";
import { LoadingIndicator } from "../../utils/LoadingIndicator";

export function OpeningIModelHint(): React.ReactElement {
  return (
    <LoadingIndicator>
      {IModelApp.i18n.translate("App:opening-imodel")}
    </LoadingIndicator>
  );
}
