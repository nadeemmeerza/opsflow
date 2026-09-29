import { apiSlice } from '@/store/api/apiSlice';

export type ProjectStatus =
  | 'active'
  | 'archived';

export type ProjectSortBy =
  | 'name'
  | 'key'
  | 'createdAt'
  | 'updatedAt'
  | 'status';

export type ProjectSortOrder =
  | 'asc'
  | 'desc';

export interface Project {
  _id: string;
  name: string;
  key: string;
  description: string;
  organizationId: string;
  createdBy: string;
  status: ProjectStatus;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ProjectsResponse {
  success: boolean;
  data: {
    items: Project[];
    pagination: ProjectPagination;
  };
  timestamp: string;
}

interface ProjectResponse {
  success: boolean;
  data: Project;
  timestamp: string;
}

export interface ProjectQuery {
  page?: number;
  limit?: number;
  search?: string;
  status?: ProjectStatus;
  sortBy?: ProjectSortBy;
  sortOrder?: ProjectSortOrder;
}

export interface CreateProjectRequest {
  name: string;
  key: string;
  description?: string;
}

export interface UpdateProjectRequest {
  name?: string;
  key?: string;
  description?: string;
  status?: ProjectStatus;
}

export const projectsApi =
  apiSlice.injectEndpoints({
    endpoints: (builder) => ({
      getProjects: builder.query<
        ProjectsResponse,
        {
          organizationId: string;
          query?: ProjectQuery;
        }
      >({
        query: ({
          organizationId,
          query = {},
        }) => {
          const params =
            new URLSearchParams();

          if (query.page) {
            params.set(
              'page',
              String(query.page),
            );
          }

          if (query.limit) {
            params.set(
              'limit',
              String(query.limit),
            );
          }

          if (query.search?.trim()) {
            params.set(
              'search',
              query.search.trim(),
            );
          }

          if (query.status) {
            params.set(
              'status',
              query.status,
            );
          }

          if (query.sortBy) {
            params.set(
              'sortBy',
              query.sortBy,
            );
          }

          if (query.sortOrder) {
            params.set(
              'sortOrder',
              query.sortOrder,
            );
          }

          const queryString =
            params.toString();

          return `/organizations/${organizationId}/projects${
            queryString
              ? `?${queryString}`
              : ''
          }`;
        },

        providesTags: ['Project'],
      }),

      getProject: builder.query<
        ProjectResponse,
        {
          organizationId: string;
          projectId: string;
        }
      >({
        query: ({
          organizationId,
          projectId,
        }) =>
          `/organizations/${organizationId}/projects/${projectId}`,

        providesTags: ['Project'],
      }),

      createProject: builder.mutation<
        ProjectResponse,
        {
          organizationId: string;
          data: CreateProjectRequest;
        }
      >({
        query: ({
          organizationId,
          data,
        }) => ({
          url: `/organizations/${organizationId}/projects`,
          method: 'POST',
          body: data,
        }),

        invalidatesTags: ['Project'],
      }),

      updateProject: builder.mutation<
        ProjectResponse,
        {
          organizationId: string;
          projectId: string;
          data: UpdateProjectRequest;
        }
      >({
        query: ({
          organizationId,
          projectId,
          data,
        }) => ({
          url: `/organizations/${organizationId}/projects/${projectId}`,
          method: 'PATCH',
          body: data,
        }),

        invalidatesTags: ['Project'],
      }),

      deleteProject: builder.mutation<
        unknown,
        {
          organizationId: string;
          projectId: string;
        }
      >({
        query: ({
          organizationId,
          projectId,
        }) => ({
          url: `/organizations/${organizationId}/projects/${projectId}`,
          method: 'DELETE',
        }),

        invalidatesTags: ['Project'],
      }),
    }),
  });

export const {
  useGetProjectsQuery,
  useGetProjectQuery,
  useCreateProjectMutation,
  useUpdateProjectMutation,
  useDeleteProjectMutation,
} = projectsApi;