/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/

import { AuthorizationClient } from "@itwin/core-common";
import { demoIModels } from "./ITwinJsApp/IModelIdentifier.js";
import { applyUrlPrefix } from "./utils/Environment.js";

export interface ITwinRepresentation {
  id: string;
  class: string;
  subClass: string;
  type?: string;
  // eslint-disable-next-line id-denylist
  number: string;
  displayName: string;
  dataCenterLocation: string;
  status: "Active" | "Inactive" | "Trial";
  parentId?: string;
  iTwinAccountId?: string;
  imageName?: string;
  image?: string;
  createdDateTime: string;
  createdBy?: string;
}

export type ITwinSummary = Pick<ITwinRepresentation, "id" | "class" | "subClass" | "type" | "number" | "displayName">;

export interface GetUserITwinsArgs<Detail extends string> {
  detail: Detail;
  search?: string;
}

export async function getUserProjects(args: GetUserITwinsArgs<"minimal">, requestArgs: RequestArgs): Promise<ITwinSummary[] | undefined>;
export async function getUserProjects(args: GetUserITwinsArgs<"representation">, requestArgs: RequestArgs): Promise<ITwinRepresentation[] | undefined>;
export async function getUserProjects(args: GetUserITwinsArgs<string>, requestArgs: RequestArgs): Promise<ITwinSummary[] | ITwinRepresentation[] | undefined> {
  // Search query should contain non-whitespace characters and not exceed 255 characters.
  const search = args.search?.trim().slice(0, 256);
  const searchQuery = search ? `&$search=${search}` : "";
  return callITwinApi(
    {
      endpoint: `itwins/?subClass=Project${searchQuery}`,
      additionalHeaders: createITwinsAPIHeaders({
        Prefer: `return=${args.detail}`,
      }),
      postProcess: async (response) => (await response.json()).iTwins,
    },
    requestArgs,
  );
}

export async function getProject(projectId: string, requestArgs: RequestArgs): Promise<ITwinRepresentation | undefined> {
  return callITwinApi(
    {
      endpoint: `itwins/${projectId}`,
      additionalHeaders: createITwinsAPIHeaders(),
      postProcess: async (response) => (await response.json()).iTwin,
    },
    requestArgs,
  );
}

function createITwinsAPIHeaders(additionalHeaders?: Record<string, string>) {
  return {
    Accept: "application/vnd.bentley.itwin-platform.v1+json",
    ...additionalHeaders,
  };
}

export interface IModelRepresentation {
  id: string;
  displayName: string;
  name: string;
  description: string | null;
  state: string;
  createdDateTime: string;
  iTwinId: string;
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

export interface GetITwinIModelsArgs<Detail extends string> {
  iTwinId: string;
  detail: Detail;
  name?: string;
}

export async function getITwinIModels(args: GetITwinIModelsArgs<"minimal">, requestArgs: RequestArgs): Promise<IModelMinimal[] | undefined>;
export async function getITwinIModels(args: GetITwinIModelsArgs<"representation">, requestArgs: RequestArgs): Promise<IModelRepresentation[] | undefined>;
export async function getITwinIModels(
  args: GetITwinIModelsArgs<string>,
  requestArgs: RequestArgs,
): Promise<IModelMinimal[] | IModelRepresentation[] | undefined> {
  // Search query should contain non-whitespace characters and not exceed 255 characters.
  const name = args.name?.trim().slice(0, 256);
  const nameQuery = name ? `&name=${name}` : "";
  return callITwinApi(
    {
      endpoint: `imodels/?iTwinId=${args.iTwinId}${nameQuery}`,
      additionalHeaders: createIModelsAPIHeaders({
        Prefer: `return=${args.detail}`,
      }),
      postProcess: async (response) => (await response.json()).iModels,
    },
    requestArgs,
  );
}
export async function getIModel(iModelId: string, requestArgs: RequestArgs): Promise<IModelRepresentation | undefined> {
  return callITwinApi(
    {
      endpoint: `imodels/${iModelId}`,
      additionalHeaders: createIModelsAPIHeaders(),
      skipUrlPrefix: demoIModels.has(iModelId),
      postProcess: async (response) => (await response.json()).iModel,
    },
    requestArgs,
  );
}

export async function getIModelThumbnail(iModelId: string, requestArgs: RequestArgs): Promise<Blob | undefined> {
  return callITwinApi(
    {
      endpoint: `imodels/${iModelId}/thumbnail?size=small`,
      additionalHeaders: createIModelsAPIHeaders(),
      immutable: true,
      skipUrlPrefix: demoIModels.has(iModelId),
      postProcess: async (response) => response.blob(),
    },
    requestArgs,
  );
}

function createIModelsAPIHeaders(additionalHeaders?: Record<string, string>) {
  return {
    Accept: "application/vnd.bentley.itwin-platform.v2+json",
    ...additionalHeaders,
  };
}

type Links<T extends string> = {
  [K in T]: { href: string };
};

interface CallITwinApiArgs<T> {
  endpoint: string;
  additionalHeaders?: Record<string, string>;
  immutable?: boolean;
  skipUrlPrefix?: boolean;
  postProcess: (response: Response) => Promise<T>;
}

export interface RequestArgs {
  authorizationClient: AuthorizationClient;
}

async function callITwinApi<T>(args: CallITwinApiArgs<T>, requestArgs: RequestArgs): Promise<T | undefined> {
  const iTwinApiUrl = "https://api.bentley.com/";
  const url = (args.skipUrlPrefix ? iTwinApiUrl : applyUrlPrefix(iTwinApiUrl)) + args.endpoint;
  const headers = {
    Authorization: await requestArgs.authorizationClient.getAccessToken(),
    Accept: "application/json",
    ...args.additionalHeaders,
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
