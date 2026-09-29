import { apiSlice } from '@/store/api/apiSlice';

/**
 * Represents the aggregated operational statistics
 * returned by the organization dashboard endpoint.
 *
 * The backend calculates these values so that the frontend
 * remains responsible only for presentation.
 */
export interface DashboardStats {
  projects: {
    total: number;
    active: number;
    archived: number;
  };

  tasks: {
    total: number;
    todo: number;
    inProgress: number;
    review: number;
    done: number;
  };

  customers: {
    total: number;
    active: number;
    inactive: number;
  };

  tickets: {
    total: number;
    open: number;
    inProgress: number;
    waiting: number;
    resolved: number;
    closed: number;
  };

  /**
   * Number of tasks whose due date has passed
   * and which are still considered incomplete.
   */
  overdueTasks: number;
}

/**
 * Standard response wrapper returned by the NestJS API.
 *
 * Keeping this shape aligned with the global API response
 * makes RTK Query responses predictable throughout the app.
 */
interface DashboardResponse {
  success: boolean;
  data: DashboardStats;
  timestamp: string;
}

/**
 * Organization dashboard API.
 *
 * This endpoint is scoped to a single organization. The
 * organizationId comes from the dynamic organization route:
 *
 * /organizations/[organizationId]/dashboard
 *
 * Business calculations remain in the backend; this API layer
 * only describes how the frontend retrieves the data.
 */
export const dashboardApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getDashboard: builder.query<
      DashboardResponse,
      string
    >({
      /**
       * organizationId is supplied by the organization dashboard
       * page and inserted into the NestJS API route.
       */
      query: (organizationId) =>
        `/organizations/${organizationId}/dashboard`,
    }),
  }),
});

/**
 * RTK Query hook used by the organization dashboard page
 * to load and automatically track dashboard data.
 */
export const {
  useGetDashboardQuery,
} = dashboardApi;