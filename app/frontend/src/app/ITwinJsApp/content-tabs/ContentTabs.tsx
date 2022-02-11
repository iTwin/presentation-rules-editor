/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import * as React from "react";
import { IModelApp, IModelConnection } from "@itwin/core-frontend";
import { SoloRulesetEditor } from "@itwin/presentation-rules-editor-react";
import { appLayoutContext } from "../../AppContext";
import { OpeningIModelHint } from "../common/OpeningIModelHint";
import { TabView, TabViewItem } from "../ui-framework/TabView/TabView";
import { EditorTab } from "./EditorTab";
import { ViewportTab } from "./ViewportTab";

export interface ContentTabsProps {
  imodel: IModelConnection | undefined;
  editor: SoloRulesetEditor;
}

export function ContentTabs(props: ContentTabsProps): React.ReactElement {
  const appLayout = React.useContext(appLayoutContext);
  return (
    <TabView activeTab={appLayout.activeTab} setActiveTab={appLayout.setActiveTab}>
      <TabViewItem label={IModelApp.localization.getLocalizedString("App:label:editor")}>
        <EditorTab editor={props.editor} />
      </TabViewItem>
      <TabViewItem label={IModelApp.localization.getLocalizedString("App:label:viewport")}>
        {props.imodel !== undefined ? <ViewportTab imodel={props.imodel} /> : <OpeningIModelHint />}
      </TabViewItem>
    </TabView>
  );
}
