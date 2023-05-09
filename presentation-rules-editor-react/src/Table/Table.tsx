/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import * as React from "react";
import { PropertyRecord } from "@itwin/appui-abstract";
import { IModelConnection } from "@itwin/core-frontend";
import { ProgressRadial, Table as UiTable } from "@itwin/itwinui-react";
import { Ruleset } from "@itwin/presentation-common";
import {
  TableCellRenderer, TableColumnDefinition, TableRowDefinition, usePresentationTableWithUnifiedSelection,
} from "@itwin/presentation-components";
import { CenteredContent } from "../CenteredContent";
import { EditableRuleset } from "../EditableRuleset";

export interface TableProps {
  /** Width of the property grid element. */
  width: number;

  /** Height of the property grid element. */
  height: number;

  /** Connection to an iModel from which to pull property data. */
  iModel: IModelConnection;

  /** {@linkcode EditableRuleset} to keep track of. */
  editableRuleset: EditableRuleset;

  /** Component to be rendered while Table content is being loaded. */
  loadingContentState?: (() => React.ReactElement) | undefined;

  /** Component to be rendered if there is no content to be displayed in the table. */
  noContentState?: (() => React.ReactElement) | undefined;

  /** Component to be rendered if there are no rows to be rendered in the table. */
  noRowsState?: (() => React.ReactElement) | undefined;
}

/**
 * Displays properties of selected elements in a Table format. This component updates itself when {@linkcode EditableRuleset} content
 * changes.
 */
export function Table(props: TableProps) {
  const [ruleset, setRuleset] = React.useState<Ruleset>(props.editableRuleset.rulesetContent);
  React.useEffect(
    () => props.editableRuleset.onAfterRulesetUpdated.addListener(() => setRuleset({ ...props.editableRuleset.rulesetContent })),
    [props.editableRuleset],
  );

  const { columns, rows, isLoading, loadMoreRows } = usePresentationTableWithUnifiedSelection({
    imodel: props.iModel,
    ruleset,
    pageSize: 20,
    columnMapper: mapColumns,
    rowMapper: mapRows,
  });

  if (columns === undefined) {
    return props.loadingContentState?.() ?? (
      <CenteredContent width={props.width} height={props.height}>
        <ProgressRadial size="large" indeterminate={true} />
        Loading table content...
      </CenteredContent>
    );
  }

  if (columns.length === 0) {
    return props.noContentState?.() ?? (
      <CenteredContent width={props.width} height={props.height}>
        There is no content for current selection.
      </CenteredContent>
    );
  }

  return (
    <UiTable
      columns={columns}
      data={rows}
      enableVirtualization={true}
      style={{ height: `${props.height}px` }}
      emptyTableContent={props.noRowsState?.() ?? (
        <>No rows.</>
      )}
      onBottomReached={loadMoreRows}
      isLoading={isLoading}
      density="extra-condensed"
      styleType="zebra-rows"
    />
  );
}

function mapColumns(columnDefinitions: TableColumnDefinition) {
  return {
    id: columnDefinitions.name,
    accessor: columnDefinitions.name,
    Header: columnDefinitions.label,
    Cell: cellRenderer,
  };
}

function mapRows(rowDefinition: TableRowDefinition) {
  const newRow: { [key: string]: PropertyRecord } = {};
  rowDefinition.cells.forEach((cell) => { newRow[cell.key] = cell.record; });
  return newRow;
}

function cellRenderer(cellProps: { value?: PropertyRecord }) {
  if (!cellProps.value)
    return null;

  return <TableCellRenderer record={cellProps.value} />;
}
