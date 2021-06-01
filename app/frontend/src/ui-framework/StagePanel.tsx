/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import * as React from "react";
import { WidgetProps } from "./Widget/Widget";

export interface StagePanelProps {
  /** Initial stage panel size */
  size?: number;
  /** Stage panel contents */
  children?: React.ReactElement<StagePanelZoneProps> | [
    React.ReactElement<StagePanelZoneProps>,
    React.ReactElement<StagePanelZoneProps>,
    React.ReactElement<StagePanelZoneProps>?,
  ];
}
export function StagePanel(_props: StagePanelProps): React.ReactElement | null {
  return null;
}

export interface StagePanelZoneProps {
  children?: React.ReactElement<WidgetProps> | Array<React.ReactElement<WidgetProps>>;
}

export function StagePanelZone(_props: StagePanelZoneProps): React.ReactElement | null {
  return null;
}
