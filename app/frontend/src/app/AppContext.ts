/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import * as React from "react";
import { BackendApi } from "../api/BackendApi";

export const backendApiContext = React.createContext<BackendApi>(new BackendApi());

export interface AppLayoutContext {
  activeTab: AppTab;
  setActiveTab: (action: React.SetStateAction<AppTab>) => void;
  breadcrumbs: React.ReactNode[];
  setBreadcrumbs: (action: React.SetStateAction<React.ReactNode[]>) => void;
}

export enum AppTab {
  Editor = 0,
  Viewport = 1,
}

export const appLayoutContext = React.createContext<AppLayoutContext>({
  activeTab: AppTab.Editor,
  setActiveTab: (tab) => tab,
  breadcrumbs: [],
  setBreadcrumbs: (breadcrumbs) => breadcrumbs,
});
