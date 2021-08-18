/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import * as React from "react";
import { Leading, ProgressRadial } from "@itwin/itwinui-react";
import { VerticalStack } from "./VerticalStack";

export interface LoadingIndicatorProps {
  /** Content displayed under the loading animation. */
  children: React.ReactNode;
}

/** Displays a spinning loading animation with a description. */
export function LoadingIndicator(props: LoadingIndicatorProps): React.ReactElement {
  return (
    <VerticalStack>
      <ProgressRadial size="large" indeterminate={true} />
      <Leading>{props.children}</Leading>
    </VerticalStack>
  );
}
