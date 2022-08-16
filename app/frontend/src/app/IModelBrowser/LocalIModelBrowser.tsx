/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import * as React from "react";
import { CellProps } from "react-table";
import { IModelMetadata } from "@app/common";
import { SvgImodelHollow, SvgMore } from "@itwin/itwinui-icons-react";
import { FluidGrid } from "@itwin/itwinui-layouts-react";
import { Anchor, DropdownMenu, IconButton, MenuItem, Table, TableProps, Title } from "@itwin/itwinui-react";
import { appNavigationContext } from "../AppContext";
import { AsyncActionButton } from "../common/AsyncActionButton";
import { VerticalStack } from "../common/CenteredStack";
import { BackendApi, useBackendApi } from "../ITwinJsApp/api/BackendApi";
import { LoadingHint } from "../ITwinJsApp/common/LoadingHint";
import { iModelBrowserContext, IModelSnapshotTile } from "./IModelBrowser";

export interface LocalIModelBrowserProps {
  backendApiPromise: Promise<BackendApi> | undefined;
}

export function LocalIModelBrowser(props: LocalIModelBrowserProps): React.ReactElement {
  const backendApi = useBackendApi(props.backendApiPromise);
  const { displayMode, searchQuery } = React.useContext(iModelBrowserContext);
  const availableIModels = useAvailableIModels(backendApi, searchQuery);
  if (availableIModels?.length === 0) {
    return (
      <VerticalStack className="imodel-browser-no-data">
        <SvgImodelHollow />
        <Title isMuted>
          {searchQuery ? "No local iModels match search query" : "No local iModel snapshots found"}
        </Title>
        <AsyncActionButton onClick={async () => backendApi?.openIModelsDirectory()}>
          Open snapshots folder
        </AsyncActionButton>
      </VerticalStack>
    );
  }

  const openSnapshotsFolder = () => backendApi?.openIModelsDirectory();

  return displayMode === "grid"
    ? <GridView availableIModels={availableIModels} openSnapshotsFolder={openSnapshotsFolder} />
    : <TableView availableIModels={availableIModels} openSnapshotsFolder={openSnapshotsFolder} />;
}

function useAvailableIModels(backendApi: BackendApi | undefined, searchQuery: string): IModelMetadata[] | undefined {
  const [availableIModels, setAvailableIModels] = React.useState<IModelMetadata[]>();
  React.useEffect(
    () => {
      let disposed = false;
      void (async () => {
        const imodels = await backendApi?.getAvailableIModels();
        if (!disposed) {
          setAvailableIModels(imodels?.sort((a, b) => a.name.localeCompare(b.name)));
        }
      })();

      return () => { disposed = true; };
    },
    [backendApi],
  );

  searchQuery = searchQuery.trim().toLowerCase();
  return availableIModels?.filter(({ name }) => searchQuery === "" || name.toLowerCase().includes(searchQuery));
}

interface GridViewProps {
  availableIModels: IModelMetadata[] | undefined;
  openSnapshotsFolder: () => void;
}

function GridView(props: GridViewProps): React.ReactElement {
  if (props.availableIModels === undefined) {
    return <LoadingHint />;
  }

  return (
    <FluidGrid>
      {
        props.availableIModels.map((iModel) => (
          <IModelSnapshotTile key={iModel.name} name={iModel.name} openSnapshotsFolder={props.openSnapshotsFolder} />
        ))
      }
    </FluidGrid>
  );
}

interface TableViewProps {
  availableIModels: IModelMetadata[] | undefined;
  openSnapshotsFolder: () => void;
}

function TableView(props: TableViewProps): React.ReactElement {
  const navigation = React.useContext(appNavigationContext);
  const { openSnapshotsFolder } = props;
  const columns = React.useMemo<TableProps["columns"]>(
    () => {
      const menuItems = (close: () => void) => [
        <MenuItem key="open-folder" onClick={() => { openSnapshotsFolder(); close(); }}>
          Open containing folder
        </MenuItem>,
      ];
      return [{
        Header: "Table",
        columns: [
          {
            Header: "Name",
            accessor: "name",
            Cell(cellProps: CellProps<{}, string>) {
              return (
                <Anchor onClick={() => navigation.openRulesetEditor(cellProps.value)}>
                  {cellProps.value}
                </Anchor>
              );
            },
          },
          { Header: "File size", accessor: "size" },
          { Header: "Date modified", accessor: "dateModified" },
          {
            Header: "",
            id: "actions",
            maxWidth: 48,
            columnClassName: "iui-slot",
            cellClassName: "iui-slot",
            Cell() {
              return (
                <DropdownMenu menuItems={menuItems}>
                  <IconButton styleType="borderless"><SvgMore /></IconButton>
                </DropdownMenu>
              );
            },
          },
        ],
      }];
    },
    [navigation, openSnapshotsFolder],
  );

  const tableData = props.availableIModels?.map((iModel) => ({
    name: iModel.name,
    dateModified: iModel.dateModified.toLocaleDateString(),
    size: iModel.size,
  }));
  return <Table columns={columns} data={tableData ?? []} isLoading={tableData === undefined} emptyTableContent="" />;
}
