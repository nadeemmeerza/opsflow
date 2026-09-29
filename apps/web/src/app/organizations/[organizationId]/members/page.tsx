'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { AppShell } from '@/components/layout/AppShell/AppShell';

import {
  getApiErrorMessage,
} from '@/store/api/apiSlice';

import {
  useGetOrganizationMembersQuery,
  useRemoveOrganizationMemberMutation,
  type OrganizationRole,
  type MemberSortBy,
  type MemberSortOrder,
} from '@/features/organizations/organizationsApi';

import { useNotification } from '@/components/notifications/NotificationContext';

import styles from './members.module.scss';

export default function OrganizationMembersPage() {
  return (
    <ProtectedRoute>
      <MembersContent />
    </ProtectedRoute>
  );
}

function MembersContent() {
  const params = useParams();

  const organizationId =
    params.organizationId as string;

  const {
    success,
    error: showError,
  } = useNotification();

  /*
   * Search input is separate from the API search value.
   * This allows us to debounce requests while the user types.
   */
  const [searchInput, setSearchInput] =
    useState('');

  const [search, setSearch] =
    useState('');

  const [role, setRole] =
    useState<
      OrganizationRole | ''
    >('');

  const [sortBy, setSortBy] =
    useState<MemberSortBy>(
      'createdAt',
    );

  const [sortOrder, setSortOrder] =
    useState<MemberSortOrder>('desc');

  const [page, setPage] =
    useState(1);

  const limit = 10;

  /*
   * Debouncing prevents an API request for every
   * individual keyboard character.
   */
  useEffect(() => {
    const timer = window.setTimeout(
      () => {
        setSearch(
          searchInput.trim(),
        );

        setPage(1);
      },
      400,
    );

    return () =>
      window.clearTimeout(timer);
  }, [searchInput]);

  const {
    data,
    isLoading,
    isFetching,
    isError,
    error,
  } =
    useGetOrganizationMembersQuery({
      organizationId,

      query: {
        page,
        limit,
        search: search || undefined,
        role: role || undefined,
        sortBy,
        sortOrder,
      },
    });

  const [
    removeMember,
    {
      isLoading: isRemoving,
    },
  ] =
    useRemoveOrganizationMemberMutation();

  const members =
    data?.data.items ?? [];

  const pagination =
    data?.data.pagination;

  const handleRemove = async (
    memberId: string,
    memberName: string,
  ) => {
    const confirmed =
      window.confirm(
        `Remove ${memberName} from this organization?`,
      );

    if (!confirmed) {
      return;
    }

    try {
      await removeMember({
        organizationId,
        memberId,
      }).unwrap();

      /*
       * The mutation invalidates the Member tag, so the
       * current list automatically refreshes.
       */
      success(
        `${memberName} was removed from the organization.`,
      );

      /*
       * If the last item on a page was removed, move back
       * one page so the user doesn't land on an empty page.
       */
      if (
        members.length === 1 &&
        page > 1
      ) {
        setPage(
          (currentPage) =>
            currentPage - 1,
        );
      }
    } catch (removeError) {
      const messages =
        getApiErrorMessage(
          removeError,
        );

      showError(
        messages[0],
      );
    }
  };

  if (isLoading) {
    return (
      <AppShell>
        <div className={styles.state}>
          Loading members...
        </div>
      </AppShell>
    );
  }

  if (isError) {
    const messages =
      getApiErrorMessage(error);

    return (
      <AppShell>
        <div className={styles.state}>
          <p>
            Failed to load organization
            members.
          </p>

          <p className={styles.error}>
            {messages[0]}
          </p>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <main className={styles.container}>
        <Link
          href={`/organizations/${organizationId}`}
          className={styles.backLink}
        >
          ← Organization
        </Link>

        <header className={styles.header}>
          <div>
            <h1>Members</h1>

            <p>
              Manage users who belong to this
              organization.
            </p>
          </div>

          <Link
            href={`/organizations/${organizationId}/members/new`}
            className={styles.addButton}
          >
            + Add Member
          </Link>
        </header>

        <section className={styles.card}>
          <div className={styles.toolbar}>
            <input
              type="search"
              value={searchInput}
              onChange={(event) =>
                setSearchInput(
                  event.target.value,
                )
              }
              placeholder="Search name or email..."
              className={styles.searchInput}
              aria-label="Search members"
            />

            <select
              value={role}
              onChange={(event) => {
                setRole(
                  event.target.value as
                    | OrganizationRole
                    | '',
                );

                setPage(1);
              }}
              className={styles.select}
              aria-label="Filter by role"
            >
              <option value="">
                All roles
              </option>

              <option value="owner">
                Owner
              </option>

              <option value="admin">
                Admin
              </option>

              <option value="member">
                Member
              </option>
            </select>

            <select
              value={sortBy}
              onChange={(event) => {
                setSortBy(
                  event.target.value as MemberSortBy,
                );

                setPage(1);
              }}
              className={styles.select}
              aria-label="Sort members"
            >
              <option value="createdAt">
                Joined
              </option>

              <option value="name">
                Name
              </option>

              <option value="email">
                Email
              </option>

              <option value="role">
                Role
              </option>
            </select>

            <button
              type="button"
              className={styles.sortButton}
              onClick={() => {
                setSortOrder(
                  (current) =>
                    current === 'asc'
                      ? 'desc'
                      : 'asc',
                );

                setPage(1);
              }}
            >
              {sortOrder === 'asc'
                ? '↑ Asc'
                : '↓ Desc'}
            </button>
          </div>

          <div className={styles.resultBar}>
            <span>
              {pagination?.total ?? 0}{' '}
              {pagination?.total === 1
                ? 'member'
                : 'members'}
            </span>

            {isFetching && (
              <span>
                Updating...
              </span>
            )}
          </div>

          {members.length === 0 ? (
            <div className={styles.empty}>
              <h2>
                {search || role
                  ? 'No matching members'
                  : 'No members found'}
              </h2>

              <p>
                {search || role
                  ? 'Try changing your search or filter.'
                  : 'Add users to start collaborating.'}
              </p>
            </div>
          ) : (
            <>
              <div className={styles.table}>
                <div
                  className={
                    styles.tableHeader
                  }
                >
                  <span>User</span>
                  <span>Email</span>
                  <span>Role</span>
                  <span>Actions</span>
                </div>

                {members.map(
                  (member) => {
                    const name =
                      member.user?.name ??
                      'Unknown user';

                    const email =
                      member.user?.email ??
                      'No email';

                    return (
                      <div
                        key={member._id}
                        className={styles.row}
                      >
                        <div
                          className={
                            styles.user
                          }
                        >
                          <div
                            className={
                              styles.avatar
                            }
                          >
                            {name
                              .charAt(0)
                              .toUpperCase()}
                          </div>

                          <strong>
                            {name}
                          </strong>
                        </div>

                        <span>
                          {email}
                        </span>

                        <span
                          className={`${styles.role} ${styles[member.role]}`}
                        >
                          {member.role}
                        </span>

                        <div>
                          {member.role !==
                            'owner' && (
                            <button
                              type="button"
                              className={
                                styles.removeButton
                              }
                              disabled={
                                isRemoving
                              }
                              onClick={() =>
                                handleRemove(
                                  member._id,
                                  name,
                                )
                              }
                            >
                              {isRemoving
                                ? 'Removing...'
                                : 'Remove'}
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  },
                )}
              </div>

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
                      disabled={page <= 1}
                      onClick={() =>
                        setPage(
                          (current) =>
                            current - 1,
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
                      Page {page} of{' '}
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
                        page >=
                        pagination.totalPages
                      }
                      onClick={() =>
                        setPage(
                          (current) =>
                            current + 1,
                        )
                      }
                    >
                      Next
                    </button>
                  </div>
                )}
            </>
          )}
        </section>
      </main>
    </AppShell>
  );
}