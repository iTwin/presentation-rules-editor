/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import * as React from "react";
import { BackendApi } from "./api/BackendApi";

export const backendApiContext = React.createContext<BackendApi>(new BackendApi({} as any));

export interface RulesetEditorContext {
  activeTab: RulesetEditorTab;
  setActiveTab: (tab: RulesetEditorTab) => void;
}

export enum RulesetEditorTab {
  Editor,
  Viewport,
}

export const rulesetEditorContext = React.createContext<RulesetEditorContext>({
  activeTab: RulesetEditorTab.Editor,
  setActiveTab: () => { },
});
