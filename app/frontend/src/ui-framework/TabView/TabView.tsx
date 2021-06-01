/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import "./TabView.scss";
import * as React from "react";
import { HorizontalTabs } from "@bentley/ui-core";

export interface TabViewProps {
  /** One or more TabViewItem(s) */
  children: React.ReactElement<TabViewItemProps> | React.ReactElement<TabViewItemProps>[];
}

/** Displays a set of horizontal tabs and active tab's contents. */
export const TabView: React.FC<TabViewProps> = (props: TabViewProps) => {
  const tabLabels = React.Children.map(props.children, (item) => item.props.label);
  const [activeTab, setActiveTab] = React.useState(0);
  return (
    <div className="tab-view">
      <HorizontalTabs labels={tabLabels} onActivateTab={(index) => setActiveTab(index)} />
      {React.Children.toArray(props.children)[activeTab]}
    </div>
  );
};

export interface TabViewItemProps {
  /** Displayed tab label */
  label: string;

  /** Tab contents */
  children?: React.ReactElement | null;
}

/** Adds a tab to a TabView. */
export const TabViewItem: React.FC<TabViewItemProps> = (props) => {
  return <>{props.children}</>;
};
