/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import * as React from "react";
import { CellProps } from "react-table";
import { IModelMetadata } from "@app/common";
import { SvgImodel, SvgImodelHollow, SvgMore } from "@itwin/itwinui-icons-react";
import { FluidGrid } from "@itwin/itwinui-layouts-react";
import { Anchor, DropdownMenu, IconButton, MenuItem, Table, TableProps, Tile, Title } from "@itwin/itwinui-react";
import { appNavigationContext } from "../AppContext";
import { AsyncActionButton } from "../common/AsyncActionButton";
import { VerticalStack } from "../common/CenteredStack";
import { BackendApi } from "../ITwinJsApp/api/BackendApi";
import { LoadingHint } from "../ITwinJsApp/common/LoadingHint";
import { iModelBrowserContext } from "./IModelBrowser";

export interface LocalIModelBrowserProps {
  backendApiPromise: Promise<BackendApi> | undefined;
}

export function LocalIModelBrowser(props: LocalIModelBrowserProps): React.ReactElement {
  const backendApi = useBackendApi(props.backendApiPromise);
  const availableIModels = useAvailableIModels(backendApi);
  const { displayMode } = React.useContext(iModelBrowserContext);

  if (availableIModels?.length === 0) {
    return (
      <VerticalStack className="imodel-browser-no-snapshots">
        <SvgImodelHollow />
        <Title>No local iModel snapshots found</Title>
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

function useBackendApi(backendApiPromise: Promise<BackendApi> | undefined): BackendApi | undefined {
  const [backendApi, setBackendApi] = React.useState<BackendApi>();
  React.useEffect(
    () => {
      let disposed = false;
      void (async () => {
        const backendApiResult = await backendApiPromise;
        if (!disposed) {
          setBackendApi(backendApiResult);
        }
      })();

      return () => { disposed = true; };
    },
    [backendApiPromise],
  );

  return backendApi;
}

function useAvailableIModels(backendApi: BackendApi | undefined): IModelMetadata[] | undefined {
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

  return availableIModels;
}

interface GridViewProps {
  availableIModels: IModelMetadata[] | undefined;
  openSnapshotsFolder: () => void;
}

function GridView(props: GridViewProps): React.ReactElement {
  const navigation = React.useContext(appNavigationContext);
  if (props.availableIModels === undefined) {
    return <LoadingHint />;
  }

  const handleTileClick = (name: string) => (event: React.MouseEvent) => {
    // This function is called whenever any element within the tile is clicked
    if ((event.target as Element).matches("button[aria-label='More options'], button[aria-label='More options'] *")) {
      return;
    }

    navigation.openRulesetEditor(name);
  };

  return (
    <FluidGrid>
      {
        props.availableIModels.map((iModel, i) => (
          <Tile
            key={i}
            name={iModel.name}
            description="Snapshot iModel"
            thumbnail={<SvgImodel />}
            isActionable
            onClick={handleTileClick(iModel.name)}
            moreOptions={[
              <MenuItem key="open-folder" onClick={props.openSnapshotsFolder}>Open containing folder</MenuItem>,
            ]}
          />
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
