'use client';

import {
  useEffect,
  useState,
} from 'react';

import Link from 'next/link';
import { useParams } from 'next/navigation';

import {
  useGetCustomersQuery,
  type CustomerSortBy,
  type CustomerStatus,
} from '@/features/customers/customersApi';

import styles from './customers.module.scss';

import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { AppShell } from '@/components/layout/AppShell/AppShell';

export default function CustomersPage() {
  const params = useParams();

  const organizationId =
    params.organizationId as string;

  /*
   * Keep the text the user is currently typing separate from
   * the value sent to the API. This allows us to debounce
   * search requests instead of calling the backend on every
   * keystroke.
   */
  const [searchInput, setSearchInput] =
    useState('');

  const [search, setSearch] =
    useState('');

  const [status, setStatus] =
    useState<CustomerStatus | ''>('');

  const [sortBy, setSortBy] =
    useState<CustomerSortBy>('createdAt');

  const [sortOrder, setSortOrder] =
    useState<'asc' | 'desc'>('desc');

  const [page, setPage] =
    useState(1);

  const limit = 10;

  /*
   * Debounce customer searching by 400ms so the API is not
   * queried for every individual character typed.
   */
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 400);

    return () => {
      clearTimeout(timer);
    };
  }, [searchInput]);

  /*
   * All list operations are performed server-side.
   * RTK Query also caches each unique query combination.
   */
  const {
    data,
    isLoading,
    isFetching,
    isError,
  } = useGetCustomersQuery({
    organizationId,

    query: {
      page,
      limit,
      search: search || undefined,
      status: status || undefined,
      sortBy,
      sortOrder,
    },
  });

  const customers =
    data?.data.items ?? [];

  const pagination =
    data?.data.pagination;

  const hasActiveFilters =
    Boolean(search) ||
    Boolean(status);

  /*
   * Reset pagination when the user changes a filter.
   * Otherwise a user could remain on a later page that
   * no longer exists after filtering.
   */
  const handleStatusChange = (
    value: CustomerStatus | '',
  ) => {
    setStatus(value);
    setPage(1);
  };

  const handleSortChange = (
    value: CustomerSortBy,
  ) => {
    setSortBy(value);
    setPage(1);
  };

  const handleSortOrderChange = (
    value: 'asc' | 'desc',
  ) => {
    setSortOrder(value);
    setPage(1);
  };

  return (
    <ProtectedRoute>
      <AppShell>
        <main className={styles.page}>
          <div className={styles.header}>
            <div>
              <h1>Customers</h1>

              <p>
                Manage customers for this
                organization.
              </p>
            </div>

            <Link
              href={`/organizations/${organizationId}/customers/new`}
              className={styles.newButton}
            >
              + New Customer
            </Link>
          </div>

          {/* Search, filtering, and sorting controls. */}
          <div className={styles.toolbar}>
            <div className={styles.searchField}>
              <label htmlFor="customer-search">
                Search
              </label>

              <input
                id="customer-search"
                type="search"
                value={searchInput}
                onChange={(event) =>
                  setSearchInput(
                    event.target.value,
                  )
                }
                placeholder="Name, email, phone or company..."
              />
            </div>

            <div className={styles.filterField}>
              <label htmlFor="customer-status">
                Status
              </label>

              <select
                id="customer-status"
                value={status}
                onChange={(event) =>
                  handleStatusChange(
                    event.target
                      .value as
                      | CustomerStatus
                      | '',
                  )
                }
              >
                <option value="">
                  All statuses
                </option>

                <option value="active">
                  Active
                </option>

                <option value="inactive">
                  Inactive
                </option>
              </select>
            </div>

            <div className={styles.filterField}>
              <label htmlFor="customer-sort">
                Sort by
              </label>

              <select
                id="customer-sort"
                value={sortBy}
                onChange={(event) =>
                  handleSortChange(
                    event.target
                      .value as CustomerSortBy,
                  )
                }
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

                <option value="email">
                  Email
                </option>

                <option value="company">
                  Company
                </option>

                <option value="status">
                  Status
                </option>
              </select>
            </div>

            <div className={styles.filterField}>
              <label htmlFor="customer-sort-order">
                Order
              </label>

              <select
                id="customer-sort-order"
                value={sortOrder}
                onChange={(event) =>
                  handleSortOrderChange(
                    event.target
                      .value as
                      | 'asc'
                      | 'desc',
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

          {/* Shows the current result count and background refresh state. */}
          {!isLoading && !isError && (
            <div className={styles.resultBar}>
              <span>
                {pagination?.total ?? 0}{' '}
                {pagination?.total === 1
                  ? 'customer'
                  : 'customers'}
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
              Loading customers...
            </div>
          )}

          {isError && (
            <div className={styles.error}>
              Failed to load customers.
            </div>
          )}

          {!isLoading &&
            !isError &&
            customers.length === 0 && (
              <div className={styles.empty}>
                <h2>
                  {hasActiveFilters
                    ? 'No customers found'
                    : 'No customers yet'}
                </h2>

                <p>
                  {hasActiveFilters
                    ? 'Try changing your search or filters.'
                    : 'Create your first customer to get started.'}
                </p>

                {!hasActiveFilters && (
                  <Link
                    href={`/organizations/${organizationId}/customers/new`}
                    className={
                      styles.newButton
                    }
                  >
                    Create Customer
                  </Link>
                )}
              </div>
            )}

          {!isLoading &&
            !isError &&
            customers.length > 0 && (
              <>
                <div
                  className={
                    styles.tableWrapper
                  }
                >
                  <table
                    className={styles.table}
                  >
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Company</th>
                        <th>Email</th>
                        <th>Phone</th>
                        <th>Status</th>
                      </tr>
                    </thead>

                    <tbody>
                      {customers.map(
                        (customer) => (
                          <tr
                            key={
                              customer._id
                            }
                          >
                            <td>
                              <Link
                                href={`/organizations/${organizationId}/customers/${customer._id}`}
                                className={
                                  styles.customerLink
                                }
                              >
                                {
                                  customer.name
                                }
                              </Link>
                            </td>

                            <td>
                              {customer.company ||
                                '—'}
                            </td>

                            <td>
                              {customer.email ||
                                '—'}
                            </td>

                            <td>
                              {customer.phone ||
                                '—'}
                            </td>

                            <td>
                              <span
                                className={
                                  customer.status ===
                                  'active'
                                    ? styles.activeStatus
                                    : styles.inactiveStatus
                                }
                              >
                                {
                                  customer.status
                                }
                              </span>
                            </td>
                          </tr>
                        ),
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Server-side pagination controls. */}
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
                        onClick={() =>
                          setPage(
                            (current) =>
                              current - 1,
                          )
                        }
                        disabled={
                          page <= 1
                        }
                      >
                        Previous
                      </button>

                      <span>
                        Page {page} of{' '}
                        {
                          pagination.totalPages
                        }
                      </span>

                      <button
                        type="button"
                        onClick={() =>
                          setPage(
                            (current) =>
                              current + 1,
                          )
                        }
                        disabled={
                          page >=
                          pagination.totalPages
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