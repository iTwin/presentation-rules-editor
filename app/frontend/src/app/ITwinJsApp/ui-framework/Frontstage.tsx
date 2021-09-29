/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
/* eslint-disable sort-imports */
import React, { ReactElement } from "react";
import {
  ConfigurableCreateInfo, ConfigurableUiContent, ContentControl as FrameworkContentControl, ContentGroup,
  ContentLayoutDef, CoreTools, Frontstage as FrameworkFrontstage, FrontstageManager,
  FrontstageProps as FrameworkFrontstageProps, FrontstageProvider, StagePanel as FrameworkStagePanel,
  StagePanelProps as FrameworkStagePanelProps, StagePanelZoneProps as FrameworkStagePanelZoneProps,
  StagePanelZonesProps as FrameworkStagePanelZonesProps, UiSettingsProvider, Widget as FrameworkWidget, WidgetControl,
} from "@bentley/ui-framework";
import { MemoryUISettingsStorage } from "./MemoryUISettingsStorage";
import { StagePanelProps, StagePanelZoneProps } from "./StagePanel";

export interface FrontstageProps {
  /** Widgets on the right-hand side */
  rightPanel?: React.ReactElement<StagePanelProps>;
  /** Frontstage main contents */
  children: React.ReactElement;
}

/** Displays ui-framework Frontstage */
export const Frontstage: React.FC<FrontstageProps> = (props) => {
  const [frontstage] = React.useState(() => new CustomFrontstageProvider(props.rightPanel));
  const [settingsStorage] = React.useState(new MemoryUISettingsStorage());

  React.useEffect(
    () => {
      void (async () => {
        FrontstageManager.addFrontstageProvider(frontstage);
        const frontstageDef = await FrontstageManager.getFrontstageDef(frontstage.id);
        await FrontstageManager.setActiveFrontstageDef(frontstageDef);
      })();
    },
    [frontstage],
  );

  return (
    <UiSettingsProvider settingsStorage={settingsStorage}>
      <contentControlContext.Provider value={props.children}>
        <widgetContext.Provider value={{ widgetContents: gatherWidgetContents(props) }}>
          <ConfigurableUiContent />
        </widgetContext.Provider>
      </contentControlContext.Provider>
    </UiSettingsProvider>
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

    this.rightPanel = (
      <FrameworkStagePanel
        size={rightPanel?.props.size}
        panelZones={getStagePanelZones(rightPanel?.props.children)}
      />
    );

    this.contentGroup = new ContentGroup({
      id: "root_content_group",
      layout: new ContentLayoutDef({ id: "root_content_group_layout" }),
      contents: [{ id: "root_content_group_content", classId: ContentControlShim }],
    });
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

function getStagePanelZones(panelChildren: StagePanelProps["children"]): FrameworkStagePanelZonesProps {
  if (panelChildren === undefined) {
    return {};
  }

  const children = React.Children.toArray(panelChildren) as Array<React.ReactElement<StagePanelZoneProps>>;
  if (children.length === 1) {
    return { middle: makeZone(children[0]) };
  } else if (children.length === 2) {
    return { start: makeZone(children[0]), end: makeZone(children[1]) };
  } else if (children.length === 3) {
    return { start: makeZone(children[0]), middle: makeZone(children[1]), end: makeZone(children[2]) };
  }

  return {};

  function makeZone(stagePanelZone?: React.ReactElement<StagePanelZoneProps>): FrameworkStagePanelZoneProps {
    return {
      widgets: React.Children.map(
        stagePanelZone?.props.children,
        (widget) => (
          <FrameworkWidget
            {...widget?.props}
            applicationData={{ id: widget?.props.id }}
            control={WidgetControlShim}
          />
        ),
      ) ?? [],
    };
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

/** Renders WidgetControl content from the context by the given id */
class WidgetControlShim extends WidgetControl {
  constructor(info: ConfigurableCreateInfo, options: { id: string }) {
    super(info, options);

    this.reactNode = <WidgetFromContext id={options.id} />;
  }
}

const WidgetFromContext: React.FC<{ id: string }> = (props) => {
  const { widgetContents } = React.useContext(widgetContext);
  return <>{widgetContents.get(props.id)}</>;
};

interface WidgetContext {
  widgetContents: Map<string, React.ReactElement | null>;
}

const widgetContext = React.createContext<WidgetContext>({ widgetContents: new Map() });
