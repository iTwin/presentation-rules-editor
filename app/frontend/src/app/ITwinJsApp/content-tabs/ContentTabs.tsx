/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/

import "./ContentTabs.scss";
import * as React from "react";
import { IModelApp, IModelConnection, OutputMessagePriority } from "@itwin/core-frontend";
import { SvgLink } from "@itwin/itwinui-icons-react";
import { Button, Tabs } from "@itwin/itwinui-react";
import { SoloRulesetEditor } from "@itwin/presentation-rules-editor-react";
import { OpeningIModelHint } from "../common/OpeningIModelHint.js";
import { rulesetEditorContext, RulesetEditorTab } from "../ITwinJsAppContext.js";
import { serializeEditorState } from "../misc/EditorStateSerializer.js";
import { useToastMessage } from "../misc/UseToastMessage.js";
import { EditorTab } from "./EditorTab.js";
import { ViewportTab } from "./ViewportTab.js";

export interface ContentTabsProps {
  imodel: IModelConnection | undefined;
  editor: SoloRulesetEditor;
}

export function ContentTabs(props: ContentTabsProps): React.ReactElement {
  const { activeTab, setActiveTab } = React.useContext(rulesetEditorContext);
  const tabLabels = React.useMemo(
    () => [IModelApp.localization.getLocalizedString("App:label:editor"), IModelApp.localization.getLocalizedString("App:label:viewport")],
    [],
  );

  return (
    <>
      <Tabs
        orientation="horizontal"
        wrapperClassName="content-tabs-wrapper"
        contentClassName="content-tabs-content"
        type="borderless"
        labels={tabLabels}
        activeIndex={activeTab}
        onTabSelected={setActiveTab}
      >
        {activeTab === RulesetEditorTab.Editor ? (
          <EditorTab editor={props.editor} />
        ) : props.imodel !== undefined ? (
          <ViewportTab imodel={props.imodel} />
        ) : (
          <OpeningIModelHint />
        )}
      </Tabs>
      <ShareButton editor={props.editor} />
    </>
  );
}

interface ShareButtonProps {
  editor: SoloRulesetEditor;
}

function ShareButton(props: ShareButtonProps): React.ReactElement {
  const toaster = useToastMessage();
  const handleShareButtonClick = async () => {
    window.location.hash = serializeEditorState(props.editor.model.getValue());
    await navigator.clipboard.writeText(window.location.toString());
    toaster(OutputMessagePriority.Success, IModelApp.localization.getLocalizedString("App:toast:link-copied"));
  };

  return (
    <Button id="share" size="small" startIcon={<SvgLink />} onClick={handleShareButtonClick}>
      {IModelApp.localization.getLocalizedString("App:label:share")}
    </Button>
  );
}
