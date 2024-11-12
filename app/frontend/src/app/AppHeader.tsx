/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/

import { SvgImodelHollow } from "@itwin/itwinui-icons-react";
import {
  Avatar,
  Button,
  DropdownMenu,
  getUserColor,
  Header,
  HeaderBreadcrumbs,
  HeaderLogo,
  IconButton,
  MenuDivider,
  MenuExtraContent,
  MenuItem,
  Text,
} from "@itwin/itwinui-react";
import { UserProfile } from "oidc-client-ts";
import * as React from "react";
import { appNavigationContext } from "./AppContext";
import { AuthorizationState, useAuthorization } from "./Authorization";
import { HorizontalStack } from "./common/CenteredStack";
import { GitHubLogoSmall } from "./common/GitHubLogo";
import { OfflineModeExplainer } from "./common/OfflineModeExplainer";

export function AppHeader(): React.ReactElement {
  const { state, user, signIn, signOut } = useAuthorization();
  const navigation = React.useContext(appNavigationContext);

  const actions = [
    <IconButton key="Repository" as="a" href="https://github.com/iTwin/presentation-rules-editor" label="Source code" styleType="borderless">
      <GitHubLogoSmall />
    </IconButton>,
  ];
  switch (state) {
    case AuthorizationState.Offline:
      actions.push(
        <HorizontalStack key="offlineMode">
          Offline mode <OfflineModeExplainer />
        </HorizontalStack>,
      );
      break;

    case AuthorizationState.SignedOut:
      actions.push(
        <Button key="signin" styleType="borderless" onClick={signIn}>
          Sign In
        </Button>,
      );
      break;
    case AuthorizationState.SignedIn:
      actions.push(<HeaderUserIcon profile={user.profile} signOut={signOut} />);
      break;
  }

  return (
    <Header
      appLogo={
        <HeaderLogo logo={<SvgImodelHollow />} onClick={() => navigation.openIModelBrowser()}>
          Presentation Rules Editor
        </HeaderLogo>
      }
      breadcrumbs={<Breadcrumbs />}
      actions={actions}
      className="page-header"
    />
  );
}

interface HeaderUserIconProps {
  /** User profile. Even though oidc-client types claim that User always has a profile, that is not always the case. */
  profile: UserProfile | undefined;
  signOut: () => void;
}

function HeaderUserIcon(props: HeaderUserIconProps): React.ReactElement | null {
  const { profile, signOut } = props;
  const preferredName = profile?.preferred_username || profile?.name || profile?.nickname;
  const initials = profile?.given_name && profile?.family_name ? profile.given_name[0] + profile.family_name[0] : (preferredName ?? "?").substring(0, 2);
  const displayName = preferredName ?? "Unknown Account";

  return (
    <DropdownMenu
      menuItems={() => [
        <MenuExtraContent key={"displayName"}>
          <Text variant="leading">{displayName}</Text>
        </MenuExtraContent>,
        <MenuDivider key={"divider"} />,
        <MenuItem key={"signout"} onClick={signOut}>
          Sign out
        </MenuItem>,
      ]}
    >
      <IconButton styleType="borderless" label="Account Actions">
        <Avatar title={displayName} abbreviation={initials} backgroundColor={getUserColor(displayName)} />
      </IconButton>
    </DropdownMenu>
  );
}

function Breadcrumbs(): React.ReactElement {
  const { breadcrumbs } = React.useContext(breadcrumbsContext);
  return <HeaderBreadcrumbs items={breadcrumbs} />;
}

export interface BreadcrumbsContext {
  breadcrumbs: React.ReactNode[];
  setBreadcrumbs: (action: React.SetStateAction<React.ReactNode[]>) => void;
}

export const breadcrumbsContext = React.createContext<BreadcrumbsContext>({
  breadcrumbs: [],
  setBreadcrumbs: () => {},
});
