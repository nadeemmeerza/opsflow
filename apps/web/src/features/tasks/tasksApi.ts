import { apiSlice } from '@/store/api/apiSlice';

export type TaskStatus =
  | 'todo'
  | 'in_progress'
  | 'review'
  | 'done';

export type TaskPriority =
  | 'low'
  | 'medium'
  | 'high'
  | 'urgent';

export type TaskSortBy =
  | 'title'
  | 'status'
  | 'priority'
  | 'dueDate'
  | 'createdAt'
  | 'updatedAt';

export type TaskSortOrder =
  | 'asc'
  | 'desc';

export interface TaskAssignee {
  _id: string;
  name: string;
  email: string;
  status: string;
}

export interface Task {
  _id: string;
  title: string;
  description: string;
  projectId: string;
  organizationId: string;
  createdBy: string;
  assigneeId: string | TaskAssignee | null;
  priority: TaskPriority;
  status: TaskStatus;
  dueDate: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Pagination information returned by the Tasks API.
 *
 * Keeping this type here makes the frontend contract explicit and
 * allows the Tasks page to render pagination without knowing
 * anything about the backend implementation.
 */
export interface TaskPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface TasksResponse {
  success: boolean;

  data: {
    items: Task[];
    pagination: TaskPagination;
  };

  timestamp: string;
}

interface TaskResponse {
  success: boolean;
  data: Task;
  timestamp: string;
}

/**
 * Query parameters supported by the server-side task listing API.
 */
export interface TaskQuery {
  page?: number;
  limit?: number;
  search?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  sortBy?: TaskSortBy;
  sortOrder?: TaskSortOrder;
}

export interface CreateTaskRequest {
  title: string;
  description?: string;
  assigneeId?: string;
  priority?: TaskPriority;
  dueDate?: string;
}

export interface UpdateTaskRequest {
  title?: string;
  description?: string;
  assigneeId?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  dueDate?: string;
}

export const tasksApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    /**
     * Fetch tasks using server-side search, filtering,
     * sorting, and pagination.
     */
    getTasks: builder.query<
      TasksResponse,
      {
        organizationId: string;
        projectId: string;
        query?: TaskQuery;
      }
    >({
      query: ({
        organizationId,
        projectId,
        query = {},
      }) => {
        const params = new URLSearchParams();

        if (query.page) {
          params.set('page', String(query.page));
        }

        if (query.limit) {
          params.set('limit', String(query.limit));
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

        if (query.priority) {
          params.set(
            'priority',
            query.priority,
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

        const queryString = params.toString();

        return `/organizations/${organizationId}/projects/${projectId}/tasks${
          queryString
            ? `?${queryString}`
            : ''
        }`;
      },

      providesTags: ['Task'],
    }),

    getTask: builder.query<
      TaskResponse,
      {
        organizationId: string;
        projectId: string;
        taskId: string;
      }
    >({
      query: ({
        organizationId,
        projectId,
        taskId,
      }) =>
        `/organizations/${organizationId}/projects/${projectId}/tasks/${taskId}`,

      providesTags: ['Task'],
    }),

    createTask: builder.mutation<
      TaskResponse,
      {
        organizationId: string;
        projectId: string;
        data: CreateTaskRequest;
      }
    >({
      query: ({
        organizationId,
        projectId,
        data,
      }) => ({
        url: `/organizations/${organizationId}/projects/${projectId}/tasks`,
        method: 'POST',
        body: data,
      }),

      invalidatesTags: ['Task'],
    }),

    updateTask: builder.mutation<
      TaskResponse,
      {
        organizationId: string;
        projectId: string;
        taskId: string;
        data: UpdateTaskRequest;
      }
    >({
      query: ({
        organizationId,
        projectId,
        taskId,
        data,
      }) => ({
        url: `/organizations/${organizationId}/projects/${projectId}/tasks/${taskId}`,
        method: 'PATCH',
        body: data,
      }),

      invalidatesTags: ['Task'],
    }),

    deleteTask: builder.mutation<
      unknown,
      {
        organizationId: string;
        projectId: string;
        taskId: string;
      }
    >({
      query: ({
        organizationId,
        projectId,
        taskId,
      }) => ({
        url: `/organizations/${organizationId}/projects/${projectId}/tasks/${taskId}`,
        method: 'DELETE',
      }),

      invalidatesTags: ['Task'],
    }),
  }),
});

export const {
  useGetTasksQuery,
  useGetTaskQuery,
  useCreateTaskMutation,
  useUpdateTaskMutation,
  useDeleteTaskMutation,
} = tasksApi;