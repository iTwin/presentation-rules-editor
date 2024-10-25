/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/

import "./CenteredContent.scss";
import * as React from "react";

/** @internal */
export interface CenteredContentProps {
  width: number;
  height: number;
  children: React.ReactNode;
}

/** @internal */
export function CenteredContent(props: CenteredContentProps): React.ReactElement {
  return (
    <div className="presentation-rules-editor-centered-content" style={{ width: props.width, height: props.height }}>
      {props.children}
    </div>
  );
}
