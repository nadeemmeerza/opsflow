import { apiSlice } from '../../store/api/apiSlice';

export type AuditAction =
  | 'CREATE'
  | 'UPDATE'
  | 'DELETE'
  | 'LOGIN'
  | 'ADD_MEMBER'
  | 'REMOVE_MEMBER'
  | 'CHANGE_ROLE';

export interface AuditUser {
  _id: string;
  name: string;
  email: string;
}

export interface AuditLog {
  _id: string;
  organizationId: string;
  userId: string | AuditUser;
  action: AuditAction;
  entity: string;
  entityId: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

interface AuditLogsResponse {
  success: boolean;
  data: AuditLog[];
  timestamp: string;
}

export const auditApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getAuditLogs: builder.query<
      AuditLogsResponse,
      string
    >({
      query: (organizationId) =>
        `/organizations/${organizationId}/audit-logs`,

      providesTags: ['Audit'],
    }),

    getAuditLogsByEntity: builder.query<
      AuditLogsResponse,
      {
        organizationId: string;
        entity: string;
        entityId: string;
      }
    >({
      query: ({
        organizationId,
        entity,
        entityId,
      }) =>
        `/organizations/${organizationId}/audit-logs/${entity}/${entityId}`,

      providesTags: ['Audit'],
    }),
  }),
});

export const {
  useGetAuditLogsQuery,
  useGetAuditLogsByEntityQuery,
} = auditApi;