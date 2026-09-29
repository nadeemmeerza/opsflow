'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';

import {
  useGetTasksQuery,
  type Task,
  type TaskPriority,
  type TaskSortBy,
  type TaskSortOrder,
  type TaskStatus,
} from '@/features/tasks/tasksApi';

import styles from './tasks.module.scss';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { AppShell } from '@/components/layout/AppShell/AppShell';

/**
 * Displays the actual assignee name when the API has populated
 * the assignee relationship. Older/unpopulated responses may
 * still contain only the assignee ID, so we provide a safe fallback.
 */
function getAssigneeName(task: Task): string {
  if (!task.assigneeId) {
    return 'Unassigned';
  }

  if (
    typeof task.assigneeId === 'object' &&
    'name' in task.assigneeId
  ) {
    return task.assigneeId.name;
  }

  return 'Assigned';
}

export default function TasksPage() {
  const params = useParams<{
    organizationId: string;
    projectId: string;
  }>();

  const {
    organizationId,
    projectId,
  } = params;

  /*
   * Search input is kept separate from the actual API search value.
   * This allows us to debounce the request and avoid hitting the
   * backend for every character typed.
   */
  const [searchInput, setSearchInput] =
    useState('');

  const [search, setSearch] =
    useState('');

  const [status, setStatus] =
    useState<TaskStatus | ''>('');

  const [priority, setPriority] =
    useState<TaskPriority | ''>('');

  const [sortBy, setSortBy] =
    useState<TaskSortBy>('createdAt');

  const [sortOrder, setSortOrder] =
    useState<TaskSortOrder>('desc');

  const [page, setPage] =
    useState(1);

  const limit = 10;

  /*
   * Debounce search requests by 400ms.
   *
   * Whenever the user changes the search text, pagination is
   * also reset to page one because the result set has changed.
   */
  useEffect(() => {
    const timer = window.setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 400);

    return () => {
      window.clearTimeout(timer);
    };
  }, [searchInput]);

  /*
   * Changing a filter or sorting option changes the result set,
   * therefore we always return the user to the first page.
   */
  const handleStatusChange = (
    value: TaskStatus | '',
  ) => {
    setStatus(value);
    setPage(1);
  };

  const handlePriorityChange = (
    value: TaskPriority | '',
  ) => {
    setPriority(value);
    setPage(1);
  };

  const handleSortByChange = (
    value: TaskSortBy,
  ) => {
    setSortBy(value);
    setPage(1);
  };

  const handleSortOrderChange = (
    value: TaskSortOrder,
  ) => {
    setSortOrder(value);
    setPage(1);
  };

  const {
    data,
    isLoading,
    isFetching,
    isError,
  } = useGetTasksQuery({
    organizationId,
    projectId,
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

  /*
   * The Tasks API now returns data.items rather than data directly.
   */
  const tasks = data?.data.items ?? [];

  const pagination =
    data?.data.pagination;

  const totalPages =
    pagination?.totalPages ?? 1;

  const totalTasks =
    pagination?.total ?? 0;

  return (
    <ProtectedRoute>
      <AppShell>
        <main className={styles.page}>
          <div className={styles.header}>
            <div>
              <h1>Tasks</h1>

              <p>
                Manage tasks for this project.
              </p>
            </div>

            <Link
              href={`/organizations/${organizationId}/projects/${projectId}/tasks/new`}
              className={styles.createButton}
            >
              + New Task
            </Link>
          </div>

          {/* Server-side search, filters, and sorting controls. */}
          <div className={styles.toolbar}>
            <div className={styles.searchField}>
              <label htmlFor="task-search">
                Search
              </label>

              <input
                id="task-search"
                type="search"
                value={searchInput}
                onChange={(event) =>
                  setSearchInput(
                    event.target.value,
                  )
                }
                placeholder="Search tasks..."
              />
            </div>

            <div className={styles.filterField}>
              <label htmlFor="task-status">
                Status
              </label>

              <select
                id="task-status"
                value={status}
                onChange={(event) =>
                  handleStatusChange(
                    event.target
                      .value as TaskStatus | '',
                  )
                }
              >
                <option value="">
                  All statuses
                </option>

                <option value="todo">
                  Todo
                </option>

                <option value="in_progress">
                  In progress
                </option>

                <option value="review">
                  Review
                </option>

                <option value="done">
                  Done
                </option>
              </select>
            </div>

            <div className={styles.filterField}>
              <label htmlFor="task-priority">
                Priority
              </label>

              <select
                id="task-priority"
                value={priority}
                onChange={(event) =>
                  handlePriorityChange(
                    event.target
                      .value as TaskPriority | '',
                  )
                }
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
            </div>

            <div className={styles.filterField}>
              <label htmlFor="task-sort">
                Sort by
              </label>

              <select
                id="task-sort"
                value={sortBy}
                onChange={(event) =>
                  handleSortByChange(
                    event.target
                      .value as TaskSortBy,
                  )
                }
              >
                <option value="createdAt">
                  Created date
                </option>

                <option value="updatedAt">
                  Updated date
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

                <option value="dueDate">
                  Due date
                </option>
              </select>
            </div>

            <div className={styles.filterField}>
              <label htmlFor="task-sort-order">
                Order
              </label>

              <select
                id="task-sort-order"
                value={sortOrder}
                onChange={(event) =>
                  handleSortOrderChange(
                    event.target
                      .value as TaskSortOrder,
                  )
                }
              >
                <option value="desc">
                  Descending
                </option>

                <option value="asc">
                  Ascending
                </option>
              </select>
            </div>
          </div>

          {!isLoading && !isError && (
            <div className={styles.resultBar}>
              <span>
                {totalTasks}{' '}
                {totalTasks === 1
                  ? 'task'
                  : 'tasks'}
              </span>

              {isFetching && (
                <span>
                  Updating...
                </span>
              )}
            </div>
          )}

          {isLoading && (
            <div className={styles.message}>
              Loading tasks...
            </div>
          )}

          {isError && (
            <div className={styles.error}>
              Failed to load tasks.
            </div>
          )}

          {!isLoading &&
            !isError &&
            tasks.length === 0 && (
              <div className={styles.empty}>
                <h2>
                  {search ||
                  status ||
                  priority
                    ? 'No matching tasks'
                    : 'No tasks yet'}
                </h2>

                <p>
                  {search ||
                  status ||
                  priority
                    ? 'Try changing your search or filters.'
                    : 'Create your first task for this project.'}
                </p>
              </div>
            )}

          {!isLoading &&
            !isError &&
            tasks.length > 0 && (
              <>
                <div
                  className={
                    styles.tableWrapper
                  }
                >
                  <table>
                    <thead>
                      <tr>
                        <th>Task</th>
                        <th>Status</th>
                        <th>Priority</th>
                        <th>Assignee</th>
                        <th>Due date</th>
                      </tr>
                    </thead>

                    <tbody>
                      {tasks.map((task) => (
                        <tr key={task._id}>
                          <td>
                            <Link
                              href={`/organizations/${organizationId}/projects/${projectId}/tasks/${task._id}`}
                              className={
                                styles.taskLink
                              }
                            >
                              {task.title}
                            </Link>
                          </td>

                          <td>
                            <span
                              className={
                                styles.status
                              }
                            >
                              {task.status}
                            </span>
                          </td>

                          <td>
                            <span
                              className={
                                styles.priority
                              }
                            >
                              {task.priority}
                            </span>
                          </td>

                          <td>
                            {getAssigneeName(
                              task,
                            )}
                          </td>

                          <td>
                            {task.dueDate
                              ? new Date(
                                  task.dueDate,
                                ).toLocaleDateString()
                              : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination is driven entirely by the API metadata. */}
                {totalPages > 1 && (
                  <div
                    className={
                      styles.pagination
                    }
                  >
                    <button
                      type="button"
                      onClick={() =>
                        setPage(
                          (current) =>
                            Math.max(
                              1,
                              current - 1,
                            ),
                        )
                      }
                      disabled={page === 1}
                    >
                      Previous
                    </button>

                    <span>
                      Page {page} of{' '}
                      {totalPages}
                    </span>

                    <button
                      type="button"
                      onClick={() =>
                        setPage(
                          (current) =>
                            Math.min(
                              totalPages,
                              current + 1,
                            ),
                        )
                      }
                      disabled={
                        page === totalPages
                      }
                    >
                      Next
                    </button>
                  </div>
                )}
              </>
            )}
        </main>
      </AppShell>
    </ProtectedRoute>
  );
}