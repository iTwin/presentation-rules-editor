/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/

import * as React from "react";
import { IModelBrowserTab } from "./IModelBrowser/IModelBrowser.js";
import { IModelIdentifier } from "./ITwinJsApp/IModelIdentifier.js";

export interface AppNavigationContext {
  openRulesetEditor(iModelIdentifier?: IModelIdentifier): Promise<void>;
  openIModelBrowser(tab?: IModelBrowserTab): Promise<void>;
}

export const appNavigationContext = React.createContext<AppNavigationContext>({
  openRulesetEditor: async () => {},
  openIModelBrowser: async () => {},
});
