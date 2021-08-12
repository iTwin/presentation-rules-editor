/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import * as React from "react";
import { Leading, ProgressRadial } from "@itwin/itwinui-react";
import { VerticalStack } from "./VerticalStack";

export function InitializationIndicator(): React.ReactElement {
  return (
    <VerticalStack>
      <ProgressRadial size="large" indeterminate={true} />
      <Leading>Initializing...</Leading>
    </VerticalStack>
  );
}
