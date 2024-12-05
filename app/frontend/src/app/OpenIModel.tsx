/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/

import * as React from "react";
import { Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { AuthorizationClient } from "@itwin/core-common";
import { SvgHome, SvgUser } from "@itwin/itwinui-icons-react";
import { HeaderButton, Tile } from "@itwin/itwinui-react";
import { AppPage, AppSideNavigation } from "./App.js";
import { appNavigationContext } from "./AppContext.js";
import { breadcrumbsContext } from "./AppHeader.js";
import { AuthorizationState, useAuthorization } from "./Authorization.js";
import { LandingPage } from "./common/LandingPage.js";
import { LoadingIndicator } from "./common/LoadingIndicator.js";
import { PageNotFound } from "./errors/PageNotFound.js";
import { IModelBrowserTab } from "./IModelBrowser/IModelBrowser.js";
import { getIModel, getProject } from "./ITwinApi.js";
import { BackendApi } from "./ITwinJsApp/api/BackendApi.js";
import {
  demoIModels,
  IModelIdentifier,
  isDemoIModel,
  isSnapshotIModel,
  ITwinIModelIdentifier,
  SnapshotIModelIdentifier,
} from "./ITwinJsApp/IModelIdentifier.js";

import type { ITwinJsApp } from "./ITwinJsApp/ITwinJsApp.js";

export interface ITwinJsAppData {
  component: typeof ITwinJsApp;
  backendApiPromise: Promise<BackendApi>;
}

interface OpenIModelProps {
  iTwinJsApp: ITwinJsAppData | undefined;
}

export function OpenIModel(props: OpenIModelProps): React.ReactElement {
  const activeIModelRef = React.useRef<IModelIdentifier>({
    iTwinId: "b27dc251-0e53-4a36-9a38-182fc309be07",
    iModelId: "f30566da-8fdf-4cba-b09a-fd39f5397ae6",
  });

  const [params] = useSearchParams();
  if (params.toString().length === 0) {
    const redirectParameters = isSnapshotIModel(activeIModelRef.current)
      ? `?snapshot=${activeIModelRef.current}`
      : `?iTwinId=${activeIModelRef.current.iTwinId}&iModelId=${activeIModelRef.current.iModelId}`;
    return <Navigate replace to={redirectParameters} />;
  }

  let iModelIdentifier: IModelIdentifier | null = params.get("snapshot");
  if (!iModelIdentifier) {
    // Attempt to get properly capitalized parameters and fallback to legacy capitalization
    const iTwinId = params.get("iTwinId") ?? params.get("itwinId");
    const iModelId = params.get("iModelId") ?? params.get("imodelId");
    if (iTwinId && iModelId) {
      iModelIdentifier = { iTwinId, iModelId };
    }
  }

  if (!iModelIdentifier && params.toString().length === 0) {
    iModelIdentifier = activeIModelRef.current;
  }

  if (!iModelIdentifier) {
    return <PageNotFound />;
  }

  activeIModelRef.current = iModelIdentifier;
  if (isSnapshotIModel(iModelIdentifier)) {
    if (import.meta.env.DEPLOYMENT_TYPE === "web") {
      return <PageNotFound />;
    }

    return (
      <>
        <AppSideNavigation activePage={AppPage.RulesetEditor} />
        <OpenSnapshotIModel iTwinJsApp={props.iTwinJsApp} iModelIdentifier={iModelIdentifier} />
      </>
    );
  }

  return (
    <>
      <AppSideNavigation activePage={AppPage.RulesetEditor} />
      <OpenITwinIModel iTwinJsApp={props.iTwinJsApp} iModelIdentifier={iModelIdentifier} />
    </>
  );
}

interface OpenSnapshotIModelProps {
  iTwinJsApp: ITwinJsAppData | undefined;
  iModelIdentifier: SnapshotIModelIdentifier;
}

function OpenSnapshotIModel(props: OpenSnapshotIModelProps): React.ReactElement {
  const navigation = React.useContext(appNavigationContext);
  const { setBreadcrumbs } = React.useContext(breadcrumbsContext);

  React.useEffect(() => {
    setBreadcrumbs([
      <HeaderButton key="iTwin" name="Local snapshots" onClick={() => navigation.openIModelBrowser(IModelBrowserTab.Local)} />,
      <HeaderButton key="iModel" name={props.iModelIdentifier} />,
    ]);

    return () => setBreadcrumbs([]);
  }, [navigation, props.iModelIdentifier, setBreadcrumbs]);

  if (props.iTwinJsApp === undefined) {
    return <LoadingIndicator id="app-loader">Loading...</LoadingIndicator>;
  }

  return React.createElement(props.iTwinJsApp.component, {
    backendApiPromise: props.iTwinJsApp.backendApiPromise,
    iModelIdentifier: props.iModelIdentifier,
    authorizationClient: undefined,
  });
}

interface OpenITwinIModelProps {
  iTwinJsApp: ITwinJsAppData | undefined;
  iModelIdentifier: ITwinIModelIdentifier;
}

function OpenITwinIModel(props: OpenITwinIModelProps): React.ReactElement {
  // ITwinJsApp component expects iModelIdentifier to be immutable, thus we have to keep the same object instance while
  // the identifier components remain the same.
  const iModelIdentifier: ITwinIModelIdentifier = React.useMemo(
    () => ({ iModelId: props.iModelIdentifier.iModelId, iTwinId: props.iModelIdentifier.iTwinId }),
    [props.iModelIdentifier.iModelId, props.iModelIdentifier.iTwinId],
  );

  const { state, signIn, userAuthorizationClient, demoAuthorizationClient } = useAuthorization();
  const authClient = isDemoIModel(iModelIdentifier) ? demoAuthorizationClient : userAuthorizationClient;
  usePopulateHeaderBreadcrumbs(iModelIdentifier, authClient);
  const navigate = useNavigate();

  const iModelRequiresSignIn = !isDemoIModel(iModelIdentifier);
  if (iModelRequiresSignIn && state === AuthorizationState.Offline) {
    return (
      <LandingPage headline="Cannot open this iModel while in offline mode">
        <Tile thumbnail={<SvgHome />} name="Go to homepage" isActionable onClick={async () => navigate("/")} />
      </LandingPage>
    );
  }

  if (iModelRequiresSignIn && state === AuthorizationState.SignedOut) {
    return (
      <LandingPage headline="Sign In to access this iModel:">
        <Tile thumbnail={<SvgUser />} name="Sign In" isActionable onClick={signIn} />
      </LandingPage>
    );
  }

  if (props.iTwinJsApp === undefined || (iModelRequiresSignIn && state === AuthorizationState.Pending)) {
    return <LoadingIndicator id="app-loader">Loading...</LoadingIndicator>;
  }

  return React.createElement(props.iTwinJsApp.component, {
    backendApiPromise: props.iTwinJsApp.backendApiPromise,
    iModelIdentifier,
    authorizationClient: authClient,
  });
}

function usePopulateHeaderBreadcrumbs(iModelIdentifier: ITwinIModelIdentifier, authorizationClient: AuthorizationClient | undefined): void {
  const navigation = React.useContext(appNavigationContext);
  const { setBreadcrumbs } = React.useContext(breadcrumbsContext);
  React.useEffect(() => {
    let disposed = false;
    const demoIModel = demoIModels.get(iModelIdentifier.iModelId);
    if (demoIModel) {
      setBreadcrumbs([
        <HeaderButton key="iTwin" name="Demo iModels" onClick={() => navigation.openIModelBrowser(IModelBrowserTab.Demo)} />,
        <HeaderButton key="iModel" name={demoIModel.name} />,
      ]);
    } else if (authorizationClient) {
      void (async () => {
        const [project, iModel] = await Promise.all([
          getProject(iModelIdentifier.iTwinId, { authorizationClient }),
          getIModel(iModelIdentifier.iModelId, { authorizationClient }),
        ]);
        if (!disposed && project && iModel) {
          setBreadcrumbs([
            <HeaderButton
              key="iTwin"
              name={project.displayName}
              description={project.number !== project.displayName ? project.number : undefined}
              onClick={() => navigation.openIModelBrowser(IModelBrowserTab.iTwins)}
            />,
            <HeaderButton key="iModel" name={iModel.name} description={iModel.description} />,
          ]);
        }
      })();
    }

    return () => {
      disposed = true;
      setBreadcrumbs([]);
    };
  }, [iModelIdentifier, setBreadcrumbs, authorizationClient, navigation]);
}
