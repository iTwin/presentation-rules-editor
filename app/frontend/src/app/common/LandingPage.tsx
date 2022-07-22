/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import "./LandingPage.scss";
import * as React from "react";
import { PageLayout } from "@itwin/itwinui-layouts-react";
import { Headline } from "@itwin/itwinui-react";

export interface LandingPageProps {
  headline?: string | undefined;
  children: React.ReactElement | React.ReactElement[];
}

export function LandingPage(props: LandingPageProps): React.ReactElement {
  return (
    <PageLayout.Content className="landing-page">
      {props.headline && <Headline>{props.headline}</Headline>}
      <div className="landing-page-options">
        {props.children}
      </div>
    </PageLayout.Content>
  );
}
