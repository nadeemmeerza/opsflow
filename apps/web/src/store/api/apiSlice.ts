import {
  createApi,
  fetchBaseQuery,
} from "@reduxjs/toolkit/query/react";

import type {
  BaseQueryFn,
  FetchArgs,
  FetchBaseQueryError,
} from "@reduxjs/toolkit/query";

import type { RootState } from "../store";
import { logout } from "../auth/authSlice";

/*
 * Standard API error structure returned by the OpsFlow backend.
 *
 * Keeping this type centralized allows forms and feature components
 * to display backend validation errors consistently.
 */
export interface ApiErrorResponse {
  success: false;
  statusCode: number;
  message: string;
  errors?: string[];
  path?: string;
  timestamp?: string;
}

/*
 * Converts different RTK Query / backend error formats into
 * a predictable array of human-readable messages.
 *
 * Feature components can therefore use:
 *
 * const messages = getApiErrorMessage(error);
 */
export function getApiErrorMessage(
  error: unknown,
): string[] {
  if (!error || typeof error !== "object") {
    return ["Something went wrong."];
  }

  const apiError = error as {
    data?: ApiErrorResponse;
    error?: string;
  };

  /*
   * Backend validation errors take priority because they
   * usually contain the most specific information.
   */
  if (
    apiError.data?.errors &&
    apiError.data.errors.length > 0
  ) {
    return apiError.data.errors;
  }

  /*
   * Fall back to the backend's main error message.
   */
  if (apiError.data?.message) {
    return [apiError.data.message];
  }

  /*
   * RTK Query may provide a lower-level error string when
   * the request fails before receiving a normal API response.
   */
  if (apiError.error) {
    return [apiError.error];
  }

  return ["Something went wrong."];
}

/*
 * Base RTK Query request configuration.
 *
 * The API URL comes from the environment so the same frontend
 * code can communicate with different API environments.
 */
const baseQuery = fetchBaseQuery({
  baseUrl:
    process.env.NEXT_PUBLIC_API_URL,

  /*
   * Attach the current JWT access token to every API request.
   */
  prepareHeaders: (
    headers,
    { getState },
  ) => {
    const token = (
      getState() as RootState
    ).auth.accessToken;

    if (token) {
      headers.set(
        "authorization",
        `Bearer ${token}`,
      );
    }

    /*
     * OpsFlow APIs receive JSON request bodies.
     */
    headers.set(
      "Content-Type",
      "application/json",
    );

    return headers;
  },
});

/*
 * Wrapper around the normal RTK Query base query.
 *
 * This is the centralized place where API-level authentication
 * failures are handled instead of duplicating the same logic
 * across every feature API.
 */
const baseQueryWithErrorHandling: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (
  args,
  api,
  extraOptions,
) => {
  const result = await baseQuery(
    args,
    api,
    extraOptions,
  );

  /*
   * Handle errors centrally so all RTK Query endpoints receive
   * the same authentication and logging behavior.
   */
  if (result.error) {
    console.error(
      "API Error:",
      result.error,
    );

    /*
     * HTTP 401 means the access token is no longer accepted.
     *
     * Clear the authentication state and persisted credentials.
     */
    if (result.error.status === 401) {
      api.dispatch(logout());

      /*
       * RTK Query operates outside React components, so we cannot
       * use Next.js's useRouter() hook here.
       *
       * The browser navigation is intentionally performed at this
       * infrastructure layer after the authentication state has
       * been cleared.
       *
       * eslint-disable-next-line is intentionally limited to this
       * single navigation statement because Next.js's rule prefers
       * React navigation APIs that are not available in this module.
       */
      if (typeof window !== "undefined") {
        // eslint-disable-next-line @next/next/no-location-assign-relative-destination
        window.location.href = "/login";
      }
    }
  }

  return result;
};

/*
 * Central RTK Query API definition for OpsFlow.
 *
 * Individual feature API files inject their endpoints into this
 * shared API instance so authentication, caching, and error
 * handling remain consistent across the application.
 */
export const apiSlice = createApi({
  reducerPath: "api",

  baseQuery:
    baseQueryWithErrorHandling,

  /*
   * Tag types control RTK Query's cache invalidation system.
   */
  tagTypes: [
    "Auth",
    "Organization",
    "Member",
    "Project",
    "Task",
    "Customer",
    "Ticket",
    "Comment",
    "Audit",
  ],

  /*
   * Endpoints are injected by individual feature API modules.
   */
  endpoints: () => ({}),
});