/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/

import "./LandingPage.scss";
import * as React from "react";
import { PageLayout } from "@itwin/itwinui-layouts-react";
import { Text } from "@itwin/itwinui-react";

export interface LandingPageProps {
  headline?: string | undefined;
  children: React.ReactElement | React.ReactElement[];
}

export function LandingPage(props: LandingPageProps): React.ReactElement {
  return (
    <PageLayout.Content className="landing-page">
      {props.headline && (
        <Text variant="headline" as="h1">
          {props.headline}
        </Text>
      )}
      <div className="landing-page-options">{props.children}</div>
    </PageLayout.Content>
  );
}
