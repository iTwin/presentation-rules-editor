/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import * as React from "react";
import { WidgetProps } from "./Widget";

export interface StagePanelProps {
  size?: number;
  children?: React.ReactElement<WidgetProps> | React.ReactElement<WidgetProps>[];
}

export const StagePanel: React.FC<StagePanelProps> = () => null;
