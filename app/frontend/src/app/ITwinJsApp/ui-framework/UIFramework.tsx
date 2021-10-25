/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import * as React from "react";
import { Provider } from "react-redux";
import { FrameworkVersion, StateManager, ThemeManager } from "@itwin/appui-react";

export const UIFramework: React.FC = (props) => {
  return (
    <Provider store={StateManager.store}>
      <ThemeManager>
        <FrameworkVersion version="2">
          {props.children}
        </FrameworkVersion>
      </ThemeManager>
    </Provider>
  );
};
