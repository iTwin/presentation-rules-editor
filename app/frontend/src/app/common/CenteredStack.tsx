/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/

import "./CenteredStack.scss";
import * as React from "react";

export interface CenteredStackProps {
  id?: string | undefined;
  className?: string | undefined;
  style?: React.CSSProperties | undefined;
  children: React.ReactNode;
}

export function VerticalStack(props: CenteredStackProps): React.ReactElement {
  return (
    <div id={props.id} className={getClassName("vertical-stack", props.className)} style={props.style}>
      {props.children}
    </div>
  );
}

export function HorizontalStack(props: CenteredStackProps): React.ReactElement {
  return (
    <span id={props.id} className={getClassName("horizontal-stack", props.className)} style={props.style}>
      {props.children}
    </span>
  );
}

function getClassName(mainClassName: string, auxiliaryClassName: string | undefined): string {
  return auxiliaryClassName ? `${mainClassName} ${auxiliaryClassName}` : mainClassName;
}
