/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/

import { IModelMetadata } from "@app/common";
import { SvgImodelHollow, SvgMore } from "@itwin/itwinui-icons-react";
import { FluidGrid } from "@itwin/itwinui-layouts-react";
import { Anchor, DropdownMenu, IconButton, MenuItem, Table, Text } from "@itwin/itwinui-react";
import { CellProps, Column } from "@itwin/itwinui-react/react-table";
import * as React from "react";
import { appNavigationContext } from "../AppContext";
import { AsyncActionButton } from "../common/AsyncActionButton";
import { VerticalStack } from "../common/CenteredStack";
import { BackendApi } from "../ITwinJsApp/api/BackendApi";
import { LoadingHint } from "../ITwinJsApp/common/LoadingHint";
import { iModelBrowserContext, IModelSnapshotTile, useBackendApi } from "./IModelBrowser";

export interface LocalIModelBrowserProps {
  backendApiPromise: Promise<BackendApi> | undefined;
}

export function LocalIModelBrowser(props: LocalIModelBrowserProps): React.ReactElement {
  const backendApi = useBackendApi(props.backendApiPromise);
  const { displayMode, searchQuery } = React.useContext(iModelBrowserContext);
  const availableIModels = useAvailableIModels(backendApi, searchQuery);
  const openSnapshotsFolder = React.useCallback(async () => backendApi?.openIModelsDirectory(), [backendApi]);
  if (availableIModels?.length === 0) {
    return (
      <VerticalStack className="imodel-browser-no-data">
        <SvgImodelHollow />
        <Text variant="title" as="h2" isMuted>
          {searchQuery ? "No local iModels match search query" : "No local iModel snapshots found"}
        </Text>
        <AsyncActionButton onClick={async () => backendApi?.openIModelsDirectory()}>Open snapshots folder</AsyncActionButton>
      </VerticalStack>
    );
  }

  return displayMode === "grid" ? (
    <GridView availableIModels={availableIModels} openSnapshotsFolder={openSnapshotsFolder} />
  ) : (
    <TableView availableIModels={availableIModels} openSnapshotsFolder={openSnapshotsFolder} />
  );
}

function useAvailableIModels(backendApi: BackendApi | undefined, searchQuery: string): IModelMetadata[] | undefined {
  const [availableIModels, setAvailableIModels] = React.useState<IModelMetadata[]>();
  React.useEffect(() => {
    let disposed = false;
    void (async () => {
      const imodels = await backendApi?.getAvailableIModels();
      if (!disposed) {
        setAvailableIModels(imodels?.sort((a, b) => a.name.localeCompare(b.name)));
      }
    })();

    return () => {
      disposed = true;
    };
  }, [backendApi]);

  searchQuery = searchQuery.trim().toLowerCase();
  return React.useMemo(
    () => availableIModels?.filter(({ name }) => searchQuery === "" || name.toLowerCase().includes(searchQuery)),
    [availableIModels, searchQuery],
  );
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
      {props.availableIModels.map((iModel) => (
        <IModelSnapshotTile key={iModel.name} name={iModel.name} openSnapshotsFolder={props.openSnapshotsFolder} />
      ))}
    </FluidGrid>
  );
}

interface TableViewProps {
  availableIModels: IModelMetadata[] | undefined;
  openSnapshotsFolder: () => void;
}

type TableData = Record<"name" | "size" | "dateModified", string>;

function TableView(props: TableViewProps): React.ReactElement {
  const navigation = React.useContext(appNavigationContext);
  const { openSnapshotsFolder, availableIModels } = props;
  const columns = React.useMemo(() => {
    const menuItems = (close: () => void) => [
      <MenuItem
        key="open-folder"
        onClick={() => {
          openSnapshotsFolder();
          close();
        }}
      >
        Open containing folder
      </MenuItem>,
    ];
    return [
      {
        Header: "Name",
        accessor: "name",
        Cell(cellProps: CellProps<TableData>) {
          return <Anchor onClick={() => navigation.openRulesetEditor(cellProps.value)}>{cellProps.value}</Anchor>;
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
              <IconButton styleType="borderless" label="Open actions">
                <SvgMore />
              </IconButton>
            </DropdownMenu>
          );
        },
      },
    ];
  }, [navigation, openSnapshotsFolder]) satisfies Column<TableData>[];

  const tableData = React.useMemo(
    () =>
      availableIModels?.map((iModel) => ({
        name: iModel.name,
        dateModified: iModel.dateModified.toLocaleDateString(),
        size: iModel.size,
      })) ?? [],
    [availableIModels],
  );
  return <Table columns={columns} data={tableData} isLoading={availableIModels === undefined} emptyTableContent="" />;
}
