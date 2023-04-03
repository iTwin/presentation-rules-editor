/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import { expect } from "chai";
import * as sinon from "sinon";
import { PropertyRecord } from "@itwin/appui-abstract";
import { IModelConnection } from "@itwin/core-frontend";
import * as itwinuiReact from "@itwin/itwinui-react";
import { Field } from "@itwin/presentation-common";
import * as presentationComponents from "@itwin/presentation-components";
import { cleanup, render } from "@testing-library/react";
import { EditableRuleset } from "../EditableRuleset";
import { SinonStub, stubPresentationManager } from "../TestUtils";
import { Table, TableProps } from "./Table";

describe("Table", () => {
  interface ColumnType {
    id: string;
  }
  interface RowType {
    [columnId: string]: string;
  }
  const commonProps: Omit<TableProps, "editableRuleset"> = {
    width: 100,
    height: 100,
    iModel: {} as IModelConnection,
  };

  let stubITwinUiTable: SinonStub<typeof itwinuiReact.Table>;
  let stubPresentationTableCellRenderer: SinonStub<typeof presentationComponents.TableCellRenderer>;
  let stubUsePresentationTable: SinonStub<typeof presentationComponents.usePresentationTableWithUnifiedSelection<ColumnType, RowType>>;
  let editableRuleset: EditableRuleset;

  beforeEach(() => {
    stubPresentationManager();

    stubITwinUiTable = sinon.stub(itwinuiReact, "Table").callsFake(() => <></>);
    stubPresentationTableCellRenderer = sinon.stub(presentationComponents, "TableCellRenderer");
    stubUsePresentationTable = sinon.stub(presentationComponents, "usePresentationTableWithUnifiedSelection") as any;
    editableRuleset = new EditableRuleset({ initialRuleset: { id: "", rules: [] } });
  });

  afterEach(() => {
    // React cleanup hooks need to run first before we restore stubs
    cleanup();

    editableRuleset.dispose();
    sinon.restore();
  });

  describe("normal state", () => {
    beforeEach(() => {
      stubUsePresentationTable.callsFake(() => ({
        isLoading: false,
        columns: [{
          id: "test-column",
        }],
        rows: [{
          "test-column": "test value",
        }],
        loadMoreRows: sinon.stub(),
        filter: sinon.stub(),
        sort: sinon.stub(),
      }));
    });

    it("renders iTwinUi Table", () => {
      render(<Table {...commonProps} editableRuleset={editableRuleset} />);
      expect(stubITwinUiTable).to.have.been.calledOnce;
      const args = stubITwinUiTable.args[0][0];
      expect(args.isLoading).to.be.false;
      expect(args.columns).to.deep.eq([{
        id: "test-column",
      }]);
      expect(args.data).to.deep.eq([{
        "test-column": "test value",
      }]);
    });

    it("maps Presentation defs to iTwinUi Table defs", () => {
      stubPresentationTableCellRenderer.callsFake(() => <></>);
      render(<Table {...commonProps} editableRuleset={editableRuleset} />);
      expect(stubUsePresentationTable).to.have.been.calledOnce;
      const args = stubUsePresentationTable.args[0][0];

      const { Cell, ...columnMapperResult } = args.columnMapper({
        name: "test-column",
        label: "Test Column",
        field: sinon.createStubInstance(Field),
      }) as any;
      expect(columnMapperResult).to.deep.eq({
        id: "test-column",
        accessor: "test-column",
        Header: "Test Column",
      });
      expect(Cell).to.not.be.undefined;

      const record = PropertyRecord.fromString("test value");
      const rowsMapperResult = args.rowMapper({
        key: "test-row-id",
        cells: [{
          key: "test-column",
          record,
        }],
      });
      expect(rowsMapperResult).to.deep.eq({
        "test-column": record,
      });

      const { container } = render(<Cell value={undefined} />);
      expect(stubPresentationTableCellRenderer).to.not.be.called;
      expect(container.innerHTML).to.be.empty;

      render(<Cell value={record} />);
      expect(stubPresentationTableCellRenderer).to.be.calledOnceWith({ record });
    });
  });

  describe("loading content state", () => {
    beforeEach(() => {
      stubUsePresentationTable.callsFake(() => ({
        isLoading: true,
        columns: undefined,
        rows: [],
        loadMoreRows: sinon.stub(),
        filter: sinon.stub(),
        sort: sinon.stub(),
      }));
    });

    it("renders supplied component", () => {
      const { getByText } = render(
        <Table
          {...commonProps}
          editableRuleset={editableRuleset}
          loadingContentState={() => <>Test Component</>}
        />,
      );
      expect(getByText("Test Component")).not.to.be.null;
    });

    it("renders default message when component is not supplied", () => {
      const { getByText } = render(<Table {...commonProps} editableRuleset={editableRuleset} />);
      expect(getByText("Loading table content...")).not.to.be.null;
    });
  });

  describe("no content state", () => {
    beforeEach(() => {
      stubUsePresentationTable.callsFake(() => ({
        isLoading: false,
        columns: [],
        rows: [],
        loadMoreRows: sinon.stub(),
        filter: sinon.stub(),
        sort: sinon.stub(),
      }));
    });

    it("renders supplied component", () => {
      const { getByText } = render(
        <Table
          {...commonProps}
          editableRuleset={editableRuleset}
          noContentState={() => <>Test Component</>}
        />,
      );
      expect(getByText("Test Component")).not.to.be.null;
    });

    it("renders default message when component is not supplied", () => {
      const { getByText } = render(<Table {...commonProps} editableRuleset={editableRuleset} />);
      expect(getByText("There is no content for current selection.")).not.to.be.null;
    });
  });

  describe("no rows state", () => {
    beforeEach(() => {
      stubUsePresentationTable.callsFake(() => ({
        isLoading: false,
        columns: [{
          id: "test-column",
        }],
        rows: [],
        loadMoreRows: sinon.stub(),
        filter: sinon.stub(),
        sort: sinon.stub(),
      }));
    });

    it("passes supplied component to iTwinUi Table", () => {
      render(
        <Table
          {...commonProps}
          editableRuleset={editableRuleset}
          noRowsState={() => <>Test Component</>}
        />,
      );
      expect(stubITwinUiTable).to.have.been.calledOnceWith(sinon.match(({ emptyTableContent }) => {
        const { getByText } = render(emptyTableContent);
        return !!getByText("Test Component");
      }));
    });

    it("passes default message to iTwinUi Table when component is not supplied", () => {
      render(<Table {...commonProps} editableRuleset={editableRuleset} />);
      expect(stubITwinUiTable).to.have.been.calledOnceWith(sinon.match(({ emptyTableContent }) => {
        const { getByText } = render(emptyTableContent);
        return !!getByText("No rows.");
      }));
    });
  });
});
