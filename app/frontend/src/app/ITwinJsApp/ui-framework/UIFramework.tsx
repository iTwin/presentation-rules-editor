/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import * as React from "react";
import { Provider } from "react-redux";
import { StateManager, ThemeManager, UiFramework, UiStateStorageHandler } from "@itwin/appui-react";
import { MemoryUISettingsStorage } from "./MemoryUISettingsStorage";

export interface UIFrameworkProps {
  children: React.ReactNode;
}

export function UIFramework(props: UIFrameworkProps): React.ReactElement {
  React.useEffect(
    () => {
      void UiFramework.setUiStateStorage(new MemoryUISettingsStorage(), true);
    },
    [],
  );

  return (
    <Provider store={StateManager.store}>
      <UiStateStorageHandler>
        <ThemeManager>
          {props.children}
        </ThemeManager>
      </UiStateStorageHandler>
    </Provider>
  );
}
