"use client";

import { useState } from "react";

import {
  useCreateCommentMutation,
  useDeleteCommentMutation,
  useGetTicketCommentsQuery,
  useUpdateCommentMutation,
} from "./commentsApi";

import { getApiErrorMessage } from "@/store/api/apiSlice";
import { useNotification } from "@/components/notifications/NotificationContext";

import styles from "./comments-section.module.scss";

interface CommentsSectionProps {
  organizationId: string;
  ticketId: string;
}

export function CommentsSection({
  organizationId,
  ticketId,
}: CommentsSectionProps) {
  const [content, setContent] = useState("");

  // These states control which comment is currently being edited
  // and keep the edited text separate from the original comment.
  const [editingCommentId, setEditingCommentId] = useState<string | null>(
    null,
  );
  const [editingContent, setEditingContent] = useState("");

  // API errors are kept locally so validation messages can be shown
  // directly inside the comments section as well as through a toast.
  const [apiError, setApiError] = useState<string[]>([]);

  const { success, error: showError } = useNotification();

  const {
    data: commentsResponse,
    isLoading,
    isError,
  } = useGetTicketCommentsQuery({
    organizationId,
    ticketId,
  });

  const [createComment, { isLoading: isCreating }] =
    useCreateCommentMutation();

  const [updateComment, { isLoading: isUpdating }] =
    useUpdateCommentMutation();

  const [deleteComment, { isLoading: isDeleting }] =
    useDeleteCommentMutation();

  const comments = commentsResponse?.data ?? [];

  const handleCreate = async () => {
    const trimmedContent = content.trim();

    // Do not send empty comments to the API. This also keeps the UI
    // consistent with the backend validation rules.
    if (!trimmedContent) {
      return;
    }

    setApiError([]);

    try {
      await createComment({
        organizationId,
        data: {
          content: trimmedContent,
          ticketId,
        },
      }).unwrap();

      // The mutation invalidates the ticket's comment cache, so the
      // newly-created comment is automatically fetched by RTK Query.
      setContent("");

      success("Comment added successfully.");
    } catch (error) {
      console.error("Failed to create comment:", error);

      const messages = getApiErrorMessage(error);

      setApiError(messages);
      showError(messages[0]);
    }
  };

  const startEditing = (
    commentId: string,
    currentContent: string,
  ) => {
    setApiError([]);

    setEditingCommentId(commentId);
    setEditingContent(currentContent);
  };

  const cancelEditing = () => {
    // Reset both editing values so another comment can be edited
    // without carrying over the previous comment's content.
    setEditingCommentId(null);
    setEditingContent("");
    setApiError([]);
  };

  const handleUpdate = async (commentId: string) => {
    const trimmedContent = editingContent.trim();

    if (!trimmedContent) {
      return;
    }

    setApiError([]);

    try {
      await updateComment({
        organizationId,
        commentId,
        data: {
          content: trimmedContent,
        },
      }).unwrap();

      cancelEditing();

      success("Comment updated successfully.");
    } catch (error) {
      console.error("Failed to update comment:", error);

      const messages = getApiErrorMessage(error);

      setApiError(messages);
      showError(messages[0]);
    }
  };

  const handleDelete = async (commentId: string) => {
    // Deleting is destructive, so the user gets one explicit
    // confirmation before the API request is sent.
    const confirmed = window.confirm(
      "Are you sure you want to delete this comment?",
    );

    if (!confirmed) {
      return;
    }

    setApiError([]);

    try {
      await deleteComment({
        organizationId,
        commentId,
      }).unwrap();

      // If the deleted comment was being edited, leave the edit mode
      // as well so the UI cannot continue editing a removed record.
      if (editingCommentId === commentId) {
        cancelEditing();
      }

      success("Comment deleted successfully.");
    } catch (error) {
      console.error("Failed to delete comment:", error);

      const messages = getApiErrorMessage(error);

      setApiError(messages);
      showError(messages[0]);
    }
  };

  return (
    <section className={styles.section}>
      <div className={styles.header}>
        <div>
          <h2>Comments</h2>

          <p>
            Discuss this ticket with your organization team.
          </p>
        </div>

        <span className={styles.count}>
          {comments.length}
        </span>
      </div>

      {/* Display backend validation/business errors directly in the
          component so the user can see the problem even after the toast disappears. */}
      {apiError.length > 0 && (
        <div className={`${styles.state} ${styles.error}`}>
          {apiError.map((message, index) => (
            <p key={`${message}-${index}`}>{message}</p>
          ))}
        </div>
      )}

      <div className={styles.addComment}>
        <textarea
          value={content}
          onChange={(event) => {
            setContent(event.target.value);

            // Remove an old API error once the user starts correcting
            // the value that caused the previous submission to fail.
            if (apiError.length > 0) {
              setApiError([]);
            }
          }}
          placeholder="Write a comment..."
          maxLength={5000}
          rows={4}
          disabled={isCreating}
        />

        <div className={styles.formFooter}>
          <span>{content.length}/5000</span>

          <button
            type="button"
            onClick={handleCreate}
            disabled={isCreating || !content.trim()}
          >
            {isCreating ? "Posting..." : "Add Comment"}
          </button>
        </div>
      </div>

      {isLoading && (
        <div className={styles.state}>
          Loading comments...
        </div>
      )}

      {isError && (
        <div className={`${styles.state} ${styles.error}`}>
          Failed to load comments.
        </div>
      )}

      {!isLoading && !isError && comments.length === 0 && (
        <div className={styles.empty}>
          <h3>No comments yet</h3>

          <p>
            Start the conversation by adding the first comment.
          </p>
        </div>
      )}

      {!isLoading && !isError && comments.length > 0 && (
        <div className={styles.commentList}>
          {comments.map((comment) => {
            const author =
              typeof comment.authorId === "object"
                ? comment.authorId
                : null;

            const isEditing =
              editingCommentId === comment._id;

            return (
              <article
                key={comment._id}
                className={styles.comment}
              >
                <div className={styles.commentHeader}>
                  <div>
                    <strong>
                      {author?.name ?? "Unknown user"}
                    </strong>

                    {author?.email && (
                      <span>{author.email}</span>
                    )}
                  </div>

                  <time dateTime={comment.createdAt}>
                    {new Date(
                      comment.createdAt,
                    ).toLocaleString()}
                  </time>
                </div>

                {isEditing ? (
                  <div className={styles.editArea}>
                    <textarea
                      value={editingContent}
                      onChange={(event) => {
                        setEditingContent(event.target.value);

                        if (apiError.length > 0) {
                          setApiError([]);
                        }
                      }}
                      maxLength={5000}
                      rows={4}
                      disabled={isUpdating}
                    />

                    <div className={styles.editActions}>
                      <button
                        type="button"
                        className={styles.secondaryButton}
                        onClick={cancelEditing}
                        disabled={isUpdating}
                      >
                        Cancel
                      </button>

                      <button
                        type="button"
                        className={styles.primaryButton}
                        onClick={() =>
                          handleUpdate(comment._id)
                        }
                        disabled={
                          isUpdating ||
                          !editingContent.trim()
                        }
                      >
                        {isUpdating
                          ? "Saving..."
                          : "Save"}
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <p className={styles.content}>
                      {comment.content}
                    </p>

                    <div className={styles.actions}>
                      <button
                        type="button"
                        onClick={() =>
                          startEditing(
                            comment._id,
                            comment.content,
                          )
                        }
                      >
                        Edit
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          handleDelete(comment._id)
                        }
                        disabled={isDeleting}
                      >
                        Delete
                      </button>
                    </div>
                  </>
                )}
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
