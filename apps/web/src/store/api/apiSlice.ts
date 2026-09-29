import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

import type {
  BaseQueryFn,
  FetchArgs,
  FetchBaseQueryError,
} from "@reduxjs/toolkit/query";

import type { RootState } from "../store";
import { logout } from "../auth/authSlice";

export interface ApiErrorResponse {
  success: false;
  statusCode: number;
  message: string;
  errors?: string[];
  path?: string;
  timestamp?: string;
}

export function getApiErrorMessage(error: unknown): string[] {
  if (!error || typeof error !== "object") {
    return ["Something went wrong."];
  }

  const apiError = error as {
    data?: ApiErrorResponse;
    error?: string;
  };

  if (apiError.data?.errors && apiError.data.errors.length > 0) {
    return apiError.data.errors;
  }

  if (apiError.data?.message) {
    return [apiError.data.message];
  }

  if (apiError.error) {
    return [apiError.error];
  }

  return ["Something went wrong."];
}

const baseQuery = fetchBaseQuery({
  baseUrl: process.env.NEXT_PUBLIC_API_URL,

  prepareHeaders: (headers, { getState }) => {
    const token = (getState() as RootState).auth.accessToken;

    if (token) {
      headers.set("authorization", `Bearer ${token}`);
    }

    headers.set("Content-Type", "application/json");

    return headers;
  },
});

const baseQueryWithErrorHandling: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, api, extraOptions) => {
  const result = await baseQuery(args, api, extraOptions);

  if (result.error) {
    console.error("API Error:", result.error);

    if (result.error.status === 401) {
      api.dispatch(logout());

      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }
    }
  }

  return result;
};

export const apiSlice = createApi({
  reducerPath: "api",

  baseQuery: baseQueryWithErrorHandling,

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

  endpoints: () => ({}),
});