import { apiSlice } from "../../store/api/apiSlice";

export interface CommentAuthor {
  _id: string;
  name: string;
  email: string;
  status: string;
}

export interface Comment {
  _id: string;
  organizationId: string;
  authorId: string | CommentAuthor;
  ticketId: string | null;
  taskId: string | null;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCommentRequest {
  content: string;
  ticketId?: string;
  taskId?: string;
}

export interface UpdateCommentRequest {
  content: string;
}

interface CommentsResponse {
  success: boolean;
  data: Comment[];
  timestamp: string;
}

interface CommentResponse {
  success: boolean;
  data: Comment;
  timestamp: string;
}

interface DeleteCommentResponse {
  success: boolean;
  data: {
    success: boolean;
    message: string;
  };
  timestamp: string;
}

export const commentsApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getTicketComments: builder.query<
      CommentsResponse,
      {
        organizationId: string;
        ticketId: string;
      }
    >({
      query: ({ organizationId, ticketId }) =>
        `/organizations/${organizationId}/comments/ticket/${ticketId}`,

      /*
       * Each comment gets its own cache tag, while the ticket also gets
       * a collection-level tag. Mutations can therefore invalidate either
       * one specific comment or the complete comment list for a ticket.
       */
      providesTags: (result, _error, { ticketId }) =>
        result
          ? [
              ...result.data.map((comment) => ({
                type: "Comment" as const,
                id: comment._id,
              })),
              {
                type: "Comment" as const,
                id: `TICKET-${ticketId}`,
              },
            ]
          : [
              {
                type: "Comment" as const,
                id: `TICKET-${ticketId}`,
              },
            ],
    }),

    createComment: builder.mutation<
      CommentResponse,
      {
        organizationId: string;
        data: CreateCommentRequest;
      }
    >({
      query: ({ organizationId, data }) => ({
        url: `/organizations/${organizationId}/comments`,
        method: "POST",
        body: data,
      }),

      /*
       * Creating a ticket comment changes the ticket's comment collection.
       * Invalidating the collection tag makes RTK Query refetch the list,
       * so the new comment appears without manually modifying component state.
       */
      invalidatesTags: (_result, _error, { data }) => {
        if (data.ticketId) {
          return [
            {
              type: "Comment" as const,
              id: `TICKET-${data.ticketId}`,
            },
          ];
        }

        return [];
      },
    }),

    updateComment: builder.mutation<
      CommentResponse,
      {
        organizationId: string;
        commentId: string;
        data: UpdateCommentRequest;
      }
    >({
      query: ({ organizationId, commentId, data }) => ({
        url: `/organizations/${organizationId}/comments/${commentId}`,
        method: "PATCH",
        body: data,
      }),

      /*
       * Updating one comment invalidates that comment's cache entry.
       * Because the ticket comment query provides individual comment tags,
       * RTK Query can refresh the affected ticket comment list.
       */
      invalidatesTags: (_result, _error, { commentId }) => [
        {
          type: "Comment" as const,
          id: commentId,
        },
      ],
    }),

    deleteComment: builder.mutation<
      DeleteCommentResponse,
      {
        organizationId: string;
        commentId: string;
      }
    >({
      query: ({ organizationId, commentId }) => ({
        url: `/organizations/${organizationId}/comments/${commentId}`,
        method: "DELETE",
      }),

      /*
       * Deleting a comment invalidates its individual tag. Since the
       * comment was part of the ticket-comments query, RTK Query refetches
       * the affected collection and removes the deleted comment from the UI.
       */
      invalidatesTags: (_result, _error, { commentId }) => [
        {
          type: "Comment" as const,
          id: commentId,
        },
      ],
    }),
  }),
});

export const {
  useGetTicketCommentsQuery,
  useCreateCommentMutation,
  useUpdateCommentMutation,
  useDeleteCommentMutation,
} = commentsApi;
