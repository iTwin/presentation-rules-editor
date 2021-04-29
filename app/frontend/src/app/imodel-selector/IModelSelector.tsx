/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import "./IModelSelector.scss";
import * as React from "react";
import { IModelApp, IModelConnection } from "@bentley/imodeljs-frontend";
import { backendApiContext } from "../AppContext";

export interface IModelSelectorProps {
  onIModelSelected: (imodel?: IModelConnection) => void;
}

export const IModelSelector: React.FC<IModelSelectorProps> = (props) => {
  const [availableImodels, setAvailableImodels] = React.useState<string[]>([]);
  const [error, setError] = React.useState<string>();
  const backendApi = React.useContext(backendApiContext);

  React.useEffect(
    () => {
      (async () => {
        const imodels = await backendApi.getAvailableIModels();
        imodels.splice(0, 0, "");
        setAvailableImodels(imodels);
      })();
    },
    [],
  );

  async function handleOnImodelSelected(e: React.ChangeEvent<HTMLSelectElement>): Promise<void> {
    // Save relevant React synthetic event values
    const imodelPath = e.currentTarget.value;

    if (backendApi.iModel !== undefined) {
      await backendApi.iModel.close();
    }

    if (imodelPath === "") {
      setError(undefined);
      props.onIModelSelected(undefined);
      return;
    }

    let imodel: IModelConnection | undefined = undefined;
    try {
      imodel = await backendApi.openIModel(imodelPath);
      setError(undefined);
    } catch (err) {
      setError(err.message);
    }

    props.onIModelSelected(imodel);
  }

  return (
    <div className="IModelSelector">
      {IModelApp.i18n.translate("App:select-imodel")}:
      <select onChange={handleOnImodelSelected}>
        {availableImodels.map((path: string) => <option key={path} value={path}>{path.split(/[\\/]/).pop()}</option>)}
      </select>
      {error && <div className="Error">{IModelApp.i18n.translate("App:error")}</div>}
    </div>
  );
};
