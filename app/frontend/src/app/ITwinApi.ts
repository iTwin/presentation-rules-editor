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

export function getUserProjects(detail: "minimal", search?: string): CallITwinApiArgs<ProjectMinimal[]>;
export function getUserProjects(detail: "representation", search?: string): CallITwinApiArgs<ProjectRepresentation[]>;
export function getUserProjects(
  detail: "minimal" | "representation",
  search?: string,
): CallITwinApiArgs<ProjectMinimal[] | ProjectRepresentation[]> {
  // Search query should contain non-whitespace characters and not exceed 255 characters.
  search = search?.trim().slice(0, 256);
  const searchQuery = search ? `?$search=${search}` : "";
  return {
    endpoint: `projects${searchQuery}`,
    additionalHeaders: { Prefer: `return=${detail}` },
    postProcess: async (response) => (await response.json()).projects,
  };
}

export function getProject(projectId: string): CallITwinApiArgs<ProjectRepresentation> {
  return {
    endpoint: `projects/${projectId}`,
    postProcess: async (response) => (await response.json()).project,
  };
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

export function getProjectIModels(
  projectId: string,
  detail: "minimal",
  name?: string,
): CallITwinApiArgs<IModelMinimal[]>;
export function getProjectIModels(
  projectId: string,
  detail: "representation",
  name?: string,
): CallITwinApiArgs<IModelRepresentation[]>;
export function getProjectIModels(
  projectId: string,
  detail: "minimal" | "representation",
  name?: string,
): CallITwinApiArgs<IModelMinimal[] | IModelRepresentation[]> {
  // Search query should contain non-whitespace characters and not exceed 255 characters.
  name = name?.trim().slice(0, 256);
  const nameQuery = name ? `&name=${name}` : "";
  return {
    endpoint: `imodels?projectId=${projectId}${nameQuery}`,
    additionalHeaders: { Prefer: `return=${detail}` },
    postProcess: async (response) => (await response.json()).iModels,
  };
}

export function getIModel(iModelId: string): CallITwinApiArgs<IModelRepresentation> {
  return {
    endpoint: `imodels/${iModelId}`,
    postProcess: async (response) => (await response.json()).iModel,
  };
}

export function getIModelThumbnail(iModelId: string): CallITwinApiArgs<Blob> {
  return {
    endpoint: `imodels/${iModelId}/thumbnail?size=small`,
    immutable: true,
    postProcess: async (response) => response.blob(),
  };
}

type Links<T extends string> = {
  [K in T]: { href: string };
};

interface CallITwinApiArgs<T> {
  endpoint: string;
  additionalHeaders?: Record<string, string>;
  immutable?: boolean;
  postProcess: (response: Response) => Promise<T>;
}

export async function callITwinApi<T>(
  args: CallITwinApiArgs<T>,
  authorizationClient: AuthorizationClient,
): Promise<T | undefined> {
  const url = applyUrlPrefix("https://api.bentley.com/") + args.endpoint;
  const headers = {
    ...args.additionalHeaders,
    Authorization: await authorizationClient.getAccessToken(),
    Accept: "application/vnd.bentley.itwin-platform.v1+json",
  };
  const key = JSON.stringify({ url, headers });
  const fetcher = async () => {
    const response = await fetch(url, { headers });
    return response.ok ? args.postProcess(response) : undefined;
  };
  return args.immutable ? requestStore.fetchImmutable(key, fetcher) : requestStore.fetch(key, fetcher);
}

class RequestStore {
  private requestCache = new Map<string, Promise<unknown>>();
  private responseCache = new Map<string, unknown>();

  /** Executes fetch while being aware of duplicate requests. */
  public async fetch<T>(key: string, fetcher: () => Promise<T>): Promise<T> {
    let request = this.requestCache.get(key) as Promise<T> | undefined;
    if (request) {
      return request;
    }

    request = fetcher()
      .then((result) => {
        setTimeout(() => this.requestCache.delete(key), 2000);
        return result;
      })
      .catch((error) => {
        this.requestCache.delete(key);
        throw error;
      });
    this.requestCache.set(key, request);
    return request;
  }

  /** Execute fetch the first time unique URL and header combination is encountered. */
  public async fetchImmutable<T>(requestKey: string, fetcher: () => Promise<T>): Promise<T> {
    const cacheEntry = this.responseCache.get(requestKey) as Promise<T> | undefined;
    if (cacheEntry) {
      return cacheEntry;
    }

    const response = await this.fetch(requestKey, fetcher);
    if (!this.responseCache.has(requestKey)) {
      this.responseCache.set(requestKey, response);

      const cleanupThreshold = 1500;
      const amountToForget = 500;
      if (this.responseCache.size > cleanupThreshold) {
        [...this.responseCache.keys()].slice(0, amountToForget).forEach((key) => this.responseCache.delete(key));
      }
    }

    return response;
  }
}

const requestStore = new RequestStore();
