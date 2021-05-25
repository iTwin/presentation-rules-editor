/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import "./IModelSelector.scss";
import * as React from "react";
import { IModelApp } from "@bentley/imodeljs-frontend";
import { backendApiContext } from "../AppContext";

export interface IModelSelectorProps {
  selectedIModelPath: string;
  setSelectedIModelPath: (imodel: string) => void;
}

export function IModelSelector(props: IModelSelectorProps): React.ReactElement {
  const [availableImodels, setAvailableImodels] = React.useState<string[]>([]);
  const backendApi = React.useContext(backendApiContext);

  React.useEffect(
    () => {
      void (async () => {
        const imodels = await backendApi.getAvailableIModels();
        imodels.splice(0, 0, "");
        setAvailableImodels(imodels);
      })();
    },
    [backendApi],
  );

  function handleIModelSelection(e: React.ChangeEvent<HTMLSelectElement>): void {
    props.setSelectedIModelPath(e.currentTarget.value);
  }

  return (
    <div className="IModelSelector">
      {IModelApp.i18n.translate("App:select-imodel")}:
      <select onChange={handleIModelSelection} value={props.selectedIModelPath}>
        {availableImodels.map((path: string) => <option key={path} value={path}>{path.split(/[\\/]/).pop()}</option>)}
      </select>
    </div>
  );
}
