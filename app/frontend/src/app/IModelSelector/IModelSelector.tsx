/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import "./IModelSelector.scss";
import * as React from "react";
import { useNavigate } from "react-router-dom";
import { IModelGrid, ProjectFull, ProjectGrid } from "@itwin/imodel-browser-react";
import { SvgChevronRight, SvgImodel, SvgImodelHollow } from "@itwin/itwinui-icons-react";
import { Button, MenuItem, ProgressRadial, Text } from "@itwin/itwinui-react";
import { AuthorizationState, useAuthorization } from "../Authorization";
import { AsyncActionButton } from "../common/AsyncActionButton";
import { HorizontalStack, VerticalStack } from "../common/CenteredStack";
import { CheckingSignInStatusHint } from "../common/CheckingSignInStatusHint";
import { OfflineModeExplainer } from "../common/OfflineModeExplainer";
import { Tile, TileSkeleton } from "../common/Tile";
import { BackendApi } from "../ITwinJsApp/api/BackendApi";

export interface IModelSelectorProps {
  backendApiPromise: Promise<BackendApi> | undefined;
}

export function IModelSelector(props: IModelSelectorProps): React.ReactElement | null {
  return (
    <div className="imodel-selector-group">
      {
        process.env.DEPLOYMENT_TYPE !== "web" &&
        <OfflineSelector backendApiPromise={props.backendApiPromise} />
      }
      <OnlineSelector />
    </div>
  );
}

interface OfflineSelectorProps {
  backendApiPromise: Promise<BackendApi> | undefined;
}

const OfflineSelector = React.memo((props: OfflineSelectorProps) => {
  const backendApi = useBackendApi(props.backendApiPromise);
  const { availableIModels, reload } = useAvailableModels(backendApi);
  const { openContainingFolder, snapshotFolderIsOpening } = useOpenContainingFolder(backendApi);
  const navigate = useNavigate();

  // TODO: Fix potential performance issue when hundreds of snapshot imodels are available
  const gridItems = availableIModels?.map(
    (name) => {
      function handleOpen() {
        navigate(`/open-imodel?snapshot=${name}`);
      }

      return (
        <Tile
          key={name}
          name={name}
          thumbnail={
            // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions
            <div onClick={handleOpen}>
              <SvgImodel />
            </div>
          }
          description="Local snapshot"
          moreOptions={[
            <MenuItem
              key="open-folder"
              badge={snapshotFolderIsOpening ? <ProgressRadial indeterminate={true} /> : undefined}
              disabled={snapshotFolderIsOpening}
              onClick={openContainingFolder}
            >
              Open containing folder
            </MenuItem>,
          ]}
        />
      );
    },
  );

  return <OfflineIModelSelectorSection
    title={
      <>
        <Text variant="title">Local iModels</Text>
        {backendApi !== undefined && <AsyncActionButton onClick={reload}>Reload</AsyncActionButton>}
      </>
    }
    gridItems={gridItems}
    backendApi={backendApi}
  />;
});

OfflineSelector.displayName = "OfflineSelector";

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

interface AvailableIModels {
  availableIModels: string[] | undefined;
  reload: () => Promise<void>;
}

function useAvailableModels(backendApi: BackendApi | undefined): AvailableIModels {
  const backendApiRef = React.useRef(backendApi);
  backendApiRef.current = backendApi;

  const [availableIModels, setAvailableIModels] = React.useState<string[]>();
  React.useEffect(
    () => {
      void (async () => {
        const imodels = await backendApi?.getAvailableIModels();
        if (backendApiRef.current === backendApi) {
          setAvailableIModels(imodels);
        }
      })();
    },
    [backendApi],
  );

  // On unmount, signal that we have lost backendApi so that we ignore request results
  React.useEffect(
    () => {
      return () => { backendApiRef.current = undefined; };
    },
    [],
  );

  const reload = async () => {
    const imodels = await backendApi?.getAvailableIModels();
    if (backendApiRef.current === backendApi) {
      setAvailableIModels(imodels);
    }
  };

  return { availableIModels, reload };
}

function useOpenContainingFolder(backendApi: BackendApi | undefined): {
  openContainingFolder: () => Promise<void>;
  snapshotFolderIsOpening: boolean;
} {
  const [snapshotFolderIsOpening, setSnapshotFolderIsOpening] = React.useState(false);

  async function openContainingFolder() {
    try {
      setSnapshotFolderIsOpening(true);
      await backendApi?.openIModelsDirectory();
    } finally {
      setSnapshotFolderIsOpening(false);
    }
  }

  return { openContainingFolder, snapshotFolderIsOpening };
}

interface OfflineIModelSelectorSectionProps {
  title: React.ReactElement;
  gridItems: React.ReactElement[] | undefined;
  backendApi: BackendApi | undefined;
}

function OfflineIModelSelectorSection(props: OfflineIModelSelectorSectionProps): React.ReactElement {
  if (props.gridItems === undefined) {
    return (
      <IModelSelectorSection title={props.title}>
        <div className="iac-grid-structure">
          <TileSkeleton />
          <TileSkeleton />
          <TileSkeleton />
        </div>
      </IModelSelectorSection>
    );
  }

  if (props.gridItems.length === 0) {
    async function openSnapshotsFolder() {
      await props.backendApi?.openIModelsDirectory();
    }

    return (
      <IModelSelectorSection title={props.title}>
        <VerticalStack className="imodel-selector-empty-grid">
          <h3 className="iui-text-leading iui-text-muted iac-no-results">
            <SvgImodelHollow />
            <span>No local iModel snapshots found</span>
          </h3>
          <AsyncActionButton onClick={openSnapshotsFolder}>Open snapshots folder</AsyncActionButton>
        </VerticalStack>
      </IModelSelectorSection>
    );
  }

  return (
    <IModelSelectorSection title={props.title}>
      <div className="iac-grid-structure">
        {props.gridItems}
      </div>
    </IModelSelectorSection>
  );
}

const OnlineSelector = React.memo(() => {
  const authContext = useAuthorization();
  const navigate = useNavigate();
  const [selectedProject, setSelectedProject] = React.useState<ProjectFull>();

  if (authContext.state === AuthorizationState.Offline) {
    return (
      <IModelSelectorSection title={<Text variant="title">Projects</Text>}>
        <VerticalStack className="imodel-selector-empty-grid">
          <h3 className="iui-text-leading iui-text-muted iac-no-results">
            <SvgImodelHollow />
            <HorizontalStack>
              Projects are not available in offline mode <OfflineModeExplainer />
            </HorizontalStack>
          </h3>
        </VerticalStack>
      </IModelSelectorSection>
    );
  }

  if (authContext.state === AuthorizationState.Pending) {
    return (
      <IModelSelectorSection title={<Text variant="title">Projects</Text>}>
        <VerticalStack className="imodel-selector-empty-grid">
          <CheckingSignInStatusHint />
        </VerticalStack>
      </IModelSelectorSection>
    );
  }

  if (authContext.state !== AuthorizationState.SignedIn) {
    return (
      <IModelSelectorSection title={<Text variant="title">Projects</Text>}>
        <VerticalStack className="imodel-selector-empty-grid">
          <h3 className="iui-text-leading iui-text-muted iac-no-results">
            <SvgImodelHollow />
            <span>Sign in to access online iModels</span>
          </h3>
          <AsyncActionButton onClick={async () => authContext.signIn()}>Sign In</AsyncActionButton>
        </VerticalStack>
      </IModelSelectorSection>
    );
  }

  if (selectedProject === undefined) {
    return (
      <IModelSelectorSection title={<Text variant="title">Projects</Text>}>
        <ProjectGrid
          accessToken={`${authContext.user.token_type} ${authContext.user.access_token}`}
          requestType="recents"
          apiOverrides={{ serverEnvironmentPrefix }}
          onThumbnailClick={setSelectedProject}
        />
      </IModelSelectorSection>
    );
  }

  return (
    <IModelSelectorSection title={
      <>
        <Text variant="title">Projects</Text>
        <SvgChevronRight width="16" height="16" />
        <Text variant="title">{selectedProject.displayName}</Text>
        <Button onClick={() => setSelectedProject(undefined)}>Back</Button>
      </>
    }>
      <IModelGrid
        accessToken={`${authContext.user.token_type} ${authContext.user.access_token}`}
        projectId={selectedProject.id}
        apiOverrides={{ serverEnvironmentPrefix }}
        onThumbnailClick={({ id, projectId }) => {
          navigate(`/open-imodel?iTwinId=${projectId}&iModelId=${id}`);
        }}
      />
    </IModelSelectorSection>
  );
});

OnlineSelector.displayName = "OnlineSelector";

interface IModelSelectorSectionProps {
  title: React.ReactElement;
  children: React.ReactElement;
}

function IModelSelectorSection(props: IModelSelectorSectionProps): React.ReactElement {
  return (
    <div className="imodel-selector">
      <div className="imodel-selector-title">
        {props.title}
      </div>
      {props.children}
    </div>
  );
}

let serverEnvironmentPrefix: any = process.env.IMJS_URL_PREFIX ?? "";
// Remove trailing minus
serverEnvironmentPrefix = serverEnvironmentPrefix.substr(0, serverEnvironmentPrefix.length - 1);
