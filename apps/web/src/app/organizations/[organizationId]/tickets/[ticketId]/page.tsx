"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";

import {
  useDeleteTicketMutation,
  useGetTicketQuery,
} from "@/features/tickets/ticketsApi";

import { useNotification } from "@/components/notifications/NotificationContext";
import { getApiErrorMessage } from "@/store/api/apiSlice";

import styles from "./ticket-details.module.scss";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { AppShell } from "@/components/layout/AppShell/AppShell";
import { CommentsSection } from "@/features/comments/CommentsSection";

export default function TicketDetailsPage() {
  const params = useParams();
  const router = useRouter();

  const {
    success,
    error: showError,
  } = useNotification();

  // Both IDs come from the dynamic organization/ticket route.
  // They are required for every ticket API request on this page.
  const organizationId =
    params.organizationId as string;

  const ticketId =
    params.ticketId as string;

  /*
   * Fetch one ticket.
   *
   * This endpoint is intentionally separate from the paginated
   * ticket-list endpoint. Pagination only affects the Tickets list page.
   */
  const {
    data: ticketResponse,
    isLoading,
    isError,
  } = useGetTicketQuery({
    organizationId,
    ticketId,
  });

  /*
   * Delete is kept as a mutation here because the details page
   * owns the destructive action for the currently viewed ticket.
   */
  const [
    deleteTicket,
    { isLoading: isDeleting },
  ] = useDeleteTicketMutation();

  const ticket = ticketResponse?.data;

  /*
   * Delete the current ticket after explicit user confirmation.
   *
   * RTK Query invalidates the ticket LIST tag after a successful
   * deletion, so the ticket list will fetch fresh data when visited.
   */
  const handleDelete = async () => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this ticket?",
    );

    if (!confirmed) {
      return;
    }

    try {
      await deleteTicket({
        organizationId,
        ticketId,
      }).unwrap();

      success(
        "Ticket deleted successfully.",
      );

      // Return the user to the organization ticket list.
      router.push(
        `/organizations/${organizationId}/tickets`,
      );
    } catch (error) {
      const messages =
        getApiErrorMessage(error);

      console.error(
        "Failed to delete ticket:",
        error,
      );

      showError(
        messages[0] ??
          "Failed to delete ticket.",
      );
    }
  };

  // Keep the loading state inside the protected application shell
  // so the page does not visually jump between different layouts.
  if (isLoading) {
    return (
      <ProtectedRoute>
        <AppShell>
          <div className={styles.state}>
            Loading ticket...
          </div>
        </AppShell>
      </ProtectedRoute>
    );
  }

  // A missing ticket is treated as a failed details lookup.
  if (isError || !ticket) {
    return (
      <ProtectedRoute>
        <AppShell>
          <div
            className={`${styles.state} ${styles.error}`}
          >
            Failed to load ticket.
          </div>
        </AppShell>
      </ProtectedRoute>
    );
  }

  /*
   * The backend populates customer, project, and assignee when
   * returning a ticket. These checks safely handle both populated
   * objects and raw MongoDB IDs.
   */
  const customer =
    typeof ticket.customerId === "object"
      ? ticket.customerId
      : null;

  const project =
    typeof ticket.projectId === "object"
      ? ticket.projectId
      : null;

  const assignee =
    typeof ticket.assigneeId === "object"
      ? ticket.assigneeId
      : null;

  return (
    <ProtectedRoute>
      <AppShell>
        <div className={styles.page}>
          <div className={styles.header}>
            <div>
              <Link
                href={`/organizations/${organizationId}/tickets`}
                className={styles.backLink}
              >
                ← Back to Tickets
              </Link>

              <h1>{ticket.title}</h1>

              {/* Status and priority provide the primary ticket state at a glance. */}
              <div className={styles.badges}>
                <span
                  className={`${styles.badge} ${styles[`status_${ticket.status}`]}`}
                >
                  {ticket.status.replace(
                    "_",
                    " ",
                  )}
                </span>

                <span
                  className={`${styles.badge} ${styles[`priority_${ticket.priority}`]}`}
                >
                  {ticket.priority}
                </span>
              </div>
            </div>

            <div className={styles.actions}>
              {/* Editing remains a separate route so the details page stays read-focused. */}
              <Link
                href={`/organizations/${organizationId}/tickets/${ticketId}/edit`}
                className={styles.editButton}
              >
                Edit Ticket
              </Link>

              <button
                type="button"
                className={styles.deleteButton}
                disabled={isDeleting}
                onClick={handleDelete}
              >
                {isDeleting
                  ? "Deleting..."
                  : "Delete"}
              </button>
            </div>
          </div>

          <div className={styles.grid}>
            <section className={styles.card}>
              <h2>Description</h2>

              <p className={styles.description}>
                {ticket.description ||
                  "No description provided."}
              </p>
            </section>

            <section className={styles.card}>
              <h2>Ticket Information</h2>

              <div className={styles.details}>
                <div>
                  <span className={styles.label}>
                    Status
                  </span>

                  <span>
                    {ticket.status.replace(
                      "_",
                      " ",
                    )}
                  </span>
                </div>

                <div>
                  <span className={styles.label}>
                    Priority
                  </span>

                  <span>
                    {ticket.priority}
                  </span>
                </div>

                <div>
                  <span className={styles.label}>
                    Created
                  </span>

                  <span>
                    {new Date(
                      ticket.createdAt,
                    ).toLocaleString()}
                  </span>
                </div>

                <div>
                  <span className={styles.label}>
                    Updated
                  </span>

                  <span>
                    {new Date(
                      ticket.updatedAt,
                    ).toLocaleString()}
                  </span>
                </div>
              </div>
            </section>

            {/* Comments are loaded independently so the ticket details
                and discussion history remain separate concerns. */}
            <CommentsSection
              organizationId={organizationId}
              ticketId={ticketId}
            />

            <section className={styles.card}>
              <h2>Customer</h2>

              {customer ? (
                <div className={styles.details}>
                  <div>
                    <span className={styles.label}>
                      Name
                    </span>

                    <span>
                      {customer.name}
                    </span>
                  </div>

                  <div>
                    <span className={styles.label}>
                      Email
                    </span>

                    <span>
                      {customer.email}
                    </span>
                  </div>

                  <div>
                    <span className={styles.label}>
                      Phone
                    </span>

                    <span>
                      {customer.phone ||
                        "—"}
                    </span>
                  </div>

                  <div>
                    <span className={styles.label}>
                      Company
                    </span>

                    <span>
                      {customer.company ||
                        "—"}
                    </span>
                  </div>
                </div>
              ) : (
                <p>
                  No customer information
                  available.
                </p>
              )}
            </section>

            <section className={styles.card}>
              <h2>Project</h2>

              {project ? (
                <div className={styles.details}>
                  <div>
                    <span className={styles.label}>
                      Name
                    </span>

                    <span>
                      {project.name}
                    </span>
                  </div>

                  <div>
                    <span className={styles.label}>
                      Key
                    </span>

                    <span>
                      {project.key}
                    </span>
                  </div>

                  <div>
                    <span className={styles.label}>
                      Status
                    </span>

                    <span>
                      {project.status}
                    </span>
                  </div>
                </div>
              ) : (
                <p>
                  No project assigned.
                </p>
              )}
            </section>

            <section className={styles.card}>
              <h2>Assignee</h2>

              {assignee ? (
                <div className={styles.details}>
                  <div>
                    <span className={styles.label}>
                      Name
                    </span>

                    <span>
                      {assignee.name}
                    </span>
                  </div>

                  <div>
                    <span className={styles.label}>
                      Email
                    </span>

                    <span>
                      {assignee.email}
                    </span>
                  </div>

                  <div>
                    <span className={styles.label}>
                      Status
                    </span>

                    <span>
                      {assignee.status}
                    </span>
                  </div>
                </div>
              ) : (
                <p>Unassigned</p>
              )}
            </section>
          </div>
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}