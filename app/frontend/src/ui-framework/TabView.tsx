/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import * as React from "react";
import { HorizontalTabs } from "@bentley/ui-core";

export interface TabViewProps {
  /** One or more TabViewItem(s) */
  children: React.ReactElement<TabViewItemProps> | React.ReactElement<TabViewItemProps>[];
}

/**
 * Displays a set of horizontal tabs and active tab's contents.
 * Workarounds display issue where setting 'height: 100%' overflows the content area. Also, provides a nicer API.
 */
export const TabView: React.FC<TabViewProps> = (props: TabViewProps) => {
  const tabLabels = React.Children.map(props.children, (item) => item.props.label);
  const [activeTab, setActiveTab] = React.useState(0);
  return (
    <>
      <HorizontalTabs labels={tabLabels} onActivateTab={(index) => setActiveTab(index)} />
      <div style={{ height: "100%", display: "grid", gridTemplateRows: "auto 41px" }}>
        {React.Children.toArray(props.children)[activeTab]}
      </div>
    </>
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
