/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import "./ContentTabs.scss";
import * as React from "react";
import { IModelApp, IModelConnection, OutputMessagePriority } from "@itwin/core-frontend";
import { SvgLink } from "@itwin/itwinui-icons-react";
import { Button, HorizontalTabs } from "@itwin/itwinui-react";
import { SoloRulesetEditor } from "@itwin/presentation-rules-editor-react";
import { appLayoutContext, AppTab } from "../../AppContext";
import { OpeningIModelHint } from "../common/OpeningIModelHint";
import { serializeEditorState } from "../misc/EditorStateSerializer";
import { displayToast } from "../misc/Notifications";
import { EditorTab } from "./EditorTab";
import { ViewportTab } from "./ViewportTab";

export interface ContentTabsProps {
  imodel: IModelConnection | undefined;
  editor: SoloRulesetEditor;
}

export function ContentTabs(props: ContentTabsProps): React.ReactElement {
  const appLayout = React.useContext(appLayoutContext);
  const tabLabels = React.useMemo(
    () => [
      IModelApp.localization.getLocalizedString("App:label:editor"),
      IModelApp.localization.getLocalizedString("App:label:viewport"),
    ],
    [],
  );

  return (
    <div className="content-tabs">
      <div className="content-tabs-header">
        <HorizontalTabs
          type={"borderless"}
          labels={tabLabels}
          activeIndex={appLayout.activeTab}
          onTabSelected={appLayout.setActiveTab}
        />
        {appLayout.activeTab === AppTab.Editor && <ShareButton editor={props.editor} />}
      </div>
      {
        appLayout.activeTab === AppTab.Editor
          ? <EditorTab editor={props.editor} />
          : (props.imodel !== undefined ? <ViewportTab imodel={props.imodel} /> : <OpeningIModelHint />)
      }
    </div>
  );
}

interface ShareButtonProps {
  editor: SoloRulesetEditor;
}

function ShareButton(props: ShareButtonProps): React.ReactElement {
  const handleShareButtonClick = async () => {
    window.location.hash = serializeEditorState(props.editor.model.getValue());
    await navigator.clipboard.writeText(window.location.toString());
    displayToast(OutputMessagePriority.Success, IModelApp.localization.getLocalizedString("App:toast:link-copied"));
  };

  return (
    <Button id="share" size="small" startIcon={<SvgLink />} onClick={handleShareButtonClick}>
      {IModelApp.localization.getLocalizedString("App:label:share")}
    </Button>
  );
}
