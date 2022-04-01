/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import * as React from "react";
import { SvgUser } from "@itwin/itwinui-icons-react";
import { Text } from "@itwin/itwinui-react";
import { AuthorizationState, useAuthorization } from "../Authorization";
import { CheckingSignInStatusHint } from "../common/CheckingSignInStatusHint";
import { GitHubLogoSmall } from "../common/GitHubLogo";
import { LandingPage } from "../common/LandingPage";
import { Tile } from "../common/Tile";
import { IModelSelector } from "../IModelSelector/IModelSelector";
import { BackendApi } from "../ITwinJsApp/api/BackendApi";

interface HomepageProps {
  backendApiPromise: Promise<BackendApi> | undefined;
}

export function Homepage(props: HomepageProps): React.ReactElement {
  const { state } = useAuthorization();

  if (process.env.DEPLOYMENT_TYPE === "web") {
    if (state === AuthorizationState.Pending) {
      return <CheckingSignInStatusHint />;
    }

    if (state === AuthorizationState.SignedOut) {
      return <WebHomepage />;
    }
  }

  return <IModelSelector backendApiPromise={props.backendApiPromise} />;
}

function WebHomepage(): React.ReactElement {
  const { signIn } = useAuthorization();

  return (
    <LandingPage headline="Start using Presentation Rules Editor:">
      <Tile
        thumbnail={<SvgUser onClick={signIn} />}
        name="Sign In"
        description="Select an iModel from your Projects"
      />
      <Text variant="title">or</Text>
      <Tile
        thumbnail={<a href="https://github.com/iTwin/presentation-rules-editor"><GitHubLogoSmall /></a>}
        name="Clone from GitHub"
        description="Work offline with iModel Snapshots"
      />
    </LandingPage>
  );
}
