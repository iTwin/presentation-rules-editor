/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/

import * as React from "react";
import { AuthorizationClient } from "@itwin/core-common";
import { SvgImodelHollow } from "@itwin/itwinui-icons-react";
import { FluidGrid } from "@itwin/itwinui-layouts-react";
import { Text } from "@itwin/itwinui-react";
import { useAuthorization } from "../Authorization.js";
import { VerticalStack } from "../common/CenteredStack.js";
import { getIModel } from "../ITwinApi.js";
import { demoIModels } from "../ITwinJsApp/IModelIdentifier.js";
import { iModelBrowserContext, IModelTile } from "./IModelBrowser.js";

export function DemoIModelBrowser(): React.ReactElement {
  const { demoAuthorizationClient } = useAuthorization();
  const { demoIModelData, loadIModelData } = useDemoIModelData(demoAuthorizationClient);
  const handleVisible = useEvent((iModelId: string) => demoIModelData.get(iModelId) === undefined && loadIModelData(iModelId));

  let { searchQuery } = React.useContext(iModelBrowserContext);
  searchQuery = searchQuery.trim().toLowerCase();
  const iModels = [...demoIModels.entries()].filter(([_, { name }]) => searchQuery === "" || name.toLowerCase().includes(searchQuery));
  if (iModels.length === 0) {
    return (
      <VerticalStack className="imodel-browser-no-data">
        <SvgImodelHollow />
        <Text variant="title" as="h2" isMuted>
          No iModels match given search query
        </Text>
      </VerticalStack>
    );
  }

  return (
    <FluidGrid>
      {iModels.map(([iModelId, { name, iTwinId }]) => (
        <IModelTile
          key={iModelId}
          iModelId={iModelId}
          iTwinId={iTwinId}
          name={name}
          description={demoIModelData.get(iModelId)?.description}
          authorizationClient={demoAuthorizationClient}
          onVisible={handleVisible}
        />
      ))}
    </FluidGrid>
  );
}

interface DemoIModelData {
  description: string | undefined;
  dateCreated: string;
}

function useDemoIModelData(authorizationClient: AuthorizationClient): {
  demoIModelData: Map<string, DemoIModelData>;
  loadIModelData: (iModelId: string) => void;
} {
  const [demoIModelData, setDemoIModelData] = React.useState<Map<string, DemoIModelData>>(new Map());
  const ref = React.useRef({
    disposed: false,
    loadIModelData: async (iModelId: string) => {
      const response = await getIModel(iModelId, { authorizationClient });
      if (ref.current.disposed || !response) {
        return;
      }

      const iModelData = {
        description: response.description ?? undefined,
        dateCreated: new Date(response.createdDateTime).toLocaleDateString(),
      };
      setDemoIModelData((prevState) => new Map(prevState).set(iModelId, iModelData));
    },
  });

  React.useEffect(
    () => () => {
      ref.current.disposed = true;
    },
    [],
  );

  return {
    demoIModelData,
    loadIModelData: ref.current.loadIModelData,
  };
}

// Loosely based on useEvent proposal https://github.com/reactjs/rfcs/blob/useevent/text/0000-useevent.md
function useEvent<T extends unknown[], U>(handleEvent: (...args: T) => U): (...args: T) => U {
  const handleEventRef = React.useRef(handleEvent);
  handleEventRef.current = handleEvent;
  return React.useCallback((...args) => handleEventRef.current(...args), []);
}
