'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

import { AppShell } from '@/components/layout/AppShell/AppShell';

import {
  useGetOrganizationsQuery,
  type OrganizationSortBy,
  type OrganizationSortOrder,
  type OrganizationStatus,
} from '@/features/organizations/organizationsApi';

import styles from './organizations.module.scss';

export default function OrganizationsPage() {
  /*
   * Keep the text the user is currently typing separate from
   * the value sent to the API. This lets us debounce searches.
   */
  const [searchInput, setSearchInput] =
    useState('');

  const [search, setSearch] =
    useState('');

  const [status, setStatus] =
    useState<OrganizationStatus | ''>('');

  const [sortBy, setSortBy] =
    useState<OrganizationSortBy>(
      'createdAt',
    );

  const [sortOrder, setSortOrder] =
    useState<OrganizationSortOrder>(
      'desc',
    );

  const [page, setPage] =
    useState(1);

  /*
   * The backend limits one request to 50 records.
   * Ten organizations per page keeps the launcher easy to scan.
   */
  const limit = 10;

  /*
   * Debounce organization search to avoid making an
   * API request for every character typed.
   */
  useEffect(() => {
    const timer =
      window.setTimeout(() => {
        setSearch(
          searchInput.trim(),
        );

        setPage(1);
      }, 400);

    return () => {
      window.clearTimeout(timer);
    };
  }, [searchInput]);

  /*
   * Changing a filter or sort order should always return
   * the user to the first result page.
   */
  useEffect(() => {
    setPage(1);
  }, [
    status,
    sortBy,
    sortOrder,
  ]);

  /*
   * Search, filtering, sorting, and pagination are now
   * performed by the NestJS backend.
   */
  const {
    data,
    isLoading,
    isFetching,
    isError,
  } = useGetOrganizationsQuery({
    query: {
      page,
      limit,
      search:
        search || undefined,
      status:
        status || undefined,
      sortBy,
      sortOrder,
    },
  });

  /*
   * The new response contains the current page's items
   * and pagination metadata.
   */
  const organizations =
    data?.data.items ?? [];

  const pagination =
    data?.data.pagination;

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
    <AppShell>
      <div className={styles.page}>
        {/* Page heading and organization creation action. */}
        <div className={styles.header}>
          <div>
            <h1>Organizations</h1>

            <p>
              Manage your OpsFlow
              organizations.
            </p>
          </div>

          <Link
            href="/organizations/new"
            className={
              styles.createButton
            }
          >
            + New Organization
          </Link>
        </div>

        {/* 
         * Server-side search, filtering, and sorting controls.
         */}
        <div className={styles.toolbar}>
          <input
            type="search"
            value={searchInput}
            onChange={(event) =>
              setSearchInput(
                event.target.value,
              )
            }
            placeholder="Search organizations..."
            className={
              styles.searchInput
            }
          />

          <select
            value={status}
            onChange={(event) =>
              setStatus(
                event.target.value as
                  | OrganizationStatus
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

            <option value="suspended">
              Suspended
            </option>
          </select>

          <select
            value={sortBy}
            onChange={(event) =>
              setSortBy(
                event.target.value as
                  OrganizationSortBy,
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

            <option value="name">
              Name
            </option>

            <option value="slug">
              Slug
            </option>

            <option value="status">
              Status
            </option>
          </select>

          <select
            value={sortOrder}
            onChange={(event) =>
              setSortOrder(
                event.target.value as
                  OrganizationSortOrder,
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

        {/* Result count and background refresh indicator. */}
        {!isLoading &&
          !isError &&
          pagination && (
            <div
              className={
                styles.resultBar
              }
            >
              <span>
                {pagination.total}{' '}
                {pagination.total === 1
                  ? 'organization'
                  : 'organizations'}
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
            Loading organizations...
          </div>
        )}

        {isError && (
          <div
            className={`${styles.state} ${styles.error}`}
          >
            Unable to load
            organizations.
          </div>
        )}

        {/* 
         * Empty state handles both a completely empty
         * organization list and a search/filter with no results.
         */}
        {!isLoading &&
          !isError &&
          organizations.length === 0 && (
            <div
              className={styles.empty}
            >
              <h2>
                {search || status
                  ? 'No matching organizations'
                  : 'No organizations yet'}
              </h2>

              <p>
                {search || status
                  ? 'Try changing your search or filters.'
                  : 'Create your first organization to get started.'}
              </p>

              {!search &&
                !status && (
                  <Link
                    href="/organizations/new"
                    className={
                      styles.createButton
                    }
                  >
                    Create Organization
                  </Link>
                )}
            </div>
          )}

        {!isLoading &&
          !isError &&
          organizations.length >
            0 && (
            <>
              {/* Organization cards. */}
              <div
                className={styles.grid}
              >
                {organizations.map(
                  (organization) => (
                    <Link
                      key={
                        organization._id
                      }
                      href={`/organizations/${organization._id}`}
                      className={
                        styles.card
                      }
                    >
                      <h2>
                        {
                          organization.name
                        }
                      </h2>

                      <p>
                        {
                          organization.slug
                        }
                      </p>

                      <span
                        className={`${styles.status} ${styles[organization.status]}`}
                      >
                        {
                          organization.status
                        }
                      </span>
                    </Link>
                  ),
                )}
              </div>

              {/* 
               * Pagination is based on the total count returned
               * by MongoDB rather than the current page length.
               */}
              {pagination &&
                pagination.totalPages >
                  1 && (
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
                      disabled={
                        page === 1
                      }
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
                      Page {pagination.page}{' '}
                      of{' '}
                      {
                        pagination.totalPages
                      }
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
  );
}