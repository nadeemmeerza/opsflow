import { apiSlice } from "@/store/api/apiSlice";

/* =========================================================
   Organization Types
   ========================================================= */

export type OrganizationStatus = "active" | "suspended";

export type OrganizationSortBy =
  | "name"
  | "slug"
  | "status"
  | "createdAt"
  | "updatedAt";

export type OrganizationSortOrder = "asc" | "desc";

export interface Organization {
  _id: string;
  name: string;
  slug: string;
  status: OrganizationStatus;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
}

/* =========================================================
   Organization Member Types
   ========================================================= */

export type OrganizationRole = "owner" | "admin" | "member";

export interface OrganizationMemberUser {
  id: string;
  name: string;
  email: string;
}

export interface OrganizationMember {
  _id: string;
  organizationId: string;
  userId: string;
  role: OrganizationRole;
  createdAt: string;
  updatedAt: string;
  user?: OrganizationMemberUser;
}

/* =========================================================
   Organization Query Types
   ========================================================= */

/**
 * Pagination metadata returned by the backend.
 */
export interface OrganizationPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

/**
 * Query parameters supported by OrganizationQueryDto
 * on the NestJS backend.
 */
export interface OrganizationQuery {
  page?: number;
  limit?: number;
  search?: string;
  status?: OrganizationStatus;
  sortBy?: OrganizationSortBy;
  sortOrder?: OrganizationSortOrder;
}

/* =========================================================
   Member Query Types
   ========================================================= */

/**
 * Fields supported by the backend when sorting members.
 *
 * The backend maps name/email to the populated user's
 * fields and role/createdAt to membership fields.
 */
export type MemberSortBy = "name" | "email" | "role" | "createdAt";

export type MemberSortOrder = "asc" | "desc";

/**
 * Query parameters supported by MemberQueryDto
 * on the NestJS backend.
 *
 * Keeping these types here prevents the frontend from
 * sending unsupported query values.
 */
export interface MemberQuery {
  page?: number;
  limit?: number;
  search?: string;
  role?: OrganizationRole;
  sortBy?: MemberSortBy;
  sortOrder?: MemberSortOrder;
}

/**
 * Pagination metadata returned by the member endpoint.
 */
export interface MemberPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

/* =========================================================
   API Response Types
   ========================================================= */

interface OrganizationsResponse {
  success: boolean;

  data: {
    items: Organization[];
    pagination: OrganizationPagination;
  };

  timestamp: string;
}

interface OrganizationResponse {
  success: boolean;
  data: Organization;
  timestamp: string;
}

/**
 * The members endpoint is now paginated.
 *
 * Previously this endpoint returned:
 *   data: OrganizationMember[]
 *
 * It now returns:
 *   data: {
 *     items: OrganizationMember[];
 *     pagination: MemberPagination;
 *   }
 *
 * This matches the new NestJS MemberQueryDto/service.
 */
interface MembersResponse {
  success: boolean;

  data: {
    items: OrganizationMember[];
    pagination: MemberPagination;
  };

  timestamp: string;
}

interface MemberResponse {
  success: boolean;
  data: OrganizationMember;
  timestamp: string;
}

/* =========================================================
   Request Types
   ========================================================= */

interface CreateOrganizationRequest {
  name: string;
  slug: string;
}

interface UpdateOrganizationRequest {
  name?: string;
  slug?: string;
  status?: OrganizationStatus;
}

interface AddMemberRequest {
  email: string;
  role: "admin" | "member";
}

/* =========================================================
   RTK Query API
   ========================================================= */

export const organizationsApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    /* =====================================================
         Organizations
         ===================================================== */

    /**
     * Fetch organizations with server-side
     * search, filtering, sorting, and pagination.
     */
    getOrganizations: builder.query<
      OrganizationsResponse,
      {
        query?: OrganizationQuery;
      }
    >({
      query: ({ query } = {}) => {
        const params = new URLSearchParams();

        /*
         * Only send parameters that have values.
         * The backend applies defaults for omitted values.
         */
        if (query?.page !== undefined) {
          params.set("page", String(query.page));
        }

        if (query?.limit !== undefined) {
          params.set("limit", String(query.limit));
        }

        if (query?.search?.trim()) {
          params.set("search", query.search.trim());
        }

        if (query?.status) {
          params.set("status", query.status);
        }

        if (query?.sortBy) {
          params.set("sortBy", query.sortBy);
        }

        if (query?.sortOrder) {
          params.set("sortOrder", query.sortOrder);
        }

        const queryString = params.toString();

        return `/organizations${queryString ? `?${queryString}` : ""}`;
      },

      providesTags: (result) =>
        result
          ? [
              ...result.data.items.map((organization) => ({
                type: "Organization" as const,
                id: organization._id,
              })),

              {
                type: "Organization" as const,
                id: "LIST",
              },
            ]
          : [
              {
                type: "Organization" as const,
                id: "LIST",
              },
            ],
    }),

    getOrganization: builder.query<OrganizationResponse, string>({
      query: (organizationId) => `/organizations/${organizationId}`,

      providesTags: (_result, _error, organizationId) => [
        {
          type: "Organization" as const,
          id: organizationId,
        },
      ],
    }),

    createOrganization: builder.mutation<
      OrganizationResponse,
      CreateOrganizationRequest
    >({
      query: (body) => ({
        url: "/organizations",
        method: "POST",
        body,
      }),

      invalidatesTags: [
        {
          type: "Organization",
          id: "LIST",
        },
      ],
    }),

    updateOrganization: builder.mutation<
      OrganizationResponse,
      {
        organizationId: string;
        data: UpdateOrganizationRequest;
      }
    >({
      query: ({ organizationId, data }) => ({
        url: `/organizations/${organizationId}`,
        method: "PATCH",
        body: data,
      }),

      invalidatesTags: (_result, _error, { organizationId }) => [
        {
          type: "Organization" as const,
          id: organizationId,
        },

        {
          type: "Organization" as const,
          id: "LIST",
        },
      ],
    }),

    deleteOrganization: builder.mutation<unknown, string>({
      query: (organizationId) => ({
        url: `/organizations/${organizationId}`,
        method: "DELETE",
      }),

      invalidatesTags: [
        {
          type: "Organization",
          id: "LIST",
        },
      ],
    }),

    /* =====================================================
         Organization Members
         ===================================================== */

    /**
     * Fetch organization members using the same
     * server-side query pattern as organizations,
     * projects, tasks, customers, and tickets.
     *
     * The backend now handles:
     * - pagination
     * - search by name/email
     * - role filtering
     * - sorting
     */
    getOrganizationMembers: builder.query<
      MembersResponse,
      {
        organizationId: string;
        query?: MemberQuery;
      }
    >({
      query: ({ organizationId, query }) => {
        const params = new URLSearchParams();

        /*
         * Only include explicitly supplied values.
         * Backend DTO defaults handle the rest.
         */
        if (query?.page !== undefined) {
          params.set("page", String(query.page));
        }

        if (query?.limit !== undefined) {
          params.set("limit", String(query.limit));
        }

        if (query?.search?.trim()) {
          params.set("search", query.search.trim());
        }

        if (query?.role) {
          params.set("role", query.role);
        }

        if (query?.sortBy) {
          params.set("sortBy", query.sortBy);
        }

        if (query?.sortOrder) {
          params.set("sortOrder", query.sortOrder);
        }

        const queryString = params.toString();

        return `/organizations/${organizationId}/members${
          queryString ? `?${queryString}` : ""
        }`;
      },

      /*
       * Member mutations invalidate this tag so that
       * the current member list is automatically refetched
       * after adding or removing a member.
       */
      providesTags: (result, _error, { organizationId }) =>
        result
          ? [
              ...result.data.items.map((member) => ({
                type: "Member" as const,
                id: member._id,
              })),

              {
                type: "Member" as const,
                id: `LIST-${organizationId}`,
              },
            ]
          : [
              {
                type: "Member" as const,
                id: `LIST-${organizationId}`,
              },
            ],
    }),

    /**
     * Add an existing OpsFlow user to an organization.
     *
     * The backend only permits owner/admin users to perform
     * this operation and accepts admin/member as target roles.
     */
    addOrganizationMember: builder.mutation<
      MemberResponse,
      {
        organizationId: string;
        data: AddMemberRequest;
      }
    >({
      query: ({ organizationId, data }) => ({
        url: `/organizations/${organizationId}/members`,
        method: "POST",
        body: data,
      }),

      /*
       * The member list becomes stale after a successful
       * addition, so invalidate the organization-specific
       * member list.
       */
      invalidatesTags: (_result, _error, { organizationId }) => [
        {
          type: "Member",
          id: `LIST-${organizationId}`,
        },
      ],
    }),

    /**
     * Remove a member from an organization.
     *
     * The backend protects the owner from being removed.
     */
    removeOrganizationMember: builder.mutation<
      unknown,
      {
        organizationId: string;
        memberId: string;
      }
    >({
      query: ({ organizationId, memberId }) => ({
        url: `/organizations/${organizationId}/members/${memberId}`,
        method: "DELETE",
      }),

      /*
       * Removing a member changes the current list,
       * therefore refetch the organization-specific list.
       */
      invalidatesTags: (_result, _error, { organizationId, memberId }) => [
        {
          type: "Member",
          id: memberId,
        },

        {
          type: "Member",
          id: `LIST-${organizationId}`,
        },
      ],
    }),

    /**
     * Change the role of an existing organization member.
     *
     * Owner/admin authorization is enforced by the NestJS backend.
     */
    updateOrganizationMemberRole: builder.mutation<
      MemberResponse,
      {
        organizationId: string;
        memberId: string;
        role: "admin" | "member";
      }
    >({
      query: ({ organizationId, memberId, role }) => ({
        url: `/organizations/${organizationId}/members/${memberId}/role`,
        method: "PATCH",
        body: {
          role,
        },
      }),

      // Refresh the member list after a successful role change.
      invalidatesTags: (_result, _error, { organizationId, memberId }) => [
        {
          type: "Member",
          id: memberId,
        },
        {
          type: "Member",
          id: `LIST-${organizationId}`,
        },
      ],
    }),

    
  }),
});

/* =========================================================
   Generated Hooks
   ========================================================= */

export const {
  // Organizations
  useGetOrganizationsQuery,
  useGetOrganizationQuery,
  useCreateOrganizationMutation,
  useUpdateOrganizationMutation,
  useDeleteOrganizationMutation,

  // Members
  useGetOrganizationMembersQuery,
  useAddOrganizationMemberMutation,
  useRemoveOrganizationMemberMutation,

  // Member Role
  useUpdateOrganizationMemberRoleMutation,
} = organizationsApi;
