/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import "./Explainer.scss";
import * as React from "react";
import { SvgHelpCircularHollow } from "@itwin/itwinui-icons-react";
import { Tooltip } from "@itwin/itwinui-react";

export interface ExplainerProps {
  /** Tooltip text. */
  children: React.ReactNode;
}

/** Displays a question mark with a hover tooltip. */
export function Explainer(props: ExplainerProps): React.ReactElement {
  return (
    <Tooltip content={props.children}>
      <span className="explainer">
        <SvgHelpCircularHollow width={16} height={16} />
      </span>
    </Tooltip>
  );
}
