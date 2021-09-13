/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import * as React from "react";
import { IModelApp, IModelConnection } from "@bentley/imodeljs-frontend";
import { Ruleset } from "@bentley/presentation-common";
import { appLayoutContext } from "../../AppContext";
import { TabView, TabViewItem } from "../ui-framework/TabView/TabView";
import { OpeningIModelHint } from "../utils/OpeningIModelHint";
import { Editor } from "./editor/Editor";
import { Viewport } from "./viewport/Viewport";

export interface ContentTabsProps {
  imodel?: IModelConnection;
  defaultRuleset: string;
  submitRuleset: (ruleset: Ruleset) => void;
}

export function ContentTabs(props: ContentTabsProps): React.ReactElement {
  const appLayout = React.useContext(appLayoutContext);
  return (
    <TabView activeTab={appLayout.activeTab} setActiveTab={appLayout.setActiveTab}>
      <TabViewItem label={IModelApp.i18n.translate("App:label:editor")}>
        <Editor initialText={props.defaultRuleset} submitRuleset={props.submitRuleset} />
      </TabViewItem>
      <TabViewItem label={IModelApp.i18n.translate("App:label:viewport")}>
        {props.imodel !== undefined ? <Viewport imodel={props.imodel} /> : <OpeningIModelHint />}
      </TabViewItem>
    </TabView>
  );
}
