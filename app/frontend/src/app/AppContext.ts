/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import * as React from "react";
import { IModelBrowserTab } from "./IModelBrowser/IModelBrowser";
import { IModelIdentifier } from "./ITwinJsApp/IModelIdentifier";

export interface AppNavigationContext {
  openRulesetEditor(iModelIdentifier?: IModelIdentifier): void;
  openIModelBrowser(tab?: IModelBrowserTab): void;
}

export const appNavigationContext = React.createContext<AppNavigationContext>({
  openRulesetEditor: () => { },
  openIModelBrowser: () => { },
});
