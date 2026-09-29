"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";

import { AppShell } from "@/components/layout/AppShell/AppShell";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";

import {
  useDeleteOrganizationMutation,
  useGetOrganizationQuery,
} from "@/features/organizations/organizationsApi";

import styles from "./organization-details.module.scss";

export default function OrganizationDetailsPage() {
  return (
    <ProtectedRoute>
      <OrganizationDetailsContent />
    </ProtectedRoute>
  );
}

function OrganizationDetailsContent() {
  const params = useParams();

  const organizationId = params.organizationId as string;

  const [deleteOrganization, { isLoading: isDeleting }] =
    useDeleteOrganizationMutation();

  const router = useRouter();

  const { data, isLoading, isError } = useGetOrganizationQuery(organizationId);

  const handleDelete = async () => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${organization.name}"?`,
    );

    if (!confirmed) {
      return;
    }

    try {
      await deleteOrganization(organizationId).unwrap();

      router.replace("/organizations");
    } catch (error) {
      console.error("Failed to delete organization:", error);
    }
  };

  if (isLoading) {
    return (
      <AppShell>
        <div className={styles.state}>Loading organization...</div>
      </AppShell>
    );
  }

  if (isError || !data?.data) {
    return (
      <AppShell>
        <div className={styles.state}>
          <h2>Organization not found</h2>

          <p>
            The organization may have been deleted or you may not have access to
            it.
          </p>

          <Link href="/organizations" className={styles.backLink}>
            ← Back to organizations
          </Link>
        </div>
      </AppShell>
    );
  }

  const organization = data.data;

  return (
    <AppShell>
      <div className={styles.container}>
        <Link href="/organizations" className={styles.backLink}>
          ← Organizations
        </Link>

        <header className={styles.header}>
          <div>
            <div className={styles.titleRow}>
              <h1>{organization.name}</h1>

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

            <p className={styles.slug}>{organization.slug}</p>
          </div>
          <div className={styles.actions}>
            <Link
              href={`/organizations/${organizationId}/edit`}
              className={styles.editButton}
            >
              Edit
            </Link>
            <button
              type="button"
              className={styles.deleteButton}
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </button>
          </div>
        </header>

        <section className={styles.overview}>
          <h2>Overview</h2>

          <div className={styles.grid}>
            <div className={styles.card}>
              <span>Organization ID</span>
              <strong>{organization._id}</strong>
            </div>

            <div className={styles.card}>
              <span>Slug</span>
              <strong>{organization.slug}</strong>
            </div>

            <div className={styles.card}>
              <span>Status</span>
              <strong>{organization.status}</strong>
            </div>

            <div className={styles.card}>
              <span>Created</span>
              <strong>
                {new Date(organization.createdAt).toLocaleDateString()}
              </strong>
            </div>
          </div>
        </section>

        <section className={styles.modules}>
          <h2>Workspace</h2>

          <div className={styles.moduleGrid}>
            <Link
              href={`/organizations/${organizationId}/members`}
              className={styles.moduleLink}
            >
              <div className={styles.moduleCard}>
                <h3>Members</h3>
                <p>Manage organization members and roles.</p>
              </div>
            </Link>

            <Link
              href={`/organizations/${organizationId}/projects`}
              className={styles.moduleLink}
            >
              <div className={styles.moduleCard}>
                <h3>Projects</h3>
                <p>Manage projects for this organization.</p>
              </div>
            </Link>

            <Link href={`/organizations/${organizationId}/customers`}>
              <div className={styles.moduleCard}>
                <h3>Customers</h3>
                <p>Manage customers and contacts.</p>
              </div>
            </Link>

            <Link
              href={`/organizations/${organizationId}/tickets`}
              className={styles.moduleLink}
            >
              <div className={styles.moduleCard}>
                <h3>Tickets</h3>
                <p>Manage support tickets.</p>
              </div>
            </Link>

            <Link
              href={`/organizations/${organizationId}/audit-logs`}
              className={styles.moduleLink}
            >
              <div className={styles.moduleCard}>
                <h3>Audit Logs</h3>
                <p>Review organization activity.</p>
              </div>
            </Link>

            <Link
              href={`/organizations/${organizationId}/settings`}
              className={styles.moduleLink}
            >
              <div className={styles.moduleCard}>
                <h3>Settings</h3>
                <p>Configure organization settings.</p>
              </div>
            </Link>
            
          </div>
        </section>
      </div>
    </AppShell>
  );
}
