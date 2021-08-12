/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import * as React from "react";
import { IModelApp } from "@bentley/imodeljs-frontend";
import { VerticalStack } from "../../utils/VerticalStack";

export function SelectIModelHint(): React.ReactElement {
  return (
    <VerticalStack>
      <span>{IModelApp.i18n.translate("App:imodel-selector.no-imodel-selected")}</span>
    </VerticalStack>
  );
}
