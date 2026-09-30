'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';

import {
  useDeleteTicketMutation,
  useGetTicketsQuery,
  type TicketPriority,
  type TicketSortBy,
  type TicketSortOrder,
  type TicketStatus,
} from '@/features/tickets/ticketsApi';

import styles from './tickets.module.scss';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { AppShell } from '@/components/layout/AppShell/AppShell';

export default function TicketsPage() {
  const params = useParams();

  const organizationId =
    params.organizationId as string;

  const [searchInput, setSearchInput] =
    useState('');

  const [search, setSearch] =
    useState('');

  const [status, setStatus] =
    useState<TicketStatus | ''>('');

  const [priority, setPriority] =
    useState<TicketPriority | ''>('');

  const [sortBy, setSortBy] =
    useState<TicketSortBy>('createdAt');

  const [sortOrder, setSortOrder] =
    useState<TicketSortOrder>('desc');

  const [page, setPage] = useState(1);

  const limit = 10;

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 400);

    return () => {
      window.clearTimeout(timer);
    };
  }, [searchInput]);

  const {
    data: ticketsResponse,
    isLoading,
    isFetching,
    isError,
  } = useGetTicketsQuery({
    organizationId,
    query: {
      page,
      limit,
      search: search || undefined,
      status: status || undefined,
      priority: priority || undefined,
      sortBy,
      sortOrder,
    },
  });

  const tickets =
    ticketsResponse?.data.items ?? [];

  const pagination =
    ticketsResponse?.data.pagination;

  const [
    deleteTicket,
    { isLoading: isDeleting },
  ] = useDeleteTicketMutation();

  const handleStatusChange = (
    value: TicketStatus | '',
  ) => {
    setStatus(value);
    setPage(1);
  };

  const handlePriorityChange = (
    value: TicketPriority | '',
  ) => {
    setPriority(value);
    setPage(1);
  };

  const handleSortByChange = (
    value: TicketSortBy,
  ) => {
    setSortBy(value);
    setPage(1);
  };

  const handleSortOrderChange = (
    value: TicketSortOrder,
  ) => {
    setSortOrder(value);
    setPage(1);
  };

  const handleDelete = async (
    ticketId: string,
  ) => {
    const confirmed = window.confirm(
      'Are you sure you want to delete this ticket?',
    );

    if (!confirmed) {
      return;
    }

    try {
      await deleteTicket({
        organizationId,
        ticketId,
      }).unwrap();
    } catch (error) {
      console.error(
        'Failed to delete ticket:',
        error,
      );

      window.alert(
        'Failed to delete ticket.',
      );
    }
  };

  const handlePageChange = (
    nextPage: number,
  ) => {
    if (
      nextPage < 1 ||
      nextPage >
        (pagination?.totalPages ?? 1)
    ) {
      return;
    }

    setPage(nextPage);
  };

  return (
    <ProtectedRoute>
      <AppShell>
        <div className={styles.page}>
          <div className={styles.header}>
            <div>
              <h1>Tickets</h1>

              <p>
                Manage customer support tickets for
                this organization.
              </p>
            </div>

            <Link
              href={`/organizations/${organizationId}/tickets/new`}
              className={styles.createButton}
            >
              + New Ticket
            </Link>
          </div>

          <div className={styles.toolbar}>
            <input
              type="search"
              value={searchInput}
              onChange={(event) =>
                setSearchInput(
                  event.target.value,
                )
              }
              placeholder="Search tickets..."
              className={styles.searchInput}
            />

            <select
              value={status}
              onChange={(event) =>
                handleStatusChange(
                  event.target.value as
                    | TicketStatus
                    | '',
                )
              }
              className={styles.select}
            >
              <option value="">
                All statuses
              </option>

              <option value="open">
                Open
              </option>

              <option value="in_progress">
                In Progress
              </option>

              <option value="waiting">
                Waiting
              </option>

              <option value="resolved">
                Resolved
              </option>

              <option value="closed">
                Closed
              </option>
            </select>

            <select
              value={priority}
              onChange={(event) =>
                handlePriorityChange(
                  event.target.value as
                    | TicketPriority
                    | '',
                )
              }
              className={styles.select}
            >
              <option value="">
                All priorities
              </option>

              <option value="low">
                Low
              </option>

              <option value="medium">
                Medium
              </option>

              <option value="high">
                High
              </option>

              <option value="urgent">
                Urgent
              </option>
            </select>

            <select
              value={sortBy}
              onChange={(event) =>
                handleSortByChange(
                  event.target.value as TicketSortBy,
                )
              }
              className={styles.select}
            >
              <option value="createdAt">
                Created
              </option>

              <option value="updatedAt">
                Updated
              </option>

              <option value="title">
                Title
              </option>

              <option value="status">
                Status
              </option>

              <option value="priority">
                Priority
              </option>
            </select>

            <select
              value={sortOrder}
              onChange={(event) =>
                handleSortOrderChange(
                  event.target.value as TicketSortOrder,
                )
              }
              className={styles.select}
            >
              <option value="desc">
                Descending
              </option>

              <option value="asc">
                Ascending
              </option>
            </select>
          </div>

          {!isLoading &&
            !isError &&
            pagination && (
              <div className={styles.resultBar}>
                <span>
                  {pagination.total}{' '}
                  {pagination.total === 1
                    ? 'ticket'
                    : 'tickets'}
                </span>

                {isFetching && (
                  <span>
                    Updating...
                  </span>
                )}
              </div>
            )}

          {isLoading && (
            <div className={styles.state}>
              Loading tickets...
            </div>
          )}

          {isError && (
            <div
              className={`${styles.state} ${styles.error}`}
            >
              Failed to load tickets.
            </div>
          )}

          {!isLoading &&
            !isError &&
            tickets.length === 0 && (
              <div className={styles.empty}>
                <h2>
                  {search ||
                  status ||
                  priority
                    ? 'No matching tickets'
                    : 'No tickets yet'}
                </h2>

                <p>
                  {search ||
                  status ||
                  priority
                    ? 'Try changing your search or filters.'
                    : 'Create your first support ticket to get started.'}
                </p>

                {!search &&
                  !status &&
                  !priority && (
                    <Link
                      href={`/organizations/${organizationId}/tickets/new`}
                      className={styles.createButton}
                    >
                      Create Ticket
                    </Link>
                  )}
              </div>
            )}

          {!isLoading &&
            !isError &&
            tickets.length > 0 && (
              <>
                <div className={styles.tableWrapper}>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th>Title</th>
                        <th>Customer</th>
                        <th>Project</th>
                        <th>Assignee</th>
                        <th>Status</th>
                        <th>Priority</th>
                        <th>Created</th>
                        <th>Actions</th>
                      </tr>
                    </thead>

                    <tbody>
                      {tickets.map((ticket) => {
                        const customer =
                          typeof ticket.customerId ===
                          'object'
                            ? ticket.customerId
                            : null;

                        const project =
                          typeof ticket.projectId ===
                          'object'
                            ? ticket.projectId
                            : null;

                        const assignee =
                          typeof ticket.assigneeId ===
                          'object'
                            ? ticket.assigneeId
                            : null;

                        return (
                          <tr key={ticket._id}>
                            <td>
                              <Link
                                href={`/organizations/${organizationId}/tickets/${ticket._id}`}
                                className={
                                  styles.ticketTitle
                                }
                              >
                                {ticket.title}
                              </Link>
                            </td>

                            <td>
                              {customer?.name ??
                                '—'}
                            </td>

                            <td>
                              {project
                                ? `${project.key} — ${project.name}`
                                : '—'}
                            </td>

                            <td>
                              {assignee?.name ??
                                'Unassigned'}
                            </td>

                            <td>
                              <span
                                className={`${styles.badge} ${styles[`status_${ticket.status}`]}`}
                              >
                                {ticket.status.replace(
                                  '_',
                                  ' ',
                                )}
                              </span>
                            </td>

                            <td>
                              <span
                                className={`${styles.badge} ${styles[`priority_${ticket.priority}`]}`}
                              >
                                {ticket.priority}
                              </span>
                            </td>

                            <td>
                              {new Date(
                                ticket.createdAt,
                              ).toLocaleDateString()}
                            </td>

                            <td>
                              <div
                                className={
                                  styles.actions
                                }
                              >
                                <Link
                                  href={`/organizations/${organizationId}/tickets/${ticket._id}`}
                                  className={
                                    styles.viewButton
                                  }
                                >
                                  View
                                </Link>

                                <button
                                  type="button"
                                  className={
                                    styles.deleteButton
                                  }
                                  disabled={
                                    isDeleting
                                  }
                                  onClick={() =>
                                    handleDelete(
                                      ticket._id,
                                    )
                                  }
                                >
                                  {isDeleting
                                    ? 'Deleting...'
                                    : 'Delete'}
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {pagination &&
                  pagination.totalPages > 1 && (
                    <div
                      className={
                        styles.pagination
                      }
                    >
                      <button
                        type="button"
                        className={
                          styles.paginationButton
                        }
                        disabled={page === 1}
                        onClick={() =>
                          handlePageChange(
                            page - 1,
                          )
                        }
                      >
                        Previous
                      </button>

                      <span
                        className={
                          styles.pageInfo
                        }
                      >
                        Page {pagination.page} of{' '}
                        {pagination.totalPages}
                      </span>

                      <button
                        type="button"
                        className={
                          styles.paginationButton
                        }
                        disabled={
                          page ===
                          pagination.totalPages
                        }
                        onClick={() =>
                          handlePageChange(
                            page + 1,
                          )
                        }
                      >
                        Next
                      </button>
                    </div>
                  )}
              </>
            )}
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}