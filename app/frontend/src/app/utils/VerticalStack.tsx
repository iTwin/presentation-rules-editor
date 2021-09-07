/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import "./VerticalStack.scss";
import * as React from "react";

export interface CenteredContentsProps {
  id?: string | undefined;
  className?: string | undefined;
  children: React.ReactNode;
}

export function VerticalStack(props: CenteredContentsProps): React.ReactElement {
  return (
    <div id={props.id} className={`vertical-stack ${props.className ?? ""}`}>
      {props.children}
    </div>
  );
}
