/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import * as React from "react";
import { useHistory } from "react-router-dom";
import { SvgHome, SvgUser } from "@itwin/itwinui-icons-react";
import { AuthorizationState, useAuthorization } from "./Authorization";
import { LandingPage } from "./common/LandingPage";
import { LoadingIndicator } from "./common/LoadingIndicator";
import { Tile } from "./common/Tile";
import { BackendApi } from "./ITwinJsApp/api/BackendApi";
import { isDemoIModel, ITwinIModelIdentifier, SnapshotIModelIdentifier } from "./ITwinJsApp/IModelIdentifier";

import type { ITwinJsApp } from "./ITwinJsApp/ITwinJsApp";

export interface ITwinJsAppData {
  component: typeof ITwinJsApp;
  backendApiPromise: Promise<BackendApi>;
}

export interface OpenSnapshotIModelProps {
  iTwinJsApp: ITwinJsAppData | undefined;
  iModelIdentifier: SnapshotIModelIdentifier;
}

export function OpenSnapshotIModel(props: OpenSnapshotIModelProps): React.ReactElement {
  if (props.iTwinJsApp === undefined) {
    return <LoadingIndicator id="app-loader">Loading...</LoadingIndicator>;
  }

  return React.createElement(
    props.iTwinJsApp.component,
    {
      backendApiPromise: props.iTwinJsApp.backendApiPromise,
      iModelIdentifier: props.iModelIdentifier,
    }
  );
}
export interface OpenITwinIModelProps {
  iTwinJsApp: ITwinJsAppData | undefined;
  iModelIdentifier: ITwinIModelIdentifier;
}

export function OpenITwinIModel(props: OpenITwinIModelProps): React.ReactElement {
  // ITwinJsApp component expects iModelIdentifier to be immutable, thus we have to keep the same object instance while
  // the identifier components remain the same.
  const iModelIdentifier: ITwinIModelIdentifier = React.useMemo(
    () => ({ iModelId: props.iModelIdentifier.iModelId, iTwinId: props.iModelIdentifier.iTwinId }),
    [props.iModelIdentifier.iModelId, props.iModelIdentifier.iTwinId]
  );

  const { state, signIn } = useAuthorization();
  const history = useHistory();

  const iModelRequiresSignIn = !isDemoIModel(props.iModelIdentifier);
  if (props.iTwinJsApp === undefined || (iModelRequiresSignIn && state === AuthorizationState.Pending)) {
    return <LoadingIndicator id="app-loader">Loading...</LoadingIndicator>;
  }

  if (iModelRequiresSignIn && state === AuthorizationState.Offline) {
    return (
      <LandingPage headline="Cannot open this iModel while in offline mode">
        <Tile thumbnail={<SvgHome onClick={() => history.push("/")} />} name="Go to homepage" />
      </LandingPage>
    );
  }

  if (iModelRequiresSignIn && state === AuthorizationState.SignedOut) {
    return (
      <LandingPage headline="Sign In to access this iModel:">
        <Tile thumbnail={<SvgUser onClick={signIn} />} name="Sign In" />
      </LandingPage>
    );
  }

  return React.createElement(
    props.iTwinJsApp.component,
    {
      backendApiPromise: props.iTwinJsApp.backendApiPromise,
      iModelIdentifier,
    }
  );
}
