/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/

import "./Widget.scss";
import * as React from "react";
import { WidgetState } from "@itwin/appui-react";

export interface WidgetProps {
  /** Unique widget identifier */
  id: string;
  /** Widget label */
  label: string;
  /** The state in which this widget is initially presented */
  defaultState?: WidgetState;
  /** Widget contents */
  children?: React.ReactElement;
}

export function Widget(_props: WidgetProps): React.ReactElement | null {
  return null;
}
