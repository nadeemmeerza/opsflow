import { apiSlice } from '@/store/api/apiSlice';

export type CustomerStatus =
  | 'active'
  | 'inactive';

export type CustomerSortBy =
  | 'name'
  | 'email'
  | 'company'
  | 'status'
  | 'createdAt'
  | 'updatedAt';

export type CustomerSortOrder =
  | 'asc'
  | 'desc';

export interface Customer {
  _id: string;
  organizationId: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  // address?: string;
  notes?: string;
  status: CustomerStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CustomerPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface CustomersResponse {
  success: boolean;

  data: {
    items: Customer[];
    pagination: CustomerPagination;
  };

  timestamp: string;
}

interface CustomerResponse {
  success: boolean;
  data: Customer;
  timestamp: string;
}

/**
 * Query options used by the customer list.
 *
 * These values are converted into URL query parameters
 * and processed server-side by the NestJS API.
 */
export interface CustomerQuery {
  page?: number;
  limit?: number;
  search?: string;
  status?: CustomerStatus;
  sortBy?: CustomerSortBy;
  sortOrder?: CustomerSortOrder;
}

export interface CreateCustomerRequest {
  name: string;
  email: string;
  phone?: string;
  company?: string;
  // address?: string;
  notes?: string;
}

export interface UpdateCustomerRequest {
  name?: string;
  email?: string;
  phone?: string;
  company?: string;
  // address?: string;
  notes?: string;
  status?: CustomerStatus;
}

export const customersApi =
  apiSlice.injectEndpoints({
    endpoints: (builder) => ({
      /**
       * Retrieves customers using server-side
       * search, filtering, sorting, and pagination.
       */
      getCustomers: builder.query<
        CustomersResponse,
        {
          organizationId: string;
          query?: CustomerQuery;
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

          return `/organizations/${organizationId}/customers${
            queryString
              ? `?${queryString}`
              : ''
          }`;
        },

        providesTags: ['Customer'],
      }),

      getCustomer: builder.query<
        CustomerResponse,
        {
          organizationId: string;
          customerId: string;
        }
      >({
        query: ({
          organizationId,
          customerId,
        }) =>
          `/organizations/${organizationId}/customers/${customerId}`,

        providesTags: ['Customer'],
      }),

      createCustomer: builder.mutation<
        CustomerResponse,
        {
          organizationId: string;
          data: CreateCustomerRequest;
        }
      >({
        query: ({
          organizationId,
          data,
        }) => ({
          url: `/organizations/${organizationId}/customers`,
          method: 'POST',
          body: data,
        }),

        invalidatesTags: ['Customer'],
      }),

      updateCustomer: builder.mutation<
        CustomerResponse,
        {
          organizationId: string;
          customerId: string;
          data: UpdateCustomerRequest;
        }
      >({
        query: ({
          organizationId,
          customerId,
          data,
        }) => ({
          url: `/organizations/${organizationId}/customers/${customerId}`,
          method: 'PATCH',
          body: data,
        }),

        invalidatesTags: ['Customer'],
      }),

      deleteCustomer: builder.mutation<
        unknown,
        {
          organizationId: string;
          customerId: string;
        }
      >({
        query: ({
          organizationId,
          customerId,
        }) => ({
          url: `/organizations/${organizationId}/customers/${customerId}`,
          method: 'DELETE',
        }),

        invalidatesTags: ['Customer'],
      }),
    }),
  });

export const {
  useGetCustomersQuery,
  useGetCustomerQuery,
  useCreateCustomerMutation,
  useUpdateCustomerMutation,
  useDeleteCustomerMutation,
} = customersApi;