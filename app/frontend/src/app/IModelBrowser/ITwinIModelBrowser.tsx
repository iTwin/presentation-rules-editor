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
import { Anchor, Button, Table, TableProps, Tile, Title } from "@itwin/itwinui-react";
import { appNavigationContext } from "../AppContext";
import { AuthorizationState, useAuthorization } from "../Authorization";
import { HorizontalStack, VerticalStack } from "../common/CenteredStack";
import { OfflineModeExplainer } from "../common/OfflineModeExplainer";
import { getProjectIModels, getUserProjects, IModelRepresentation, ProjectRepresentation } from "../ITwinApi";
import { LoadingHint } from "../ITwinJsApp/common/LoadingHint";
import { iModelBrowserContext, IModelTile } from "./IModelBrowser";

export function ITwinBrowser(): React.ReactElement {
  const { userAuthorizationClient, state, signIn } = useAuthorization();
  const [iTwins, setITwins] = React.useState<ProjectRepresentation[]>();
  const { displayMode, searchQuery } = React.useContext(iModelBrowserContext);

  React.useEffect(() => setITwins(undefined), [userAuthorizationClient, searchQuery]);

  useDebouncedAsyncEffect(
    async (disposedRef) => {
      if (userAuthorizationClient === undefined) {
        return;
      }

      const response = await getUserProjects("representation", userAuthorizationClient, searchQuery);
      if (!disposedRef.current && response) {
        setITwins(response.sort((a, b) => Date.parse(b.registrationDateTime) - Date.parse(a.registrationDateTime)));
      }
    },
    [userAuthorizationClient, searchQuery],
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
        <HorizontalStack>Projects are unavailable in offline mode. <OfflineModeExplainer /></HorizontalStack>
      </VerticalStack>
    );
  }

  if (iTwins?.length === 0) {
    return (
      <VerticalStack className="imodel-browser-no-data">
        <SvgProject />
        <Title isMuted>{searchQuery ? "No projects match given search query" : "No projects found"}</Title>
      </VerticalStack>
    );
  }

  return displayMode === "grid"
    ? <ITwinBrowserGridView iTwins={iTwins} />
    : <ITwinBrowserTableView iTwins={iTwins} />;
}

interface ITwinBrowserGridViewProps {
  iTwins: ProjectRepresentation[] | undefined;
}

function ITwinBrowserGridView(props: ITwinBrowserGridViewProps): React.ReactElement {
  const navigate = useNavigate();
  if (props.iTwins === undefined) {
    return <LoadingHint />;
  }

  return (
    <FluidGrid>
      {
        props.iTwins.map((iTwin) => (
          <div key={iTwin.id}>
            <Tile
              name={iTwin.displayName}
              variant="folder"
              isActionable
              thumbnail={<SvgProject />}
              description={iTwin.projectNumber}
              onClick={() => navigate(iTwin.id)}
            />
          </div>
        ))
      }
    </FluidGrid>
  );
}

interface ITwinBrowserTableViewProps {
  iTwins: ProjectRepresentation[] | undefined;
}

function ITwinBrowserTableView(props: ITwinBrowserTableViewProps): React.ReactElement {
  const navigate = useNavigate();
  const columns = React.useMemo<TableProps["columns"]>(
    () => [{
      Header: "Table",
      columns: [
        {
          Header: "Name",
          accessor: "name",
          Cell(cellProps: CellProps<{ id: string }>) {
            return <Anchor onClick={() => navigate(cellProps.row.original.id)}>{cellProps.value}</Anchor>;
          },
        },
        { Header: "Location", accessor: "location" },
        { Header: "Date created", accessor: "dateCreated" },
      ],
    }],
    [navigate],
  );
  const tableData = props.iTwins?.map((iTwin) => ({
    id: iTwin.id,
    name: iTwin.displayName,
    location: iTwin.geographicLocation,
    dateCreated: new Date(iTwin.registrationDateTime).toLocaleDateString(),
  }));
  return <Table columns={columns} data={tableData ?? []} isLoading={tableData === undefined} emptyTableContent="" />;
}

export function ITwinIModelBrowser(): React.ReactElement {
  const { iTwin } = useParams<{ iTwin: string }>();
  assert(iTwin !== undefined);

  const { userAuthorizationClient } = useAuthorization();
  const [iModels, setIModels] = React.useState<IModelRepresentation[]>();
  const { displayMode, searchQuery, clearSearchQuery } = React.useContext(iModelBrowserContext);

  // We do not want to inherit search query that was intended for iTwins
  React.useEffect(() => clearSearchQuery(), [clearSearchQuery]);
  React.useEffect(() => setIModels(undefined), [userAuthorizationClient, iTwin, searchQuery]);

  useDebouncedAsyncEffect(
    async (disposedRef) => {
      if (userAuthorizationClient === undefined) {
        return;
      }

      const response = await getProjectIModels(iTwin, "representation", userAuthorizationClient, searchQuery);
      if (!disposedRef.current && response) {
        setIModels(response.sort((a, b) => Date.parse(b.createdDateTime) - Date.parse(a.createdDateTime)));
      }
    },
    [userAuthorizationClient, iTwin, searchQuery],
    500,
  );

  if (iModels?.length === 0) {
    return (
      <VerticalStack className="imodel-browser-no-data">
        <SvgImodelHollow />
        <Title isMuted>
          {searchQuery ? "No iModels match search query exactly" : "No iModels found in this iTwin"}
        </Title>
      </VerticalStack>
    );
  }

  return displayMode === "grid"
    ? <IModelBrowserGridView iModels={iModels} authorizationClient={userAuthorizationClient} />
    : <IModelBrowserTableView iModels={iModels} />;
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
          iTwinId={iModel.projectId}
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
    () => [{
      Header: "Table",
      columns: [
        {
          Header: "Name",
          accessor: "name",
          Cell(cellProps: CellProps<{ id: string, iTwinId: string }>) {
            const iTwinId = cellProps.row.original.iTwinId;
            const iModelId = cellProps.row.original.id;
            const handleClick = () => navigation.openRulesetEditor({ iTwinId, iModelId });
            return <Anchor onClick={handleClick}>{cellProps.value}</Anchor>;
          },
        },
        { Header: "Description", accessor: "description" },
        { Header: "Date created", accessor: "dateCreated" },
      ],
    }],
    [navigation],
  );
  const tableData = props.iModels?.map((iModel) => ({
    id: iModel.id,
    iTwinId: iModel.projectId,
    name: iModel.displayName,
    description: iModel.description,
    dateCreated: new Date(iModel.createdDateTime).toLocaleDateString(),
  }));
  return <Table columns={columns} data={tableData ?? []} isLoading={tableData === undefined} emptyTableContent="" />;
}

function useDebouncedAsyncEffect(
  effect: (disposedRef: { current: boolean }) => Promise<void>,
  dependencies: unknown[],
  cooldownMilliseconds: number,
): void {
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

        timeout = setTimeout(
          () => {
            if (!disposedRef.current) {
              activeEffectRef.current = effect(disposedRef);
            }
          },
          cooldownMilliseconds,
        );
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
