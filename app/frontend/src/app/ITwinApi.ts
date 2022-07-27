/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import { AuthorizationClient } from "@itwin/core-common";
import { applyUrlPrefix } from "./utils/Environment";

export interface ProjectRepresentation {
  id: string;
  displayName: string;
  projectNumber: string;
  registrationDateTime: string;
  registeredBy: string;
  geographicLocation: string;
  latitude: string;
  longitude: string;
  timeZone: string;
  dataCenterLocation: string;
  billingCountry: string;
  status: string;
  allowExternalTeamMembers: boolean;
  _links: Links<"forms" | "imodels" | "issues" | "storage">;
}

export type ProjectMinimal = Pick<ProjectRepresentation, "id" | "displayName" | "projectNumber">;

export async function getUserProjects(
  detail: "minimal",
  authorizationClient: AuthorizationClient,
  search?: string,
): Promise<ProjectMinimal[] | undefined>;
export async function getUserProjects(
  detail: "representation",
  authorizationClient: AuthorizationClient,
  search?: string,
): Promise<ProjectRepresentation[] | undefined>;
export async function getUserProjects(
  detail: "minimal" | "representation",
  authorizationClient: AuthorizationClient,
  search?: string,
): Promise<ProjectMinimal[] | ProjectRepresentation[] | undefined> {
  // Search query should contain non-whitespace characters and not exceed 255 characters.
  search = search?.trim().slice(0, 256);
  const searchQuery = search ? `?$search=${search}` : "";
  const response = await callITwinApi(`projects${searchQuery}`, authorizationClient, { Prefer: `return=${detail}` });
  if (!response.ok) {
    return;
  }

  const json = await response.json();
  return json.projects;
}

export async function getProject(
  projectId: string,
  authorizationClient: AuthorizationClient,
): Promise<ProjectRepresentation | undefined> {
  const response = await callITwinApi(`projects/${projectId}`, authorizationClient);
  if (!response.ok) {
    return;
  }

  const json = await response.json();
  return json.project;
}

export interface IModelRepresentation {
  id: string;
  displayName: string;
  name: string;
  description: string | null;
  state: string;
  createdDateTime: string;
  projectId: string;
  extent: {
    southWest: GeoCoordinates;
    northEast: GeoCoordinates;
  } | null;
  _links: Links<"changesets" | "creator" | "namedVersions">;
}

export type IModelMinimal = Pick<IModelRepresentation, "id" | "displayName">;

interface GeoCoordinates {
  latitude: number;
  longitude: number;
}

export async function getProjectIModels(
  projectId: string,
  detail: "minimal",
  authorizationClient: AuthorizationClient,
  name?: string,
): Promise<IModelMinimal[] | undefined>;
export async function getProjectIModels(
  projectId: string,
  detail: "representation",
  authorizationClient: AuthorizationClient,
  name?: string,
): Promise<IModelRepresentation[] | undefined>;
export async function getProjectIModels(
  projectId: string,
  detail: "minimal" | "representation",
  authorizationClient: AuthorizationClient,
  name?: string,
): Promise<IModelMinimal[] | IModelRepresentation[] | undefined> {
  // Search query should contain non-whitespace characters and not exceed 255 characters.
  name = name?.trim().slice(0, 256);
  const nameQuery = name ? `&name=${name}` : "";
  const response = await callITwinApi(
    `imodels?projectId=${projectId}${nameQuery}`,
    authorizationClient,
    { Prefer: `return=${detail}` },
  );
  if (!response.ok) {
    return;
  }

  const json = await response.json();
  return json.iModels;
}

export async function getIModel(
  iModelId: string,
  authorizationClient: AuthorizationClient,
): Promise<IModelRepresentation | undefined> {
  const response = await callITwinApi(`imodels/${iModelId}`, authorizationClient);
  if (!response.ok) {
    return;
  }

  const json = await response.json();
  return json.iModel;
}

export async function getIModelThumbnail(
  iModelId: string,
  authorizationClient: AuthorizationClient,
): Promise<Blob | undefined> {
  const response = await callITwinApi(`imodels/${iModelId}/thumbnail?size=small`, authorizationClient);
  if (!response.ok) {
    return;
  }

  return response.blob();
}

type Links<T extends string> = {
  [K in T]: { href: string };
};

async function callITwinApi(
  endpoint: string,
  authorizationClient: AuthorizationClient,
  additionalHeaders?: Record<string, string>,
): Promise<Response> {
  return fetch(
    applyUrlPrefix("https://api.bentley.com/") + endpoint,
    {
      headers: {
        ...additionalHeaders,
        Authorization: await authorizationClient.getAccessToken(),
        Accept: "application/vnd.bentley.itwin-platform.v1+json",
      },
    },
  );
}
