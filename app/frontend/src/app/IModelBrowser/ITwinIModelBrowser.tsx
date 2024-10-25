/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/

import * as React from "react";
import { useNavigate, useParams } from "react-router-dom";
import { CellProps } from "react-table";
import { assert } from "@itwin/core-bentley";
import { AuthorizationClient } from "@itwin/core-common";
import { SvgImodelHollow, SvgProject } from "@itwin/itwinui-icons-react";
import { FluidGrid } from "@itwin/itwinui-layouts-react";
import { Anchor, Button, Table, TableProps, Text, Tile } from "@itwin/itwinui-react";
import { appNavigationContext } from "../AppContext";
import { AuthorizationState, useAuthorization } from "../Authorization";
import { HorizontalStack, VerticalStack } from "../common/CenteredStack";
import { OfflineModeExplainer } from "../common/OfflineModeExplainer";
import { getITwinIModels, getUserProjects, IModelRepresentation, ITwinRepresentation } from "../ITwinApi";
import { LoadingHint } from "../ITwinJsApp/common/LoadingHint";
import { iModelBrowserContext, IModelTile } from "./IModelBrowser";

export function ITwinBrowser(): React.ReactElement {
  const { userAuthorizationClient: authorizationClient, state, signIn } = useAuthorization();
  const [iTwins, setITwins] = React.useState<ITwinRepresentation[]>();
  const { displayMode, searchQuery } = React.useContext(iModelBrowserContext);

  React.useEffect(() => setITwins(undefined), [authorizationClient, searchQuery]);

  useDebouncedAsyncEffect(
    async (disposedRef) => {
      if (authorizationClient === undefined) {
        return;
      }

      const response = await getUserProjects({ detail: "representation", search: searchQuery }, { authorizationClient });
      if (!disposedRef.current && response) {
        setITwins(response.sort((a, b) => Date.parse(b.createdDateTime) - Date.parse(a.createdDateTime)));
      }
    },
    [authorizationClient, searchQuery],
    500,
  );

  if (state === AuthorizationState.SignedOut) {
    return (
      <VerticalStack>
        Sign in to access your projects.
        <Button onClick={signIn}>Sign In</Button>
      </VerticalStack>
    );
  }

  if (state === AuthorizationState.Offline) {
    return (
      <VerticalStack>
        <HorizontalStack>
          Projects are unavailable in offline mode. <OfflineModeExplainer />
        </HorizontalStack>
      </VerticalStack>
    );
  }

  if (iTwins?.length === 0) {
    return (
      <VerticalStack className="imodel-browser-no-data">
        <SvgProject />
        <Text variant="title" as="h2" isMuted>
          {searchQuery ? "No projects match given search query" : "No projects found"}
        </Text>
      </VerticalStack>
    );
  }

  return displayMode === "grid" ? <ITwinBrowserGridView iTwins={iTwins} /> : <ITwinBrowserTableView iTwins={iTwins} />;
}

interface ITwinBrowserGridViewProps {
  iTwins: ITwinRepresentation[] | undefined;
}

function ITwinBrowserGridView(props: ITwinBrowserGridViewProps): React.ReactElement {
  const navigate = useNavigate();
  if (props.iTwins === undefined) {
    return <LoadingHint />;
  }

  return (
    <FluidGrid>
      {props.iTwins.map((iTwin) => (
        <div key={iTwin.id}>
          <Tile
            name={iTwin.displayName}
            variant="folder"
            isActionable
            thumbnail={iTwin.image ?? <SvgProject />}
            description={iTwin.number}
            onClick={() => navigate(iTwin.id)}
          />
        </div>
      ))}
    </FluidGrid>
  );
}

interface ITwinBrowserTableViewProps {
  iTwins: ITwinRepresentation[] | undefined;
}

function ITwinBrowserTableView(props: ITwinBrowserTableViewProps): React.ReactElement {
  const navigate = useNavigate();
  const columns = React.useMemo<TableProps["columns"]>(
    () => [
      {
        Header: "Table",
        columns: [
          {
            Header: "Name",
            accessor: "name",
            Cell(cellProps: CellProps<{ id: string }>) {
              return <Anchor onClick={() => navigate(cellProps.row.original.id)}>{cellProps.value}</Anchor>;
            },
          },
          { Header: "Date created", accessor: "dateCreated" },
        ],
      },
    ],
    [navigate],
  );
  const tableData = props.iTwins?.map((iTwin) => ({
    id: iTwin.id,
    name: iTwin.displayName,
    dateCreated: new Date(iTwin.createdDateTime).toLocaleDateString(),
  }));
  return <Table columns={columns} data={tableData ?? []} isLoading={tableData === undefined} emptyTableContent="" />;
}

export function ITwinIModelBrowser(): React.ReactElement {
  const { iTwin } = useParams<{ iTwin: string }>();
  assert(iTwin !== undefined);

  const { userAuthorizationClient: authorizationClient } = useAuthorization();
  const [iModels, setIModels] = React.useState<IModelRepresentation[]>();
  const { displayMode, searchQuery, clearSearchQuery } = React.useContext(iModelBrowserContext);

  // We do not want to inherit search query that was intended for iTwins
  React.useEffect(() => clearSearchQuery(), [clearSearchQuery]);
  React.useEffect(() => setIModels(undefined), [authorizationClient, iTwin, searchQuery]);

  useDebouncedAsyncEffect(
    async (disposedRef) => {
      if (authorizationClient === undefined) {
        return;
      }

      const response = await getITwinIModels({ iTwinId: iTwin, detail: "representation", name: searchQuery }, { authorizationClient });
      if (!disposedRef.current && response) {
        setIModels(response.sort((a, b) => Date.parse(b.createdDateTime) - Date.parse(a.createdDateTime)));
      }
    },
    [authorizationClient, iTwin, searchQuery],
    500,
  );

  if (iModels?.length === 0) {
    return (
      <VerticalStack className="imodel-browser-no-data">
        <SvgImodelHollow />
        <Text variant="title" as="h2" isMuted>
          {searchQuery ? "No iModels match search query exactly" : "No iModels found in this iTwin"}
        </Text>
      </VerticalStack>
    );
  }

  return displayMode === "grid" ? (
    <IModelBrowserGridView iModels={iModels} authorizationClient={authorizationClient} />
  ) : (
    <IModelBrowserTableView iModels={iModels} />
  );
}

interface IModelBrowserGridViewProps {
  iModels: IModelRepresentation[] | undefined;
  authorizationClient: AuthorizationClient | undefined;
}

function IModelBrowserGridView(props: IModelBrowserGridViewProps): React.ReactElement {
  const { iModels, authorizationClient } = props;
  if (iModels === undefined || authorizationClient === undefined) {
    return <LoadingHint />;
  }

  return (
    <FluidGrid>
      {iModels.map((iModel) => (
        <IModelTile
          key={iModel.id}
          iTwinId={iModel.iTwinId}
          iModelId={iModel.id}
          name={iModel.name}
          description={iModel.description ?? undefined}
          authorizationClient={authorizationClient}
        />
      ))}
    </FluidGrid>
  );
}

interface IModelBrowserTableViewProps {
  iModels: IModelRepresentation[] | undefined;
}

function IModelBrowserTableView(props: IModelBrowserTableViewProps): React.ReactElement {
  const navigation = React.useContext(appNavigationContext);
  const columns = React.useMemo<TableProps["columns"]>(
    () => [
      {
        Header: "Table",
        columns: [
          {
            Header: "Name",
            accessor: "name",
            Cell(cellProps: CellProps<{ id: string; iTwinId: string }>) {
              const iTwinId = cellProps.row.original.iTwinId;
              const iModelId = cellProps.row.original.id;
              const handleClick = () => navigation.openRulesetEditor({ iTwinId, iModelId });
              return <Anchor onClick={handleClick}>{cellProps.value}</Anchor>;
            },
          },
          { Header: "Description", accessor: "description" },
          { Header: "Date created", accessor: "dateCreated" },
        ],
      },
    ],
    [navigation],
  );
  const tableData = props.iModels?.map((iModel) => ({
    id: iModel.id,
    iTwinId: iModel.iTwinId,
    name: iModel.displayName,
    description: iModel.description,
    dateCreated: new Date(iModel.createdDateTime).toLocaleDateString(),
  }));
  return <Table columns={columns} data={tableData ?? []} isLoading={tableData === undefined} emptyTableContent="" />;
}

function useDebouncedAsyncEffect(effect: (disposedRef: { current: boolean }) => Promise<void>, dependencies: unknown[], cooldownMilliseconds: number): void {
  const activeEffectRef = React.useRef(Promise.resolve());

  React.useEffect(
    () => {
      const disposedRef = { current: false };
      let timeout: any;
      void (async () => {
        await activeEffectRef.current;
        if (disposedRef.current) {
          return;
        }

        timeout = setTimeout(() => {
          if (!disposedRef.current) {
            activeEffectRef.current = effect(disposedRef);
          }
        }, cooldownMilliseconds);
      })();
      return () => {
        disposedRef.current = true;
        clearTimeout(timeout);
      };
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    dependencies,
  );
}
