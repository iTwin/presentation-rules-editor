/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
/* eslint-disable sort-imports */
import React, { ReactElement } from "react";
import {
  ConfigurableCreateInfo, ConfigurableUiContent, ContentControl as FrameworkContentControl, ContentGroup, ContentLayoutDef,
  FrontstageConfig as FrameworkFrontstageConfig, FrontstageProvider, StagePanelConfig, StagePanelLocation, StagePanelSection, UiFramework,
  UiItemsManager, UiItemsProvider, Widget,
} from "@itwin/appui-react";
import { StagePanelProps, StagePanelZoneProps } from "./StagePanel";

export interface FrontstageProps {
  /** Widgets on the right-hand side */
  rightPanel?: React.ReactElement<StagePanelProps>;
  /** Widgets at the bottom */
  bottomPanel?: React.ReactElement<StagePanelProps>;
  /** Frontstage main contents */
  children: React.ReactElement;
}

/** Displays ui-framework Frontstage */
export const Frontstage: React.FC<FrontstageProps> = (props) => {
  React.useEffect(
    () => {
      void (async () => {
        const frontstage = new CustomFrontstageProvider({
          rightPanel: props.rightPanel,
          bottomPanel: props.bottomPanel,
        });
        UiFramework.frontstages.addFrontstageProvider(frontstage);
        const frontstageDef = await UiFramework.frontstages.getFrontstageDef(frontstage.id);
        await UiFramework.frontstages.setActiveFrontstageDef(frontstageDef);
      })();
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  return (
    <contentControlContext.Provider value={props.children}>
      <widgetContext.Provider value={{ widgetContents: gatherWidgetContents(props) }}>
        <ConfigurableUiContent />
      </widgetContext.Provider>
    </contentControlContext.Provider>
  );
};

/** Collects all widget contents from React component tree */
function gatherWidgetContents(props: FrontstageProps): Map<string, ReactElement | null> {
  const widgetContents = new Map<string, React.ReactElement | null>();

  // Collect all widgets from frontstage panels
  function collectWidgetContentsFromStagePanels(panel: React.ReactElement<StagePanelProps>) {
    React.Children.forEach(panel.props.children, (stagePanelZone) => {
      React.Children.forEach(stagePanelZone?.props.children, (widget) => {
        if (widget !== undefined)
          widgetContents.set(widget.props.id, widget.props.children ?? null);
      });
    });
  }
  if (props.rightPanel)
    collectWidgetContentsFromStagePanels(props.rightPanel);
  if (props.bottomPanel)
    collectWidgetContentsFromStagePanels(props.bottomPanel);
  return widgetContents;
}

/** Defines a Frontstage with content and widget shims. Content for the shims is provided via React Context API. */
interface CustomFrontstageProviderProps {
  rightPanel?: React.ReactElement<StagePanelProps>;
  bottomPanel?: React.ReactElement<StagePanelProps>;
}
class CustomFrontstageProvider extends FrontstageProvider {
  private contentGroup: ContentGroup;
  private rightPanelProps?: StagePanelProps;
  private bottomPanelProps?: StagePanelProps;

  constructor(props?: CustomFrontstageProviderProps) {
    super();

    this.rightPanelProps = props?.rightPanel?.props;
    this.bottomPanelProps = props?.bottomPanel?.props;

    this.contentGroup = new ContentGroup({
      id: "root_content_group",
      layout: new ContentLayoutDef({ id: "root_content_group_layout" }),
      contents: [{ id: "root_content_group_content", classId: ContentControlShim }],
    });

    const stagePanels = new Map([
      [StagePanelLocation.Right, createStagePanel(props?.rightPanel?.props.children)],
      [StagePanelLocation.Bottom, createStagePanel(props?.bottomPanel?.props.children)],
    ]);
    UiItemsManager.register(new WidgetsProvider(stagePanels));
  }

  public readonly id = "main_frontstage_provider";

  public override frontstageConfig(): FrameworkFrontstageConfig {
    return {
      version: 1,
      id: "CustomFrontstage",
      contentGroup: this.contentGroup,
      rightPanel: getStagePanelConfig(this.rightPanelProps),
      bottomPanel: getStagePanelConfig(this.bottomPanelProps),
    };
  }
}

function getStagePanelConfig(props: StagePanelProps | undefined): StagePanelConfig | undefined {
  if (!props)
    return undefined;

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { children, ...config } = props;
  return config;
}

class WidgetsProvider implements UiItemsProvider {
  constructor(private stagePanels: StagePanels) { }

  public id = WidgetsProvider.name;

  public provideWidgets(
    _stageId: string,
    _stageUsage: string,
    location: StagePanelLocation,
    section?: StagePanelSection,
  ): readonly Widget[] {
    if (section === undefined) {
      return [];
    }

    return this.stagePanels.get(location)?.get(section) ?? [];
  }
}

type StagePanels = Map<StagePanelLocation, Map<StagePanelSection, Widget[]>>;

function createStagePanel(panelChildren: StagePanelProps["children"]): Map<StagePanelSection, Widget[]> {
  const stagePanelSections = new Map<StagePanelSection, Widget[]>();
  if (panelChildren === undefined) {
    return stagePanelSections;
  }

  const children = React.Children.toArray(panelChildren) as Array<React.ReactElement<StagePanelZoneProps>>;
  if (children.length === 1) {
    stagePanelSections.set(StagePanelSection.Start, makeZone(children[0]));
  } else if (children.length === 2) {
    stagePanelSections.set(StagePanelSection.Start, makeZone(children[0]));
    stagePanelSections.set(StagePanelSection.End, makeZone(children[1]));
  }

  return stagePanelSections;

  function makeZone(stagePanelZone?: React.ReactElement<StagePanelZoneProps>): Widget[] {
    return React.Children.map(
      stagePanelZone?.props.children ?? [],
      (widget) => ({
        ...widget.props,
        content: <WidgetFromContext id={widget.props.id} />,
      }),
    );
  }
}

/** Renders ContentControl content from the context */
class ContentControlShim extends FrameworkContentControl {
  constructor(info: ConfigurableCreateInfo, options: unknown) {
    super(info, options);

    this._reactNode = <ContentFromContext />;
  }
}

const ContentFromContext: React.FC = () => {
  const element = React.useContext(contentControlContext);
  return <>{element}</>;
};

const contentControlContext = React.createContext<React.ReactElement | null>(null);

const WidgetFromContext: React.FC<{ id: string }> = (props) => {
  const { widgetContents } = React.useContext(widgetContext);
  return <>{widgetContents.get(props.id)}</>;
};

interface WidgetContext {
  widgetContents: Map<string, React.ReactElement | null>;
}

const widgetContext = React.createContext<WidgetContext>({ widgetContents: new Map() });
