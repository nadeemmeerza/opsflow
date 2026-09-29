import { apiSlice } from '../../store/api/apiSlice';

export type TicketStatus =
  | 'open'
  | 'in_progress'
  | 'waiting'
  | 'resolved'
  | 'closed';

export type TicketPriority =
  | 'low'
  | 'medium'
  | 'high'
  | 'urgent';

export type TicketSortBy =
  | 'title'
  | 'status'
  | 'priority'
  | 'createdAt'
  | 'updatedAt';

export type TicketSortOrder =
  | 'asc'
  | 'desc';

export interface TicketCustomer {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
}

export interface TicketProject {
  _id: string;
  name: string;
  key: string;
  status: 'active' | 'archived';
}

export interface TicketAssignee {
  _id: string;
  name: string;
  email: string;
  status: string;
}

export interface Ticket {
  _id: string;
  organizationId: string;

  title: string;
  description: string;

  customerId: string | TicketCustomer;
  projectId: string | TicketProject | null;
  assigneeId: string | TicketAssignee | null;

  createdBy: string;

  status: TicketStatus;
  priority: TicketPriority;

  createdAt: string;
  updatedAt: string;
}

export interface CreateTicketRequest {
  title: string;
  description?: string;
  customerId: string;
  projectId?: string;
  assigneeId?: string;
  priority?: TicketPriority;
}

export interface UpdateTicketRequest {
  title?: string;
  description?: string;
  customerId?: string;
  projectId?: string;
  assigneeId?: string;
  status?: TicketStatus;
  priority?: TicketPriority;
}

/**
 * Pagination information returned by the ticket-list endpoint.
 *
 * The backend calculates these values after applying the
 * organization's filters, search, sorting, and pagination.
 */
export interface TicketPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

/**
 * Query parameters supported by the ticket list.
 *
 * These match TicketQueryDto on the NestJS backend.
 */
export interface TicketQuery {
  page?: number;
  limit?: number;
  search?: string;
  status?: TicketStatus;
  priority?: TicketPriority;
  sortBy?: TicketSortBy;
  sortOrder?: TicketSortOrder;
}

/**
 * Paginated ticket-list response.
 *
 * Unlike getTicket(), the list endpoint now returns
 * items plus pagination metadata.
 */
interface TicketsResponse {
  success: boolean;

  data: {
    items: Ticket[];
    pagination: TicketPagination;
  };

  timestamp: string;
}

interface TicketResponse {
  success: boolean;
  data: Ticket;
  timestamp: string;
}

export const ticketsApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    /**
     * Fetch tickets for an organization.
     *
     * Search, filtering, sorting, and pagination are sent to
     * the backend so the browser does not need to load every
     * ticket before displaying the current page.
     */
    getTickets: builder.query<
      TicketsResponse,
      {
        organizationId: string;
        query?: TicketQuery;
      }
    >({
      query: ({ organizationId, query }) => {
        const params = new URLSearchParams();

        /*
         * Only add parameters that have values.
         * This keeps the generated URL clean and lets the backend
         * apply its own defaults when a parameter is omitted.
         */
        if (query?.page !== undefined) {
          params.set(
            'page',
            String(query.page),
          );
        }

        if (query?.limit !== undefined) {
          params.set(
            'limit',
            String(query.limit),
          );
        }

        if (query?.search?.trim()) {
          params.set(
            'search',
            query.search.trim(),
          );
        }

        if (query?.status) {
          params.set(
            'status',
            query.status,
          );
        }

        if (query?.priority) {
          params.set(
            'priority',
            query.priority,
          );
        }

        if (query?.sortBy) {
          params.set(
            'sortBy',
            query.sortBy,
          );
        }

        if (query?.sortOrder) {
          params.set(
            'sortOrder',
            query.sortOrder,
          );
        }

        const queryString =
          params.toString();

        return `/organizations/${organizationId}/tickets${
          queryString
            ? `?${queryString}`
            : ''
        }`;
      },

      providesTags: (result) =>
        result
          ? [
              ...result.data.items.map(
                (ticket) => ({
                  type: 'Ticket' as const,
                  id: ticket._id,
                }),
              ),

              /*
               * LIST represents the complete ticket collection.
               * Mutations invalidate this tag so the current list
               * can be refreshed after create/update/delete.
               */
              {
                type: 'Ticket' as const,
                id: 'LIST',
              },
            ]
          : [
              {
                type: 'Ticket' as const,
                id: 'LIST',
              },
            ],
    }),

    /**
     * Fetch one ticket by ID.
     *
     * This endpoint is intentionally not paginated because
     * the details/edit pages need one complete ticket.
     */
    getTicket: builder.query<
      TicketResponse,
      {
        organizationId: string;
        ticketId: string;
      }
    >({
      query: ({
        organizationId,
        ticketId,
      }) =>
        `/organizations/${organizationId}/tickets/${ticketId}`,

      providesTags: (
        _result,
        _error,
        { ticketId },
      ) => [
        {
          type: 'Ticket' as const,
          id: ticketId,
        },
      ],
    }),

    /**
     * Create a new ticket.
     */
    createTicket: builder.mutation<
      TicketResponse,
      {
        organizationId: string;
        data: CreateTicketRequest;
      }
    >({
      query: ({
        organizationId,
        data,
      }) => ({
        url: `/organizations/${organizationId}/tickets`,
        method: 'POST',
        body: data,
      }),

      invalidatesTags: [
        {
          type: 'Ticket',
          id: 'LIST',
        },
      ],
    }),

    /**
     * Update an existing ticket.
     *
     * Both the individual ticket and list cache are invalidated
     * because the edit can change fields displayed in either place.
     */
    updateTicket: builder.mutation<
      TicketResponse,
      {
        organizationId: string;
        ticketId: string;
        data: UpdateTicketRequest;
      }
    >({
      query: ({
        organizationId,
        ticketId,
        data,
      }) => ({
        url: `/organizations/${organizationId}/tickets/${ticketId}`,
        method: 'PATCH',
        body: data,
      }),

      invalidatesTags: (
        _result,
        _error,
        { ticketId },
      ) => [
        {
          type: 'Ticket',
          id: ticketId,
        },
        {
          type: 'Ticket',
          id: 'LIST',
        },
      ],
    }),

    /**
     * Delete a ticket.
     *
     * Invalidating LIST ensures the ticket disappears from
     * any cached ticket-list query after deletion.
     */
    deleteTicket: builder.mutation<
      {
        success: boolean;
        message: string;
      },
      {
        organizationId: string;
        ticketId: string;
      }
    >({
      query: ({
        organizationId,
        ticketId,
      }) => ({
        url: `/organizations/${organizationId}/tickets/${ticketId}`,
        method: 'DELETE',
      }),

      invalidatesTags: [
        {
          type: 'Ticket',
          id: 'LIST',
        },
      ],
    }),
  }),
});

export const {
  useGetTicketsQuery,
  useGetTicketQuery,
  useCreateTicketMutation,
  useUpdateTicketMutation,
  useDeleteTicketMutation,
} = ticketsApi;