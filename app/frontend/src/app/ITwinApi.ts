/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import { User } from "oidc-client";
import { applyUrlPrefix } from "./utils/Environment";

export interface Project {
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

export async function getProject(projectId: string, user: User): Promise<Project> {
  const response = await callITwinApi(`projects/${projectId}`, user);
  return response.project;
}

export interface IModel {
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

interface GeoCoordinates {
  latitude: number;
  longitude: number;
}

export async function getIModel(iModelId: string, user: User): Promise<IModel> {
  const response = await callITwinApi(`imodels/${iModelId}`, user);
  return response.iModel;
}

type Links<T extends string> = {
  [K in T]: { href: string };
};

async function callITwinApi(endpoint: string, user: User): Promise<any> {
  const response = await fetch(
    applyUrlPrefix("https://api.bentley.com/") + endpoint,
    {
      headers: {
        Authorization: `${user.token_type} ${user.access_token}`,
        Accept: "application/vnd.bentley.itwin-platform.v1+json",
      },
    },
  );
  return response.json();
}
