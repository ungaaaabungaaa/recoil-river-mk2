/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * This local bootstrap matches Convex 1.42's TypeScript codegen template.
 * `pnpm codegen` replaces it after a deployment is linked.
 */

import type { ApiFromModules, FilterApi, FunctionReference } from "convex/server";
import { anyApi } from "convex/server";

import type * as auth from "../auth.js";
import type * as bookmarks from "../bookmarks.js";
import type * as enrichment from "../enrichment.js";
import type * as graph from "../graph.js";

const fullApi: ApiFromModules<{
  auth: typeof auth;
  bookmarks: typeof bookmarks;
  enrichment: typeof enrichment;
  graph: typeof graph;
}> = anyApi as never;

export const api: FilterApi<
  typeof fullApi,
  FunctionReference<"query" | "mutation" | "action", "public">
> = anyApi as never;

export const internal: FilterApi<
  typeof fullApi,
  FunctionReference<"query" | "mutation" | "action", "internal">
> = anyApi as never;
