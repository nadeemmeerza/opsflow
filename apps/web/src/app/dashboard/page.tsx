"use client";

import Link from "next/link";

import { AppShell } from "@/components/layout/AppShell/AppShell";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";

import { useAppSelector } from "@/store/hooks";

import { useGetOrganizationsQuery } from "@/features/organizations/organizationsApi";

import styles from "./dashboard.module.scss";

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  );
}

function DashboardContent() {
  const user = useAppSelector((state) => state.auth.user);

  /*
   * The organization list API now uses a paginated query contract.
   *
   * The global dashboard only needs the first page because it
   * acts as an organization launcher rather than the full
   * organization management screen.
   */
  const { data, isLoading, isError } = useGetOrganizationsQuery({
    query: {
      page: 1,
      limit: 50,
      sortBy: "name",
      sortOrder: "asc",
    },
  });

  if (!user) {
    return null;
  }

  const organizations = data?.data.items ?? [];

  return (
    <AppShell>
      <main className={styles.dashboard}>
        {/* -------------------------------------------------
            Dashboard Header
            ------------------------------------------------- */}

        <header className={styles.header}>
          <div>
            <p className={styles.eyebrow}>Overview</p>

            <h1 className={styles.title}>Welcome back, {user.name}</h1>

            <p className={styles.subtitle}>
              Choose an organization to continue working in OpsFlow.
            </p>
          </div>

          <Link href="/organizations/new" className={styles.primaryButton}>
            + Create Organization
          </Link>
        </header>

        {/* -------------------------------------------------
            Organization Section
            -------------------------------------------------
            The global dashboard intentionally does not
            duplicate project/task/ticket statistics.
            Those belong to the organization dashboard.
            ------------------------------------------------- */}

        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <div>
              <h2>Your Organizations</h2>

              <p>
                Select an organization to view its projects, tasks, customers
                and tickets.
              </p>
            </div>

            <Link href="/organizations" className={styles.secondaryButton}>
              Manage Organizations
            </Link>
          </div>

          {/* Loading state */}
          {isLoading && (
            <div className={styles.state} role="status">
              Loading organizations...
            </div>
          )}

          {/* API error state */}
          {isError && (
            <div className={`${styles.state} ${styles.error}`} role="alert">
              Unable to load your organizations. Please try again.
            </div>
          )}

          {/* Empty state */}
          {!isLoading && !isError && organizations.length === 0 && (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>+</div>

              <h3>No organizations yet</h3>

              <p>Create your first organization to start managing your work.</p>

              <Link href="/organizations/new" className={styles.primaryButton}>
                Create Organization
              </Link>
            </div>
          )}

          {/* Organization cards */}
          {!isLoading && !isError && organizations.length > 0 && (
            <div className={styles.grid}>
              {organizations.map((organization) => (
                <article key={organization._id} className={styles.card}>
                  <div className={styles.cardHeader}>
                    <div className={styles.organizationIcon} aria-hidden="true">
                      {organization.name.charAt(0).toUpperCase()}
                    </div>

                    <span
                      className={`${styles.status} ${
                        organization.status === "active"
                          ? styles.active
                          : styles.suspended
                      }`}
                    >
                      {organization.status}
                    </span>
                  </div>

                  <div className={styles.cardContent}>
                    <h3>{organization.name}</h3>

                    <p className={styles.slug}>{organization.slug}</p>
                  </div>

                  <div className={styles.cardFooter}>
                    <Link
                      href={`/organizations/${organization._id}/dashboard`}
                      className={styles.dashboardLink}
                    >
                      Open Dashboard
                      <span aria-hidden="true">→</span>
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </main>
    </AppShell>
  );
}
