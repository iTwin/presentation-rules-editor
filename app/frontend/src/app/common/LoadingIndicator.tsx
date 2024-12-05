/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/

import * as React from "react";
import { ProgressRadial, Text } from "@itwin/itwinui-react";
import { VerticalStack } from "./CenteredStack.js";

export interface LoadingIndicatorProps {
  /** Style of the outer div. */
  style?: React.CSSProperties | undefined;

  /** Element id attribute. */
  id?: string | undefined;

  /** Content displayed under the loading animation. */
  children: React.ReactNode;
}

/** Displays a spinning loading animation with a description. */
export function LoadingIndicator(props: LoadingIndicatorProps): React.ReactElement {
  return (
    <VerticalStack id={props.id} style={props.style}>
      <ProgressRadial size="large" indeterminate={true} />
      <Text variant="leading" as="h3">
        {props.children}
      </Text>
    </VerticalStack>
  );
}
