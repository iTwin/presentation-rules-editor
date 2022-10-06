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

export interface GetUserProjectsArgs<Detail extends string> {
  detail: Detail;
  search?: string;
}

export async function getUserProjects(
  args: GetUserProjectsArgs<"minimal">,
  requestArgs: RequestArgs,
): Promise<ProjectMinimal[] | undefined>;
export async function getUserProjects(
  args: GetUserProjectsArgs<"representation">,
  requestArgs: RequestArgs,
): Promise<ProjectRepresentation[] | undefined>;
export async function getUserProjects(
  args: GetUserProjectsArgs<string>,
  requestArgs: RequestArgs,
): Promise<ProjectMinimal[] | ProjectRepresentation[] | undefined> {
  // Search query should contain non-whitespace characters and not exceed 255 characters.
  const search = args.search?.trim().slice(0, 256);
  const searchQuery = search ? `?$search=${search}` : "";
  return callITwinApi(
    {
      endpoint: `projects${searchQuery}`,
      additionalHeaders: { Prefer: `return=${args.detail}` },
      postProcess: async (response) => (await response.json()).projects,
    },
    requestArgs,
  );
}

export async function getProject(
  projectId: string,
  requestArgs: RequestArgs,
): Promise<ProjectRepresentation | undefined> {
  return callITwinApi(
    {
      endpoint: `projects/${projectId}`,
      postProcess: async (response) => (await response.json()).project,
    },
    requestArgs,
  );
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

export interface GetProjectIModelsArgs<Detail extends string> {
  projectId: string;
  detail: Detail;
  name?: string;
}

export async function getProjectIModels(
  args: GetProjectIModelsArgs<"minimal">,
  requestArgs: RequestArgs,
): Promise<IModelMinimal[] | undefined>;
export async function getProjectIModels(
  args: GetProjectIModelsArgs<"representation">,
  requestArgs: RequestArgs,
): Promise<IModelRepresentation[] | undefined>;
export async function getProjectIModels(
  args: GetProjectIModelsArgs<string>,
  requestArgs: RequestArgs,
): Promise<IModelMinimal[] | IModelRepresentation[] | undefined> {
  // Search query should contain non-whitespace characters and not exceed 255 characters.
  const name = args.name?.trim().slice(0, 256);
  const nameQuery = name ? `&name=${name}` : "";
  return callITwinApi(
    {
      endpoint: `imodels?projectId=${args.projectId}${nameQuery}`,
      additionalHeaders: { Prefer: `return=${args.detail}` },
      postProcess: async (response) => (await response.json()).iModels,
    },
    requestArgs,
  );
}

export async function getIModel(iModelId: string, requestArgs: RequestArgs): Promise<IModelRepresentation | undefined> {
  return callITwinApi(
    {
      endpoint: `imodels/${iModelId}`,
      postProcess: async (response) => (await response.json()).iModel,
    },
    requestArgs,
  );
}

export async function getIModelThumbnail(iModelId: string, requestArgs: RequestArgs): Promise<Blob | undefined> {
  return callITwinApi(
    {
      endpoint: `imodels/${iModelId}/thumbnail?size=small`,
      immutable: true,
      postProcess: async (response) => response.blob(),
    },
    requestArgs,
  );
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

export interface RequestArgs {
  authorizationClient: AuthorizationClient;
}

async function callITwinApi<T>(
  args: CallITwinApiArgs<T>,
  requestArgs: RequestArgs,
): Promise<T | undefined> {
  const url = applyUrlPrefix("https://api.bentley.com/") + args.endpoint;
  const headers = {
    ...args.additionalHeaders,
    Authorization: await requestArgs.authorizationClient.getAccessToken(),
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
