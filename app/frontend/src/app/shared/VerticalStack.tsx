/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import "./VerticalStack.scss";
import * as React from "react";

export interface CenteredContentsProps {
  children: React.ReactNode;
}

export function VerticalStack(props: CenteredContentsProps): React.ReactElement {
  return (
    <div className="vertical-stack">
      {props.children}
    </div>
  );
}
