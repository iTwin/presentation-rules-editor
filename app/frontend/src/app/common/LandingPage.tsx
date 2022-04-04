/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import "./LandingPage.scss";
import * as React from "react";
import { Text } from "@itwin/itwinui-react";

export interface LandingPageProps {
  headline: string;
  children: React.ReactElement | React.ReactElement[];
}

export function LandingPage(props: LandingPageProps): React.ReactElement {
  return (
    <div className="landing-page">
      <Text variant="headline">{props.headline}</Text>
      <div className="landing-page-options">
        {props.children}
      </div>
    </div>
  );
}
