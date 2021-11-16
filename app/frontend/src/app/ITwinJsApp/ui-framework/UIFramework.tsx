/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import * as React from "react";
import { Provider } from "react-redux";
import { StateManager, ThemeManager } from "@itwin/appui-react";

export interface UIFrameworkProps {
  children: React.ReactNode;
}

export function UIFramework(props: UIFrameworkProps): React.ReactElement {
  return (
    <Provider store={StateManager.store}>
      <ThemeManager>
        {props.children}
      </ThemeManager>
    </Provider>
  );
}
