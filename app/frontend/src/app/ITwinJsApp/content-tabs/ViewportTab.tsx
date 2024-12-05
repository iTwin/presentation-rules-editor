/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/

import * as React from "react";
import { Id64String } from "@itwin/core-bentley";
import { IModelConnection } from "@itwin/core-frontend";
import { ViewportComponent } from "@itwin/imodel-components-react";
import { UnifiedSelectionContextProvider, viewWithUnifiedSelection } from "@itwin/presentation-components";
import { backendApiContext } from "../ITwinJsAppContext.js";

export interface ViewportTabProps {
  imodel: IModelConnection;
}

export function ViewportTab(props: ViewportTabProps): React.ReactElement {
  return <ViewportForIModel key={props.imodel.key} imodel={props.imodel} />;
}

interface ViewportForIModelProps {
  imodel: IModelConnection;
}

function ViewportForIModel(props: ViewportForIModelProps): React.ReactElement | null {
  const viewDefinitionId = useViewDefinitionId(props.imodel);

  // Viewport does not react to viewDefinitionId change, make sure it's available before mounting viewport component
  if (viewDefinitionId === undefined) {
    return null;
  }

  return (
    <UnifiedSelectionContextProvider imodel={props.imodel} selectionLevel={0}>
      <ViewportWithUnifiedSelection imodel={props.imodel} viewDefinitionId={viewDefinitionId} />
    </UnifiedSelectionContextProvider>
  );
}

function useViewDefinitionId(imodel: IModelConnection): Id64String | undefined {
  const [viewDefinitionId, setViewDefinitionId] = React.useState<Id64String>();
  const backendApi = React.useContext(backendApiContext);

  React.useEffect(() => {
    let disposed = false;

    void (async () => {
      const viewId = await backendApi.getViewDefinition(imodel);
      if (!disposed) {
        setViewDefinitionId(viewId);
      }
    })();

    return () => {
      disposed = true;
    };
  }, [backendApi, imodel]);

  return viewDefinitionId;
}

const ViewportWithUnifiedSelection = viewWithUnifiedSelection(ViewportComponent);
