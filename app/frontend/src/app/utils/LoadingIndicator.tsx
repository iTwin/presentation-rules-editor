/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import * as React from "react";
import { Leading, ProgressRadial } from "@itwin/itwinui-react";
import { VerticalStack } from "./CenteredStack";

export interface LoadingIndicatorProps {
  /** Element id attribute. */
  id?: string | undefined;

  /** Content displayed under the loading animation. */
  children: React.ReactNode;
}

/** Displays a spinning loading animation with a description. */
export function LoadingIndicator(props: LoadingIndicatorProps): React.ReactElement {
  return (
    <VerticalStack id={props.id}>
      <ProgressRadial size="large" indeterminate={true} />
      <Leading>{props.children}</Leading>
    </VerticalStack>
  );
}
