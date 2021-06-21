/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import * as React from "react";
import { BackendApi } from "../api/BackendApi";

export const backendApiContext = React.createContext<BackendApi>(new BackendApi());

export interface AppLayoutContext {
  activeTab: AppTab;
  setActiveTab: (actveTab: AppTab) => void;
}

export enum AppTab {
  Editor = 0,
  Viewport = 1,
}

export const appLayoutContext = React.createContext<AppLayoutContext>({
  activeTab: AppTab.Editor,
  setActiveTab: () => {},
});
