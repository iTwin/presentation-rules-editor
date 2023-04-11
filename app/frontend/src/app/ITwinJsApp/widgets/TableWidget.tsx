/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
*   See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import "./TableWidget.scss";
import * as React from "react";
import { ErrorBoundary, FallbackProps } from "react-error-boundary";
import { IModelApp, IModelConnection } from "@itwin/core-frontend";
import { SvgError, SvgTimedOut } from "@itwin/itwinui-illustrations-react";
import { Button, NonIdealState } from "@itwin/itwinui-react";
import { PresentationError, PresentationStatus } from "@itwin/presentation-common";
import { UnifiedSelectionContextProvider } from "@itwin/presentation-components";
import { EditableRuleset, Table } from "@itwin/presentation-rules-editor-react";
import { VerticalStack } from "../../common/CenteredStack";
import { LoadingIndicator } from "../../common/LoadingIndicator";
import { AutoSizer } from "../common/AutoSizer";
import { LoadingHint } from "../common/LoadingHint";
import { OpeningIModelHint } from "../common/OpeningIModelHint";
import { rulesetEditorContext, RulesetEditorTab } from "../ITwinJsAppContext";

export interface TableProps {
  imodel: IModelConnection | undefined;
  ruleset: EditableRuleset | undefined;
}

export function TableWidget(props: TableProps) {
  if (props.imodel === undefined) {
    return <OpeningIModelHint />;
  }

  if (props.ruleset === undefined) {
    return <LoadingHint />;
  }

  return (
    <UnifiedSelectionContextProvider imodel={props.imodel} selectionLevel={0}>
      <LoadedTable iModel={props.imodel} ruleset={props.ruleset} />
    </UnifiedSelectionContextProvider>
  );
}

interface LoadedTableProps {
  iModel: IModelConnection;
  ruleset: EditableRuleset;
}

function LoadedTable(props: LoadedTableProps): React.ReactElement {
  const fallbackRender = React.useCallback((fallbackProps: FallbackProps) => {
    return <TableErrorState {...fallbackProps} ruleset={props.ruleset} />;
  }, [props.ruleset]);

  return (
    <ErrorBoundary fallbackRender={fallbackRender}>
      <div className="presentation-rules-editor-table">
        <AutoSizer>
          {({ width, height }) => (
            <>
              <Table
                width={width}
                height={height}
                iModel={props.iModel}
                editableRuleset={props.ruleset}
                noContentState={() => (
                  <NoElementsSelectedState height={height} />
                )}
                noRowsState={() => (
                  <NoElementsSelectedState height={height} />
                )}
                loadingContentState={() => (
                  <LoadingPropertiesState height={height} />
                )}
              />
            </>
          )}
        </AutoSizer>
      </div>
    </ErrorBoundary>
  );
}

interface NoElementsSelectedStateProps {
  height: number;
}

function NoElementsSelectedState(props: NoElementsSelectedStateProps): React.ReactElement {
  const { activeTab, setActiveTab } = React.useContext(rulesetEditorContext);
  return (
    <VerticalStack style={{ height: props.height }}>
      <span>{IModelApp.localization.getLocalizedString("App:table.no-elements-selected")}</span>
      {
        activeTab !== RulesetEditorTab.Viewport &&
        <Button onClick={() => setActiveTab(RulesetEditorTab.Viewport)}>
          {IModelApp.localization. getLocalizedString("App:table.show-viewport")}
        </Button>
      }
    </VerticalStack>
  );
}

interface LoadingPropertiesStateProps {
  height: number;
}

function LoadingPropertiesState(props: LoadingPropertiesStateProps): React.ReactElement {
  return (
    <LoadingIndicator style={{ height: props.height }}>
      {IModelApp.localization.getLocalizedString("App:table.loading-properties")}
    </LoadingIndicator>
  );
}

function TableErrorState(props: { error: Error, resetErrorBoundary: () => void, ruleset: EditableRuleset }) {
  const { error, resetErrorBoundary, ruleset } = props;

  let svg = <SvgError />;
  if (error instanceof PresentationError && error.errorNumber === PresentationStatus.BackendTimeout) {
    svg = <SvgTimedOut />;
  }

  React.useEffect(
    () => ruleset.onAfterRulesetUpdated.addListener(() => resetErrorBoundary()),
    [ruleset, resetErrorBoundary],
  );

  return (
    <div style={{ position: "relative" }}>
      <NonIdealState
        svg={svg}
        heading={IModelApp.localization.getLocalizedString("App:table.error")}
        description={IModelApp.localization.getLocalizedString("App:table.generic-error-description")}
        actions={
          <>
            <Button styleType={"high-visibility"} onClick={resetErrorBoundary}>{IModelApp.localization.getLocalizedString("App:label.retry")}</Button>
          </>
        }
      />
    </div>
  );
}
