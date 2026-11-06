/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PropertyRecord } from "@itwin/appui-abstract";
import { IModelConnection } from "@itwin/core-frontend";
import * as itwinuiReact from "@itwin/itwinui-react";
import { Field } from "@itwin/presentation-common";
import * as presentationComponents from "@itwin/presentation-components";
import { cleanup, render, waitFor } from "@testing-library/react";
import { EditableRuleset } from "../EditableRuleset.js";
import { MockFunction, stubPresentationManager } from "../TestUtils.js";
import { TableProps } from "./Table.js";

const tableMocks = vi.hoisted(() => ({
  uiTable: vi.fn(),
  cellRenderer: vi.fn(),
  usePresentationTable: vi.fn(),
}));

vi.mock("@itwin/itwinui-react", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@itwin/itwinui-react")>()),
  Table: tableMocks.uiTable,
}));

vi.mock("@itwin/presentation-components", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@itwin/presentation-components")>()),
  TableCellRenderer: tableMocks.cellRenderer,
  usePresentationTableWithUnifiedSelection: tableMocks.usePresentationTable,
}));

describe("Table", () => {
  interface ColumnType {
    id: string;
    Cell?: any;
  }
  interface RowType {
    [columnId: string]: string;
  }
  const commonProps: Omit<TableProps, "editableRuleset"> = {
    width: 100,
    height: 100,
    iModel: {} as IModelConnection,
  };

  let Table: (props: TableProps) => React.JSX.Element;
  const stubITwinUiTable = tableMocks.uiTable as MockFunction<typeof itwinuiReact.Table>;
  const stubPresentationTableCellRenderer = tableMocks.cellRenderer as MockFunction<typeof presentationComponents.TableCellRenderer>;
  const stubUsePresentationTable = tableMocks.usePresentationTable as MockFunction<
    typeof presentationComponents.usePresentationTableWithUnifiedSelection<ColumnType, RowType>
  >;
  let editableRuleset: EditableRuleset;

  beforeEach(async () => {
    stubPresentationManager();
    stubITwinUiTable.mockImplementation(() => <></>);
    Table = (await import("./Table.js")).Table;
    editableRuleset = new EditableRuleset({ initialRuleset: { id: "", rules: [] } });
  });

  afterEach(() => {
    // React cleanup hooks need to run first before we restore stubs
    cleanup();

    editableRuleset[Symbol.dispose]();
    vi.restoreAllMocks();
    vi.resetAllMocks();
  });

  describe("normal state", () => {
    beforeEach(() => {
      stubUsePresentationTable.mockImplementation(() => ({
        isLoading: false,
        columns: [
          {
            id: "test-column",
          },
        ],
        rows: [
          {
            "test-column": "test value",
          },
        ],
        selectedRows: [],
        onSelect: vi.fn(),
        loadMoreRows: vi.fn(),
        filter: vi.fn(),
        sort: vi.fn(),
      }));
    });

    it("renders iTwinUi Table", () => {
      render(<Table {...commonProps} editableRuleset={editableRuleset} />);
      expect(stubITwinUiTable).toHaveBeenCalledOnce();
      const args = stubITwinUiTable.mock.calls[0][0];
      expect(args.isLoading).toBe(false);
      expect(args.columns).toEqual([
        {
          id: "test-column",
        },
      ]);
      expect(args.data).toEqual([
        {
          "test-column": "test value",
        },
      ]);
    });

    it("uses new ruleset when editable ruleset is updated", async () => {
      render(<Table {...commonProps} editableRuleset={editableRuleset} />);
      await editableRuleset.updateRuleset({ id: "", rules: [] });
      await waitFor(() => {
        expect(stubUsePresentationTable).toHaveBeenCalledTimes(2);
        expect(stubUsePresentationTable.mock.calls[0][0].ruleset).not.toBe(stubUsePresentationTable.mock.calls[1][0].ruleset);
      });
    });

    it("maps Presentation defs to iTwinUi Table defs", () => {
      stubPresentationTableCellRenderer.mockImplementation(() => <></>);
      render(<Table {...commonProps} editableRuleset={editableRuleset} />);
      expect(stubUsePresentationTable).toHaveBeenCalledOnce();
      const args = stubUsePresentationTable.mock.calls[0][0];

      const { Cell, ...columnMapperResult } = args.columnMapper({
        name: "test-column",
        label: "Test Column",
        field: {} as Field,
      });
      expect(columnMapperResult).toEqual({
        id: "test-column",
        accessor: "test-column",
        Header: "Test Column",
      });
      expect(Cell).toBeDefined();

      const record = PropertyRecord.fromString("test value");
      const rowsMapperResult = args.rowMapper({
        key: "test-row-id",
        cells: [
          {
            key: "test-column",
            record,
          },
        ],
      });
      expect(rowsMapperResult).toEqual({
        "test-column": record,
      });

      const { container } = render(<Cell value={undefined} />);
      expect(stubPresentationTableCellRenderer).not.toHaveBeenCalled();
      expect(container.innerHTML).toBe("");

      render(<Cell value={record} />);
      expect(stubPresentationTableCellRenderer).toHaveBeenCalledOnce();
      expect(stubPresentationTableCellRenderer.mock.calls[0][0]).toEqual({ record });
    });
  });

  describe("loading content state", () => {
    beforeEach(() => {
      stubUsePresentationTable.mockImplementation(() => ({
        isLoading: true,
        columns: undefined,
        rows: [],
        selectedRows: [],
        onSelect: vi.fn(),
        loadMoreRows: vi.fn(),
        filter: vi.fn(),
        sort: vi.fn(),
      }));
    });

    it("renders supplied component", () => {
      const { getByText } = render(<Table {...commonProps} editableRuleset={editableRuleset} loadingContentState={() => <>Test Component</>} />);
      getByText("Test Component");
    });

    it("renders default message when component is not supplied", () => {
      const { getByText } = render(<Table {...commonProps} editableRuleset={editableRuleset} />);
      getByText("Loading table content...");
    });
  });

  describe("no content state", () => {
    beforeEach(() => {
      stubUsePresentationTable.mockImplementation(() => ({
        isLoading: false,
        columns: [],
        rows: [],
        selectedRows: [],
        onSelect: vi.fn(),
        loadMoreRows: vi.fn(),
        filter: vi.fn(),
        sort: vi.fn(),
      }));
    });

    it("renders supplied component", () => {
      const { getByText } = render(<Table {...commonProps} editableRuleset={editableRuleset} noContentState={() => <>Test Component</>} />);
      getByText("Test Component");
    });

    it("renders default message when component is not supplied", () => {
      const { getByText } = render(<Table {...commonProps} editableRuleset={editableRuleset} />);
      getByText("There is no content for current selection.");
    });
  });

  describe("no rows state", () => {
    beforeEach(() => {
      stubUsePresentationTable.mockImplementation(() => ({
        isLoading: false,
        columns: [
          {
            id: "test-column",
          },
        ],
        rows: [],
        selectedRows: [],
        onSelect: vi.fn(),
        loadMoreRows: vi.fn(),
        filter: vi.fn(),
        sort: vi.fn(),
      }));
    });

    it("passes supplied component to iTwinUi Table", () => {
      render(<Table {...commonProps} editableRuleset={editableRuleset} noRowsState={() => <>Test Component</>} />);
      expect(stubITwinUiTable).toHaveBeenCalledOnce();
      const { emptyTableContent } = stubITwinUiTable.mock.calls[0][0];
      const { getByText } = render(emptyTableContent);
      getByText("Test Component");
    });

    it("passes default message to iTwinUi Table when component is not supplied", () => {
      render(<Table {...commonProps} editableRuleset={editableRuleset} />);
      expect(stubITwinUiTable).toHaveBeenCalledOnce();
      const { emptyTableContent } = stubITwinUiTable.mock.calls[0][0];
      const { getByText } = render(emptyTableContent);
      getByText("No rows.");
    });
  });
});
