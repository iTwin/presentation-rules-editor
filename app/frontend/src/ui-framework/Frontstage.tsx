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
  StagePanelProps as FrameworkStagePanelProps, UiSettingsProvider, Widget as FrameworkWidget, WidgetControl,
} from "@bentley/ui-framework";
import { MemoryUISettingsStorage } from "../app/MemoryUISettingsStorage";
import { StagePanelProps } from "./StagePanel";

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
        await FrontstageManager.setActiveFrontstageDef(frontstage.frontstageDef);
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
    (widget) => {
      if (widget !== undefined) {
        widgetContents.set(widget.props.id, widget.props.children ?? null);
      }
    },
  );

  return widgetContents;
}

/** Defines a Frontstage with content and widget shims. Content for the shims is provided via React Context API. */
class CustomFrontstageProvider extends FrontstageProvider {
  private contentLayoutDef = new ContentLayoutDef({ id: "app_layout" });

  private contentGroup: ContentGroup;
  private rightPanel: React.ReactElement<FrameworkStagePanelProps>;

  constructor(rightPanel: React.ReactElement<StagePanelProps> | undefined) {
    super();

    const widgets = React.Children.map(
      rightPanel?.props.children,
      (widget) => (
        <FrameworkWidget
          key={widget?.props.id}
          control={WidgetControlShim}
          applicationData={{ id: widget?.props.id }}
        />
      ),
    );
    this.rightPanel = <FrameworkStagePanel size={rightPanel?.props.size} widgets={widgets} />;

    this.contentGroup = new ContentGroup({
      contents: [{ classId: ContentControlShim }],
    });
  }

  public get frontstage(): React.ReactElement<FrameworkFrontstageProps> {
    return (
      <FrameworkFrontstage
        id="CustomFrontstage"
        contentGroup={this.contentGroup}
        defaultLayout={this.contentLayoutDef}
        defaultTool={CoreTools.selectElementCommand}
        rightPanel={this.rightPanel}
      />
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
