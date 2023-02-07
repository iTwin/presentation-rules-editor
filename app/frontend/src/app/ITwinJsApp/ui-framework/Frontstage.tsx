/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
/* eslint-disable sort-imports */
import React, { ReactElement } from "react";
import {
  CommonWidgetProps, ConfigurableCreateInfo, ConfigurableUiContent, ContentControl as FrameworkContentControl, ContentGroup, ContentLayoutDef,
  FrontstageConfig as FrameworkFrontstageConfig, FrontstageManager, FrontstageProvider, StagePanelLocation, StagePanelSection, UiItemsManager,
  UiItemsProvider,
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
  private rightPanelProps?: StagePanelProps;

  constructor(rightPanel: React.ReactElement<StagePanelProps> | undefined) {
    super();

    this.rightPanelProps = rightPanel?.props;

    this.contentGroup = new ContentGroup({
      id: "root_content_group",
      layout: new ContentLayoutDef({ id: "root_content_group_layout" }),
      contents: [{ id: "root_content_group_content", classId: ContentControlShim }],
    });

    const stagePanels = new Map([[StagePanelLocation.Right, createStagePanel(rightPanel?.props.children)]]);
    UiItemsManager.register(new WidgetsProvider(stagePanels));
  }

  public readonly id = "main_frontstage_provider";

  public override get frontstage(): ReactElement<any> {
    throw new Error("Expecting `frontstageConfig` to be called instead of this.");
  }

  public override frontstageConfig(): FrameworkFrontstageConfig {
    return {
      version: 1,
      id: "CustomFrontstage",
      contentGroup: this.contentGroup,
      rightPanel: {
        size: this.rightPanelProps?.size,
      },
    };
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
  ): readonly CommonWidgetProps[] {
    if (section === undefined) {
      return [];
    }

    return this.stagePanels.get(location)?.get(section) ?? [];
  }
}

type StagePanels = Map<StagePanelLocation, Map<StagePanelSection, CommonWidgetProps[]>>;

function createStagePanel(panelChildren: StagePanelProps["children"]): Map<StagePanelSection, CommonWidgetProps[]> {
  const stagePanelSections = new Map<StagePanelSection, CommonWidgetProps[]>();
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

  function makeZone(stagePanelZone?: React.ReactElement<StagePanelZoneProps>): CommonWidgetProps[] {
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
