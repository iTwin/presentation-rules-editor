/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import * as React from "react";

export interface WidgetProps {
  id: string;
  children?: React.ReactElement;
}

export const Widget: React.FC<WidgetProps> = () => null;
