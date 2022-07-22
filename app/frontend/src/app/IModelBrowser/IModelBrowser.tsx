/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import "./IModelBrowser.scss";
import * as React from "react";
import { Outlet, useMatch, useNavigate } from "react-router-dom";
import { AuthorizationClient } from "@itwin/core-common";
import { SvgList, SvgSearch, SvgThumbnails } from "@itwin/itwinui-icons-react";
import { FluidGrid, Grid, PageLayout } from "@itwin/itwinui-layouts-react";
import {
  ButtonGroup, Headline, IconButton, LabeledInput, Surface, Tab, Text, Tile, Title, VerticalTabs,
} from "@itwin/itwinui-react";
import { AppPage, AppSideNavigation } from "../App";
import { appNavigationContext } from "../AppContext";
import { getIModelThumbnail } from "../ITwinApi";

export const IModelBrowser = React.memo(
  function IModelBrowser(): React.ReactElement {
    const [settings, setSettings] = useLocalStorage(
      "imodel-browser",
      (initialValue) => ({
        displayMode: (typeof initialValue !== "object" || (initialValue as any).displayMode !== "list")
          ? "grid"
          : "list",
      }) as const,
    );

    const [intersectionObserver] = React.useState(() => new ViewportIntersectionObserver());
    React.useEffect(() => () => intersectionObserver.dispose(), [intersectionObserver]);
    const match = useMatch("/browse-imodels/:tab");
    return (
      <>
        <AppSideNavigation activePage={AppPage.iModelBrowser} />
        <PageLayout.Content padded>
          <Headline>Browse iModels</Headline>
          <Grid>
            <Grid.Item columnSpan={12}>
              <PaddedSurface>
                <Title>Recent</Title>
                <FluidGrid>
                  <Tile name="Test1.bim" description="Snapshop iModel" thumbnail={<></>} isActionable />
                  <Tile name="Test2" description="Demo iModel" thumbnail={<></>} isActionable />
                  <Tile name="Test3" description="My Project1" thumbnail={<></>} isActionable />
                  <Tile name="Test4" description="My Project2" thumbnail={<></>} isActionable />
                </FluidGrid>
              </PaddedSurface>
            </Grid.Item>
            <Grid.Item columnSpan={12}>
              <PaddedSurface>
                <Title>All</Title>
                <Grid>
                  <Grid.Item className="imodel-browser-controls" columnSpan={12}>
                    <LabeledInput placeholder="Search" svgIcon={<SvgSearch />} iconDisplayStyle="inline" />
                    {
                      match?.params.tab !== "demo" &&
                      <ButtonGroup>
                        <IconButton
                          isActive={settings.displayMode === "grid"}
                          onClick={() => setSettings({ displayMode: "grid" })}
                        >
                          <SvgThumbnails />
                        </IconButton>
                        <IconButton
                          isActive={settings.displayMode === "list"}
                          onClick={() => setSettings({ displayMode: "list" })}
                        >
                          <SvgList />
                        </IconButton>
                      </ButtonGroup>
                    }
                  </Grid.Item>
                  <Grid.Item columnSpan={12}>
                    <iModelBrowserContext.Provider value={{ displayMode: settings.displayMode, intersectionObserver }}>
                      <Outlet />
                    </iModelBrowserContext.Provider>
                  </Grid.Item>
                </Grid>
              </PaddedSurface>
            </Grid.Item>
          </Grid>
        </PageLayout.Content>
      </>
    );
  },
);

/** Retrieves the value in local storage under the specified key. The key value change is not tracked by this hook. */
function useLocalStorage<T>(key: string, init: (initialValue: {} | string | undefined) => T): [T, (value: T) => void] {
  const [state, setState] = React.useState<T>(() => {
    const initialValue = init(getLocalStorageValue(key));
    localStorage.setItem(normalizeKey(key), JSON.stringify(initialValue));
    return initialValue;
  });
  const setValue = React.useCallback(
    (value: T) => {
      const stringifiedValue = JSON.stringify(value);
      localStorage.setItem(normalizeKey(key), stringifiedValue);
      // Unstringified value may differ from original
      setState(JSON.parse(stringifiedValue));
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );
  return [state, setValue];
}

function getLocalStorageValue(key: string): {} | string | undefined {
  const value = localStorage.getItem(normalizeKey(key));
  try {
    // JSON.parse returns null when the input is null
    return JSON.parse(value!) ?? undefined;
  } catch {
    return undefined;
  }
}

function normalizeKey(key: string): string {
  return `presentation-rules-editor/${key}`;
}

export class ViewportIntersectionObserver {
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
  return <Surface className="padded-surface" elevation={1}>{props.children}</Surface>;
}

export interface IModelBrowserContext {
  displayMode: "grid" | "list";
  intersectionObserver: ViewportIntersectionObserver | undefined;
}

export const iModelBrowserContext = React.createContext<IModelBrowserContext>({
  displayMode: "grid",
  intersectionObserver: undefined,
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
  const labels = [
    <Tab key="snapshots" label="Local snapshots" />,
    <Tab key="itwins" label="My iTwins" />,
    <Tab key="demo" label="Demo iModels" />,
  ];

  if (process.env.DEPLOYMENT_TYPE === "web") {
    indexToTab.shift();
    labels.shift();
  }

  return (
    <VerticalTabs
      contentClassName="imodel-browser-tab-content"
      type="borderless"
      labels={labels}
      activeIndex={indexToTab.indexOf(props.activeTab)}
      onTabSelected={(index) => navigate(`../${indexToTab[index]}`, { replace: true })}
    >
      <MinimalTabHeight>
        <Outlet />
      </MinimalTabHeight>
    </VerticalTabs>
  );
}

export interface IModelTileProps {
  iModelId: string;
  iTwinId: string;
  name: string;
  description: string | undefined;
  authorizationClient: AuthorizationClient;
  onVisible?: (() => void) | undefined;
}

export function IModelTile(props: IModelTileProps): React.ReactElement {
  const navigation = React.useContext(appNavigationContext);
  const [thumbnail, setThumbnail] = React.useState<string>();
  const divRef = React.useRef<HTMLDivElement>(null);
  const { intersectionObserver } = React.useContext(iModelBrowserContext);

  React.useEffect(
    () => {
      let disposed = false;
      const onVisible = props.onVisible;
      const element = divRef.current;
      if (!element) {
        return;
      }

      const handleObservation = async (isIntersecting: boolean) => {
        if (isIntersecting) {
          onVisible?.();
          if (thumbnail !== undefined) {
            return;
          }

          const response = await getIModelThumbnail(props.iModelId, props.authorizationClient);
          if (disposed || !response) {
            return;
          }

          if (!disposed) {
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
    },
    [intersectionObserver, props.onVisible, props.iModelId, thumbnail, props.authorizationClient],
  );

  return (
    <Tile
      name={props.name}
      description={props.description ?? <Text isSkeleton />}
      thumbnail={
        thumbnail
          ? <img style={{ objectFit: "cover" }} src={thumbnail} alt="" />
          : <div ref={divRef} id="imodel-thumbnail-placeholder" />
      }
      isActionable
      onClick={() => navigation.openRulesetEditor({ iTwinId: props.iTwinId, iModelId: props.iModelId })}
    />
  );
}

interface MinimalTabHeightProps {
  children: React.ReactNode;
}

function MinimalTabHeight(props: MinimalTabHeightProps): React.ReactElement {
  return (
    <div className="minimal-tab-height">
      <Tile id="invisible" name="Invisible" description="Reserves vertical space" thumbnail={<></>} />
      {props.children}
    </div>
  );
}
