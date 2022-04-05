/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
export type IModelIdentifier = SnapshotIModelIdentifier | ITwinIModelIdentifier;

export type SnapshotIModelIdentifier = string;

export interface ITwinIModelIdentifier {
  iTwinId: string;
  iModelId: string;
}

export function isSnapshotIModel(identifier: IModelIdentifier): identifier is SnapshotIModelIdentifier {
  return typeof identifier === "string";
}

export function isDemoIModel(identifier: IModelIdentifier): boolean {
  return !isSnapshotIModel(identifier) && demoIModels.get(identifier.iModelId)?.iTwinId === identifier.iTwinId;
}

export const demoIModels = new Map([
  [
    "11977591-6a15-4f0e-aa10-1c6afb066bc7",
    { name: "CoffsHarborDemo", iTwinId: "c5d4dd3a-597a-4c88-918c-f1aa3588312f" },
  ],
  [
    "b55dec38-d9b7-4029-9b9c-6b899151328f",
    { name: "Metrostation", iTwinId: "402f1a92-c7b1-4012-b787-7fa45e2e7fe4" },
  ],
  [
    "97a67f36-8efa-499c-a6ed-a8e07f38a410",
    { name: "Retail Building", iTwinId: "998b4696-a672-4f85-bea1-8e35e0852452" },
  ],
  [
    "f30566da-8fdf-4cba-b09a-fd39f5397ae6",
    { name: "Bay Town Process Plant", iTwinId: "b27dc251-0e53-4a36-9a38-182fc309be07" },
  ],
  [
    "6be3a56d-b93b-4a3c-a41e-06398083905d",
    { name: "House", iTwinId: "6b9d3c0b-1217-4cf8-a1c0-afcade43e66a" },
  ],
  [
    "f815bddf-c448-47c6-84d1-94762d85b645",
    { name: "Philadelphia", iTwinId: "402f1a92-c7b1-4012-b787-7fa45e2e7fe4" },
  ],
  [
    "881c9ca0-34ff-4875-ae63-2dd8ac015c27",
    { name: "Stadium", iTwinId: "656dd74d-8798-4aa4-8d13-6e6458789639" },
  ],
  [
    "67cf8408-8f3f-4a3a-bde1-a991a422e909",
    { name: "Transformed Stadium", iTwinId: "58262a3d-bbc8-45d0-adbc-13a4623c180f" },
  ],
  [
    "d992e912-7f6f-4bd6-9781-4ecf2891b17a",
    { name: "Exton Campus", iTwinId: "5b4ebd22-d94b-456b-8bd8-d59563de9acd" },
  ],
  [
    "62d521ca-0b45-4a65-9f48-9fc9b5e87100",
    { name: "Villa", iTwinId: "532629d2-d25e-4a00-9fb7-c401b6cacf84" },
  ],
]);
