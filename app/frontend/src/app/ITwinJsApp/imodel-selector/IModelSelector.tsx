/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import * as React from "react";
import { IModelApp } from "@bentley/imodeljs-frontend";
import { HeaderButton, MenuItem, ProgressRadial } from "@itwin/itwinui-react";
import { backendApiContext } from "../ITwinJsAppContext";

export interface IModelSelectorProps {
  selectedIModelPath: string;
  setSelectedIModelPath: (imodel: string) => void;
}

export function IModelSelector(props: IModelSelectorProps): React.ReactElement {
  const [availableIModels, setAvailableIModels] = React.useState<string[]>([]);
  const [snapshotFolderIsOpening, setSnapshotFolderIsOpening] = React.useState(false);
  const backendApi = React.useContext(backendApiContext);

  const { selectedIModelPath, setSelectedIModelPath } = props;

  React.useEffect(
    () => {
      void (async () => {
        const imodels = await backendApi.getAvailableIModels();
        setAvailableIModels(imodels);
      })();
    },
    [backendApi],
  );

  function buildMenuItems(close: () => void): React.ReactElement[] {
    async function openSnapshotFolder() {
      try {
        setSnapshotFolderIsOpening(true);
        await backendApi.openIModelsDirectory();
      } finally {
        setSnapshotFolderIsOpening(false);
        close();
      }
    }

    function selectIModel(value: any) {
      setSelectedIModelPath(value);
      close();
    }

    return [
      <MenuItem
        key="open-snapshot-folder"
        badge={snapshotFolderIsOpening ? <ProgressRadial indeterminate={true} /> : undefined}
        onClick={openSnapshotFolder}
      >
        {IModelApp.i18n.translate("App:imodel-selector:open-snapshot-folder")}
      </MenuItem>,
      ...availableIModels.map((path: string) => (
        <MenuItem key={path} value={path} onClick={selectIModel}>
          {getBasename(path)}
        </MenuItem>
      )),
    ];
  }

  return (
    <HeaderButton
      name={getBasename(selectedIModelPath)}
      description={IModelApp.i18n.translate("App:imodel-selector:select-imodel")}
      menuItems={buildMenuItems}
    />
  );
}

function getBasename(path: string): string {
  const lastForward = path.lastIndexOf("/");
  if (lastForward !== -1) {
    return path.substr(lastForward + 1);
  }

  const lastBackward = path.lastIndexOf("\\");
  if (lastBackward !== -1) {
    return path.substr(lastBackward + 1);
  }

  return path;
}
