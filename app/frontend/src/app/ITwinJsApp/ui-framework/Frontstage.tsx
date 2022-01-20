/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
/* eslint-disable sort-imports */
import React, { ReactElement } from "react";
import {
  AbstractWidgetProps, StagePanelLocation, StagePanelSection, UiItemsManager, UiItemsProvider,
} from "@itwin/appui-abstract";
import {
  ConfigurableCreateInfo, ConfigurableUiContent, ContentControl as FrameworkContentControl, ContentGroup,
  ContentLayoutDef, CoreTools, Frontstage as FrameworkFrontstage, FrontstageManager,
  FrontstageProps as FrameworkFrontstageProps, FrontstageProvider, StagePanel as FrameworkStagePanel,
  StagePanelProps as FrameworkStagePanelProps,
} from "@itwin/appui-react";
import { StagePanelProps, StagePanelZoneProps } from "./StagePanel";

export interface FrontstageProps {
  /** Widgets on the right-hand side */
  rightPanel?: React.ReactElement<StagePanelProps>;
  /** Frontstage main contents */
  children: React.ReactElement;
}

/** Displays ui-framework Frontstage */
export const Frontstage: React.FC<FrontstageProps> = (props) => {
  React.useEffect(
    () => {
      void (async () => {
        const frontstage = new CustomFrontstageProvider(props.rightPanel);
        FrontstageManager.addFrontstageProvider(frontstage);
        const frontstageDef = await FrontstageManager.getFrontstageDef(frontstage.id);
        await FrontstageManager.setActiveFrontstageDef(frontstageDef);
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
  React.Children.forEach(
    props.rightPanel?.props.children,
    (stagePanelZone) => {
      React.Children.forEach(
        stagePanelZone?.props.children,
        (widget) => {
          if (widget !== undefined) {
            widgetContents.set(widget.props.id, widget.props.children ?? null);
          }
        },
      );
    },
  );

  return widgetContents;
}

/** Defines a Frontstage with content and widget shims. Content for the shims is provided via React Context API. */
class CustomFrontstageProvider extends FrontstageProvider {
  private contentGroup: ContentGroup;
  private rightPanel: React.ReactElement<FrameworkStagePanelProps>;

  constructor(rightPanel: React.ReactElement<StagePanelProps> | undefined) {
    super();

    this.rightPanel = <FrameworkStagePanel size={rightPanel?.props.size} />;

    this.contentGroup = new ContentGroup({
      id: "root_content_group",
      layout: new ContentLayoutDef({ id: "root_content_group_layout" }),
      contents: [{ id: "root_content_group_content", classId: ContentControlShim }],
    });

    const stagePanels = new Map([[StagePanelLocation.Right, createStagePanel(rightPanel?.props.children)]]);
    UiItemsManager.register(new WidgetsProvider(stagePanels));
  }

  public readonly id = "main_frontstage_provider";

  public get frontstage(): React.ReactElement<FrameworkFrontstageProps> {
    return (
      <FrameworkFrontstage
        id="CustomFrontstage"
        contentGroup={this.contentGroup}
        defaultTool={CoreTools.selectElementCommand}
        rightPanel={this.rightPanel}
      />
    );
  }
}

class WidgetsProvider implements UiItemsProvider {
  constructor(private stagePanels: StagePanels) { }

  public id = WidgetsProvider.name;

  public provideWidgets(
    _stageId: string,
    _stageUsage: string,
    location: StagePanelLocation,
    section?: StagePanelSection,
  ): readonly AbstractWidgetProps[] {
    if (section === undefined) {
      return [];
    }

    return this.stagePanels.get(location)?.get(section) ?? [];
  }
}

type StagePanels = Map<StagePanelLocation, Map<StagePanelSection, AbstractWidgetProps[]>>;

function createStagePanel(panelChildren: StagePanelProps["children"]): Map<StagePanelSection, AbstractWidgetProps[]> {
  const stagePanelSections = new Map<StagePanelSection, AbstractWidgetProps[]>();
  if (panelChildren === undefined) {
    return stagePanelSections;
  }

  const children = React.Children.toArray(panelChildren) as Array<React.ReactElement<StagePanelZoneProps>>;
  if (children.length === 1) {
    stagePanelSections.set(StagePanelSection.Middle, makeZone(children[0]));
  } else if (children.length === 2) {
    stagePanelSections.set(StagePanelSection.Start, makeZone(children[0]));
    stagePanelSections.set(StagePanelSection.End, makeZone(children[1]));
  } else if (children.length === 3) {
    stagePanelSections.set(StagePanelSection.Start, makeZone(children[0]));
    stagePanelSections.set(StagePanelSection.Middle, makeZone(children[1]));
    stagePanelSections.set(StagePanelSection.End, makeZone(children[2]));
  }

  return stagePanelSections;

  function makeZone(stagePanelZone?: React.ReactElement<StagePanelZoneProps>): AbstractWidgetProps[] {
    return React.Children.map(
      stagePanelZone?.props.children ?? [],
      (widget) => ({
        ...widget.props,
        // eslint-disable-next-line react/display-name
        getWidgetContent: () => <WidgetFromContext id={widget.props.id} />,
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
