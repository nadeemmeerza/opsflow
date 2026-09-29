'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  useEffect,
  useState,
} from 'react';

import {
  useDeleteProjectMutation,
  useGetProjectsQuery,
  type ProjectSortBy,
  type ProjectSortOrder,
  type ProjectStatus,
} from '@/features/projects/projectsApi';

import {
  getApiErrorMessage,
} from '@/store/api/apiSlice';

import {
  useNotification,
} from '@/components/notifications/NotificationContext';

import styles from './projects.module.scss';

import {
  ProtectedRoute,
} from '@/components/auth/ProtectedRoute';

import {
  AppShell,
} from '@/components/layout/AppShell/AppShell';

const PAGE_SIZE = 10;

export default function ProjectsPage() {
  const params = useParams();

  const organizationId =
    params.organizationId as string;

  const { success, error: notifyError } =
    useNotification();

  /**
   * Search is kept locally so we can debounce it before
   * sending requests to the API.
   */
  const [searchInput, setSearchInput] =
    useState('');

  const [search, setSearch] =
    useState('');

  const [status, setStatus] =
    useState<ProjectStatus | ''>('');

  const [sortBy, setSortBy] =
    useState<ProjectSortBy>(
      'createdAt',
    );

  const [sortOrder, setSortOrder] =
    useState<ProjectSortOrder>('desc');

  const [page, setPage] = useState(1);

  /**
   * Debouncing prevents an API request on every single
   * keystroke while the user is typing.
   */
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 350);

    return () => {
      clearTimeout(timer);
    };
  }, [searchInput]);

  const {
    data,
    isLoading,
    isFetching,
    isError,
  } = useGetProjectsQuery({
    organizationId,
    query: {
      page,
      limit: PAGE_SIZE,
      search,
      status: status || undefined,
      sortBy,
      sortOrder,
    },
  });

  const [deleteProject, { isLoading: isDeleting }] =
    useDeleteProjectMutation();

  const projects =
    data?.data.items ?? [];

  const pagination =
    data?.data.pagination;

  /**
   * If a filter/search reduces the number of pages,
   * make sure the current page does not become invalid.
   */
  useEffect(() => {
    if (
      pagination &&
      pagination.totalPages > 0 &&
      page > pagination.totalPages
    ) {
      setPage(pagination.totalPages);
    }
  }, [page, pagination]);

  const handleStatusChange = (
    value: ProjectStatus | '',
  ) => {
    setStatus(value);
    setPage(1);
  };

  const handleSortByChange = (
    value: ProjectSortBy,
  ) => {
    setSortBy(value);
    setPage(1);
  };

  const handleSortOrderChange = (
    value: ProjectSortOrder,
  ) => {
    setSortOrder(value);
    setPage(1);
  };

  const handleDelete = async (
    projectId: string,
    projectName: string,
  ) => {
    const confirmed = window.confirm(
      `Delete project "${projectName}"? This action cannot be undone.`,
    );

    if (!confirmed) {
      return;
    }

    try {
      await deleteProject({
        organizationId,
        projectId,
      }).unwrap();

      success(
        'Project deleted successfully.',
      );
    } catch (error) {
      const messages =
        getApiErrorMessage(error);

      notifyError(messages[0]);
    }
  };

  const hasProjects =
    projects.length > 0;

  const hasFilters =
    Boolean(search) || Boolean(status);

  const startResult =
    pagination &&
    pagination.total > 0
      ? (pagination.page - 1) *
          pagination.limit +
        1
      : 0;

  const endResult =
    pagination &&
    pagination.total > 0
      ? Math.min(
          pagination.page *
            pagination.limit,
          pagination.total,
        )
      : 0;

  return (
    <ProtectedRoute>
      <AppShell>
        <div className={styles.page}>
          <div className={styles.header}>
            <div>
              <p className={styles.eyebrow}>
                Organization
              </p>

              <h1>Projects</h1>

              <p className={styles.subtitle}>
                Manage projects belonging to
                this organization.
              </p>
            </div>

            <Link
              href={`/organizations/${organizationId}/projects/new`}
              className={styles.createButton}
            >
              + New project
            </Link>
          </div>

          {/* Search, filtering and sorting stay above the result grid. */}
          <div className={styles.toolbar}>
            <div className={styles.searchWrapper}>
              <label
                htmlFor="project-search"
                className={styles.label}
              >
                Search
              </label>

              <input
                id="project-search"
                type="search"
                value={searchInput}
                onChange={(event) =>
                  setSearchInput(
                    event.target.value,
                  )
                }
                placeholder="Search projects..."
                className={styles.searchInput}
              />
            </div>

            <div className={styles.control}>
              <label
                htmlFor="project-status"
                className={styles.label}
              >
                Status
              </label>

              <select
                id="project-status"
                value={status}
                onChange={(event) =>
                  handleStatusChange(
                    event.target
                      .value as
                      | ProjectStatus
                      | '',
                  )
                }
                className={styles.select}
              >
                <option value="">
                  All statuses
                </option>

                <option value="active">
                  Active
                </option>

                <option value="archived">
                  Archived
                </option>
              </select>
            </div>

            <div className={styles.control}>
              <label
                htmlFor="project-sort"
                className={styles.label}
              >
                Sort by
              </label>

              <select
                id="project-sort"
                value={sortBy}
                onChange={(event) =>
                  handleSortByChange(
                    event.target
                      .value as ProjectSortBy,
                  )
                }
                className={styles.select}
              >
                <option value="createdAt">
                  Created date
                </option>

                <option value="updatedAt">
                  Updated date
                </option>

                <option value="name">
                  Name
                </option>

                <option value="key">
                  Key
                </option>

                <option value="status">
                  Status
                </option>
              </select>
            </div>

            <div className={styles.control}>
              <label
                htmlFor="project-sort-order"
                className={styles.label}
              >
                Order
              </label>

              <select
                id="project-sort-order"
                value={sortOrder}
                onChange={(event) =>
                  handleSortOrderChange(
                    event.target
                      .value as ProjectSortOrder,
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
          </div>

          {/* Shows the user exactly which slice of the dataset is visible. */}
          {!isLoading &&
            !isError &&
            pagination && (
              <div className={styles.resultBar}>
                <span>
                  {pagination.total === 0
                    ? 'No projects found'
                    : `Showing ${startResult}-${endResult} of ${pagination.total} projects`}
                </span>

                {isFetching && (
                  <span
                    className={
                      styles.refreshing
                    }
                  >
                    Updating...
                  </span>
                )}
              </div>
            )}

          {isLoading && (
            <div className={styles.state}>
              Loading projects...
            </div>
          )}

          {isError && (
            <div
              className={styles.errorState}
              role="alert"
            >
              Unable to load projects.
            </div>
          )}

          {!isLoading &&
            !isError &&
            projects.length === 0 && (
              <div className={styles.emptyState}>
                <h2>
                  {hasFilters
                    ? 'No matching projects'
                    : 'No projects yet'}
                </h2>

                <p>
                  {hasFilters
                    ? 'Try changing your search or filters.'
                    : 'Create your first project to start organizing work.'}
                </p>

                {!hasFilters && (
                  <Link
                    href={`/organizations/${organizationId}/projects/new`}
                    className={
                      styles.createButton
                    }
                  >
                    Create project
                  </Link>
                )}
              </div>
            )}

          {hasProjects && (
            <>
              <div className={styles.grid}>
                {projects.map(
                  (project) => (
                    <article
                      key={project._id}
                      className={styles.card}
                    >
                      <div
                        className={
                          styles.cardHeader
                        }
                      >
                        <div
                          className={
                            styles.projectKey
                          }
                        >
                          {project.key}
                        </div>

                        <span
                          className={
                            project.status ===
                            'active'
                              ? styles.active
                              : styles.archived
                          }
                        >
                          {project.status}
                        </span>
                      </div>

                      <h2>{project.name}</h2>

                      <p
                        className={
                          styles.description
                        }
                      >
                        {project.description ||
                          'No description provided.'}
                      </p>

                      <div
                        className={
                          styles.cardFooter
                        }
                      >
                        <Link
                          href={`/organizations/${organizationId}/projects/${project._id}`}
                          className={
                            styles.viewLink
                          }
                        >
                          View project →
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
                              project._id,
                              project.name,
                            )
                          }
                        >
                          Delete
                        </button>
                      </div>
                    </article>
                  ),
                )}
              </div>

              {/* Pagination is only shown when more than one page exists. */}
              {pagination &&
                pagination.totalPages >
                  1 && (
                  <nav
                    className={
                      styles.pagination
                    }
                    aria-label="Projects pagination"
                  >
                    <button
                      type="button"
                      className={
                        styles.pageButton
                      }
                      disabled={
                        page <= 1 ||
                        isFetching
                      }
                      onClick={() =>
                        setPage(
                          (current) =>
                            current - 1,
                        )
                      }
                    >
                      ← Previous
                    </button>

                    <span
                      className={
                        styles.pageInfo
                      }
                    >
                      Page {pagination.page} of{' '}
                      {
                        pagination.totalPages
                      }
                    </span>

                    <button
                      type="button"
                      className={
                        styles.pageButton
                      }
                      disabled={
                        page >=
                          pagination.totalPages ||
                        isFetching
                      }
                      onClick={() =>
                        setPage(
                          (current) =>
                            current + 1,
                        )
                      }
                    >
                      Next →
                    </button>
                  </nav>
                )}
            </>
          )}
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}