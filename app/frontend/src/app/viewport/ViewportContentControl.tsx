/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import "./ViewportContentControl.css";
import * as React from "react";
import { Id64String } from "@bentley/bentleyjs-core";
import { IModelConnection } from "@bentley/imodeljs-frontend";
import { viewWithUnifiedSelection } from "@bentley/presentation-components";
import { ViewportComponent } from "@bentley/ui-components";
import { backendApiContext } from "../AppContext";

const Viewport = viewWithUnifiedSelection(ViewportComponent);

export interface ViewportContentComponentProps {
  imodel: IModelConnection;
}

export const ViewportContentComponent: React.FC<ViewportContentComponentProps> = (props) => {
  const backendApi = React.useContext(backendApiContext);

  const [selectedViewDefinitionId, setSelectedViewDefinitionId] = React.useState<Id64String | undefined>();
  const [prevIModel, setPrevIModel] = React.useState<IModelConnection | undefined>(props.imodel);
  if (prevIModel !== props.imodel) {
    setSelectedViewDefinitionId(undefined);
    setPrevIModel(props.imodel);
  }

  React.useEffect(
    () => {
      (async () => {
        const definitions = await backendApi.getViewDefinitions(props.imodel);
        if (definitions.length > 0) {
          setSelectedViewDefinitionId(definitions[0].id);
        }
      })();
    },
    [backendApi, props.imodel],
  );

  return (
    <div className="ViewportContentComponent" style={{ height: "100%" }}>
      {selectedViewDefinitionId && <Viewport imodel={props.imodel} viewDefinitionId={selectedViewDefinitionId} />}
    </div>
  );
};
