/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/

import {
  ConfigurableUiContent,
  ContentGroup,
  ContentLayoutDef,
  Frontstage as FrontstageFromAppUI,
  StagePanelConfig,
  StagePanelLocation,
  StagePanelSection,
  UiFramework,
  UiItemsManager,
  UiItemsProvider,
  Widget,
} from "@itwin/appui-react";
import React, { ReactElement } from "react";
import { StagePanelProps, StagePanelZoneProps } from "./StagePanel.js";

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
        const frontstage: FrontstageFromAppUI = {
          rightPanel: getStagePanelConfig(props.rightPanel?.props),
          bottomPanel: getStagePanelConfig(props.bottomPanel?.props),
          version: 1,
          id: "CustomFrontstage",
          contentGroup: new ContentGroup({
            id: "root_content_group",
            layout: new ContentLayoutDef({ id: "root_content_group_layout" }),
            // Remove classId after migrating to appuiV5
            contents: [{ id: "root_content_group_content", classId: "", content: <ContentFromContext /> }],
          }),
        };
        const stagePanels = new Map([
          [StagePanelLocation.Right, createStagePanel(props?.rightPanel?.props.children)],
          [StagePanelLocation.Bottom, createStagePanel(props?.bottomPanel?.props.children)],
        ]);
        UiItemsManager.register(new WidgetsProvider(stagePanels));
        UiFramework.frontstages.addFrontstage(frontstage);
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
        if (widget !== undefined) {
          widgetContents.set(widget.props.id, widget.props.children ?? null);
        }
      });
    });
  }
  if (props.rightPanel) {
    collectWidgetContentsFromStagePanels(props.rightPanel);
  }
  if (props.bottomPanel) {
    collectWidgetContentsFromStagePanels(props.bottomPanel);
  }
  return widgetContents;
}

function getStagePanelConfig(props: StagePanelProps | undefined): StagePanelConfig | undefined {
  if (!props) {
    return undefined;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { children, ...config } = props;
  return config;
}

class WidgetsProvider implements UiItemsProvider {
  constructor(private stagePanels: StagePanels) {}

  public id = WidgetsProvider.name;

  public provideWidgets(_stageId: string, _stageUsage: string, location: StagePanelLocation, section?: StagePanelSection): readonly Widget[] {
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
    return React.Children.map(stagePanelZone?.props.children ?? [], (widget) => ({
      ...widget.props,
      content: <WidgetFromContext id={widget.props.id} />,
    }));
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
