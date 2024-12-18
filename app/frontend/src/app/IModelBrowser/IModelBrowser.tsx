/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/

import "./IModelBrowser.scss";
import * as React from "react";
import { Outlet, useMatch, useNavigate } from "react-router-dom";
import { AuthorizationClient } from "@itwin/core-common";
import { SvgHistory, SvgImodel, SvgList, SvgSearch, SvgThumbnails } from "@itwin/itwinui-icons-react";
import { FluidGrid, Grid, PageLayout } from "@itwin/itwinui-layouts-react";
import { ButtonGroup, IconButton, LabeledInput, MenuItem, Surface, Tab, Tabs, Text, Tile } from "@itwin/itwinui-react";
import { AppPage, AppSideNavigation } from "../App.js";
import { appNavigationContext } from "../AppContext.js";
import { useAuthorization } from "../Authorization.js";
import { VerticalStack } from "../common/CenteredStack.js";
import { useLocalStorage } from "../common/LocalStorage.js";
import { getIModel, getIModelThumbnail } from "../ITwinApi.js";
import { BackendApi } from "../ITwinJsApp/api/BackendApi.js";
import { demoIModels, IModelIdentifier, isDemoIModel, isIModelIdentifier, isSnapshotIModel, ITwinIModelIdentifier } from "../ITwinJsApp/IModelIdentifier.js";

export interface IModelBrowserProps {
  backendApiPromise: Promise<BackendApi> | undefined;
}

export const IModelBrowser = React.memo(function IModelBrowser(props: IModelBrowserProps): React.ReactElement {
  const [settings, setSettings] = useIModelBrowserSettings();
  const [intersectionObserver] = React.useState(() => new ViewportIntersectionObserver());
  React.useEffect(() => () => intersectionObserver.dispose(), [intersectionObserver]);
  const match = useMatch("/browse-imodels/:tab");
  const [searchQuery, setSearchQuery] = React.useState("");
  const clearSearchQuery = React.useRef(() => setSearchQuery("")).current;
  return (
    <iModelBrowserContext.Provider
      value={{
        displayMode: settings.displayMode,
        intersectionObserver,
        searchQuery,
        clearSearchQuery,
      }}
    >
      <AppSideNavigation activePage={AppPage.iModelBrowser} />
      <PageLayout.Content padded>
        <Text variant="headline" as="h1">
          Browse iModels
        </Text>
        <Grid>
          <Grid.Item columnSpan={12}>
            <PaddedSurface>
              <Text variant="title" as="h2">
                Recent
              </Text>
              <MinimalTileAreaHeight>
                <RecentIModels backendApiPromise={props.backendApiPromise} recentIModels={settings.recentIModels} />
              </MinimalTileAreaHeight>
            </PaddedSurface>
          </Grid.Item>
          <Grid.Item columnSpan={12}>
            <PaddedSurface>
              <Text variant="title" as="h2">
                All
              </Text>
              <Grid>
                <Grid.Item className="imodel-browser-controls" columnSpan={12}>
                  <LabeledInput
                    className="search-input"
                    placeholder="Search"
                    svgIcon={<SvgSearch />}
                    value={searchQuery}
                    maxLength={255}
                    onChange={(event) => setSearchQuery(event.target.value)}
                  />
                  {match?.params.tab !== "demo" && (
                    <ButtonGroup>
                      <IconButton
                        isActive={settings.displayMode === "grid"}
                        onClick={() => setSettings((prevState) => ({ ...prevState, displayMode: "grid" }))}
                        label="Open grid view"
                      >
                        <SvgThumbnails />
                      </IconButton>
                      <IconButton
                        isActive={settings.displayMode === "list"}
                        onClick={() => setSettings((prevState) => ({ ...prevState, displayMode: "list" }))}
                        label="Open list view"
                      >
                        <SvgList />
                      </IconButton>
                    </ButtonGroup>
                  )}
                </Grid.Item>
                <Grid.Item columnSpan={12}>
                  <Outlet />
                </Grid.Item>
              </Grid>
            </PaddedSurface>
          </Grid.Item>
        </Grid>
      </PageLayout.Content>
    </iModelBrowserContext.Provider>
  );
});

class ViewportIntersectionObserver {
  private observer: IntersectionObserver;
  private observers: Map<Element, (isIntersecting: boolean) => void>;

  constructor() {
    this.observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        this.observers.get(entry.target)?.(entry.isIntersecting);
      }
    });
    this.observers = new Map();
  }

  public dispose(): void {
    this.observer.disconnect();
  }

  public observe(element: Element, onObservation: (isIntersecting: boolean) => void): void {
    this.observers.set(element, onObservation);
    this.observer.observe(element);
  }

  public unobserve(element: Element): void {
    this.observer.unobserve(element);
    this.observers.delete(element);
  }
}

interface PaddedSurfaceProps {
  children: React.ReactNode;
}

function PaddedSurface(props: PaddedSurfaceProps): React.ReactElement {
  return (
    <Surface className="padded-surface" elevation={1}>
      {props.children}
    </Surface>
  );
}

export interface IModelBrowserContext {
  displayMode: "grid" | "list";
  intersectionObserver: ViewportIntersectionObserver | undefined;
  searchQuery: string;
  clearSearchQuery: () => void;
}

export const iModelBrowserContext = React.createContext<IModelBrowserContext>({
  displayMode: "grid",
  intersectionObserver: undefined,
  searchQuery: "",
  clearSearchQuery: () => {},
});

export interface IModelBrowserTabsProps {
  activeTab: IModelBrowserTab;
}

export enum IModelBrowserTab {
  Local = "local",
  iTwins = "iTwins",
  Demo = "demo",
}

export function IModelBrowserTabs(props: IModelBrowserTabsProps): React.ReactElement {
  const navigate = useNavigate();
  const indexToTab = ["local", "iTwins", "demo"];
  const labels = [<Tab key="snapshots" label="Local snapshots" />, <Tab key="itwins" label="My iTwins" />, <Tab key="demo" label="Demo iModels" />];

  if (import.meta.env.DEPLOYMENT_TYPE === "web") {
    indexToTab.shift();
    labels.shift();
  }

  return (
    <Tabs
      orientation="vertical"
      contentClassName="imodel-browser-tab-content"
      type="borderless"
      labels={labels}
      activeIndex={indexToTab.indexOf(props.activeTab)}
      onTabSelected={async (index) => navigate(`../${indexToTab[index]}`, { replace: true })}
    >
      <MinimalTileAreaHeight>
        <Outlet />
      </MinimalTileAreaHeight>
    </Tabs>
  );
}

interface MinimalTileAreaHeightProps {
  children: React.ReactNode;
}

function MinimalTileAreaHeight(props: MinimalTileAreaHeightProps): React.ReactElement {
  return (
    <div className="minimal-tab-height">
      <Tile id="invisible" name="Invisible" description="Reserves vertical space" thumbnail={<></>} />
      {props.children}
    </div>
  );
}

interface RecentIModelsProps {
  backendApiPromise: Promise<BackendApi> | undefined;
  recentIModels: IModelIdentifier[];
}

function RecentIModels(props: RecentIModelsProps): React.ReactElement {
  const backendApi = useBackendApi(props.backendApiPromise);
  const { userAuthorizationClient } = useAuthorization();
  const availableIModels = userAuthorizationClient
    ? props.recentIModels
    : props.recentIModels.filter((identifier) => isDemoIModel(identifier) || isSnapshotIModel(identifier));

  if (availableIModels.length === 0) {
    return (
      <VerticalStack className="imodel-browser-no-data">
        <SvgHistory />
        <Text variant="title" as="h2" isMuted>
          No recent iModels
        </Text>
      </VerticalStack>
    );
  }

  return (
    <FluidGrid>
      {availableIModels
        .slice(-5)
        .reverse()
        .map((iModelIdentifier) =>
          isSnapshotIModel(iModelIdentifier) ? (
            <IModelSnapshotTile key={iModelIdentifier} name={iModelIdentifier} openSnapshotsFolder={async () => backendApi?.openIModelsDirectory()} />
          ) : (
            <RecentIModelTile key={iModelIdentifier.iModelId} iModelIdentifier={iModelIdentifier} />
          ),
        )}
    </FluidGrid>
  );
}

export interface IModelTileProps {
  iModelId: string;
  iTwinId: string;
  name: React.ReactNode;
  description: string | undefined;
  authorizationClient: AuthorizationClient | undefined;
  onVisible?: ((iModelId: string) => void) | undefined;
}

export function IModelTile(props: IModelTileProps): React.ReactElement {
  const navigation = React.useContext(appNavigationContext);
  const [thumbnail, setThumbnail] = React.useState<string>();
  const divRef = React.useRef<HTMLDivElement>(null);
  const { intersectionObserver } = React.useContext(iModelBrowserContext);

  React.useEffect(() => {
    let disposed = false;
    const onVisible = props.onVisible;
    const element = divRef.current;
    const authorizationClient = props.authorizationClient;
    if (!element || !authorizationClient) {
      return;
    }

    const handleObservation = async (isIntersecting: boolean) => {
      if (isIntersecting) {
        onVisible?.(props.iModelId);
        if (thumbnail !== undefined) {
          return;
        }

        const response = await getIModelThumbnail(props.iModelId, { authorizationClient });
        if (!disposed && response) {
          setThumbnail(URL.createObjectURL(response));
        }
      }
    };

    intersectionObserver?.observe(element, handleObservation);
    return () => {
      disposed = true;
      intersectionObserver?.unobserve(element);
      thumbnail && URL.revokeObjectURL(thumbnail);
    };
  }, [intersectionObserver, props.onVisible, props.iModelId, thumbnail, props.authorizationClient]);

  return (
    <Tile
      name={props.name}
      description={props.description ?? <Text isSkeleton />}
      thumbnail={thumbnail ? thumbnail : <div ref={divRef} id="imodel-thumbnail-placeholder" />}
      isActionable
      onClick={async () => navigation.openRulesetEditor({ iTwinId: props.iTwinId, iModelId: props.iModelId })}
    />
  );
}

export interface IModelSnapshotTileProps {
  name: string;
  openSnapshotsFolder: () => void;
}

export function IModelSnapshotTile(props: IModelSnapshotTileProps): React.ReactElement {
  const navigation = React.useContext(appNavigationContext);

  return (
    <Tile
      name={props.name}
      description="Snapshot iModel"
      thumbnail={<SvgImodel />}
      isActionable
      onClick={async () => navigation.openRulesetEditor(props.name)}
      moreOptions={[
        <MenuItem key="open-folder" onClick={props.openSnapshotsFolder}>
          Open containing folder
        </MenuItem>,
      ]}
    />
  );
}

interface RecentIModelTileProps {
  iModelIdentifier: ITwinIModelIdentifier;
}

function RecentIModelTile(props: RecentIModelTileProps): React.ReactElement {
  const { demoAuthorizationClient, userAuthorizationClient } = useAuthorization();
  const [iModel, setIModel] = React.useState<{ name: string; description: string } | "unknown">();
  const authorizationClient = isDemoIModel(props.iModelIdentifier) ? demoAuthorizationClient : userAuthorizationClient;

  React.useEffect(() => {
    if (isDemoIModel(props.iModelIdentifier)) {
      setIModel({ name: demoIModels.get(props.iModelIdentifier.iModelId)?.name ?? "", description: "Demo iModel" });
      return;
    }

    if (!authorizationClient) {
      return;
    }

    let disposed = false;
    void (async () => {
      const response = await getIModel(props.iModelIdentifier.iModelId, { authorizationClient });
      if (!disposed) {
        setIModel(response ? { name: response.displayName, description: response.description ?? "" } : "unknown");
      }
    })();

    return () => {
      disposed = true;
    };
  }, [authorizationClient, props.iModelIdentifier]);

  if (iModel === "unknown") {
    return <Tile name="(unknown iModel)" thumbnail={<></>} />;
  }

  return (
    <IModelTile
      name={iModel?.name ?? <></>}
      description={iModel?.description ?? ""}
      iModelId={props.iModelIdentifier.iModelId}
      iTwinId={props.iModelIdentifier.iTwinId}
      authorizationClient={authorizationClient}
    />
  );
}

export interface IModelBrowserSettings {
  displayMode: "grid" | "list";
  recentIModels: IModelIdentifier[];
}

export function useIModelBrowserSettings(): [IModelBrowserSettings, (action: React.SetStateAction<IModelBrowserSettings>) => void] {
  return useLocalStorage("imodel-browser", (initialValue: any) => {
    if (typeof initialValue !== "object") {
      return {
        displayMode: "grid",
        recentIModels: [],
      };
    }

    const displayMode = initialValue.displayMode !== "list" ? "grid" : "list";
    const recentIModels = Array.isArray(initialValue.recentIModels) ? initialValue.recentIModels.filter(isIModelIdentifier) : [];
    return { displayMode, recentIModels };
  });
}

export function useBackendApi(backendApiPromise: Promise<BackendApi> | undefined): BackendApi | undefined {
  const [backendApi, setBackendApi] = React.useState<BackendApi>();
  React.useEffect(() => {
    let disposed = false;
    void (async () => {
      const backendApiResult = await backendApiPromise;
      if (!disposed) {
        setBackendApi(backendApiResult);
      }
    })();

    return () => {
      disposed = true;
    };
  }, [backendApiPromise]);

  return backendApi;
}
