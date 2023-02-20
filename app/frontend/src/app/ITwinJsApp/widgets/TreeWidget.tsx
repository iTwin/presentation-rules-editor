/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import * as React from "react";
import { IModelConnection } from "@itwin/core-frontend";
import { UnifiedSelectionContextProvider } from "@itwin/presentation-components";
import { EditableRuleset, Tree } from "@itwin/presentation-rules-editor-react";
import { AutoSizer } from "../common/AutoSizer";
import { LoadingHint } from "../common/LoadingHint";
import { OpeningIModelHint } from "../common/OpeningIModelHint";

export interface TreeWidgetProps {
  imodel: IModelConnection | undefined;
  ruleset: EditableRuleset | undefined;
}

export function TreeWidget(props: TreeWidgetProps): React.ReactElement {
  const { imodel, ruleset } = props;

  if (imodel === undefined) {
    return <OpeningIModelHint />;
  }

  if (ruleset === undefined) {
    return <LoadingHint />;
  }

  return (
    <UnifiedSelectionContextProvider imodel={imodel} selectionLevel={0}>
      <AutoSizer>
        {({ width, height }) => <Tree width={width} height={height} iModel={imodel} editableRuleset={ruleset} />}
      </AutoSizer>
    </UnifiedSelectionContextProvider>
  );
}
