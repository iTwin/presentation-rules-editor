/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/

import { ThemeManager, UiFramework, UiStateStorageHandler } from "@itwin/appui-react";
import * as React from "react";
import { MemoryUISettingsStorage } from "./MemoryUISettingsStorage";

export interface UIFrameworkProps {
  children: React.ReactNode;
}

export function UIFramework(props: UIFrameworkProps): React.ReactElement {
  React.useEffect(() => {
    void UiFramework.setUiStateStorage(new MemoryUISettingsStorage(), true);
  }, []);

  return (
    <UiStateStorageHandler>
      <ThemeManager>{props.children}</ThemeManager>
    </UiStateStorageHandler>
  );
}
