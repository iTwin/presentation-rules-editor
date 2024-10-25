/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/

import "./TabView.scss";
import * as React from "react";
import { Tabs } from "@itwin/itwinui-react";

export interface TabViewProps {
  /** Index of currently active tab. */
  activeTab: number;
  /** Invoked when user clicks on a tab label. */
  setActiveTab: (activeTab: number) => void;
  /** One or more TabViewItem(s). */
  children: React.ReactElement<TabViewItemProps> | React.ReactElement<TabViewItemProps>[];
}

/** Displays a set of horizontal tabs and active tab's contents. */
export const TabView: React.FC<TabViewProps> = (props: TabViewProps) => {
  const tabLabels = React.Children.map(props.children, (item) => item.props.label);
  return (
    <div className="tab-view">
      <Tabs orientation="horizontal" type={"borderless"} labels={tabLabels} activeIndex={props.activeTab} onTabSelected={props.setActiveTab} />
      {React.Children.toArray(props.children)[props.activeTab]}
    </div>
  );
};

export interface TabViewItemProps {
  /** Displayed tab label. */
  label: string;

  /** Tab contents. */
  children?: React.ReactElement | null;
}

/** Adds a tab to a TabView. */
export const TabViewItem: React.FC<TabViewItemProps> = (props) => {
  return <>{props.children}</>;
};
