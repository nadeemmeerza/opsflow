"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";

import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { useNotification } from "@/components/notifications/NotificationContext";
import { AppShell } from "@/components/layout/AppShell/AppShell";
import { getApiErrorMessage } from "@/store/api/apiSlice";

import {
  useDeleteProjectMutation,
  useGetProjectQuery,
} from "@/features/projects/projectsApi";

import styles from "./project-details.module.scss";

export default function ProjectDetailsPage() {
  const params = useParams();
  const router = useRouter();

  const organizationId = params.organizationId as string;

  const projectId = params.projectId as string;

  /*
   * Global notification methods are used to provide
   * immediate feedback after delete operations.
   */
  const { success, error: showError } = useNotification();

  const { data, isLoading, isError } = useGetProjectQuery({
    organizationId,
    projectId,
  });

  const [deleteProject, { isLoading: isDeleting }] = useDeleteProjectMutation();

  const project = data?.data;

  const handleDelete = async () => {
    /*
     * Do nothing if the project has not loaded.
     */
    if (!project) {
      return;
    }

    /*
     * Keep the destructive-action confirmation.
     *
     * This protects users from accidentally deleting
     * a project.
     */
    const confirmed = window.confirm(
      `Delete "${project.name}"? This action cannot be undone.`,
    );

    if (!confirmed) {
      return;
    }

    try {
      await deleteProject({
        organizationId,
        projectId,
      }).unwrap();

      /*
       * Tell the user that the deletion succeeded before
       * navigating back to the project list.
       */
      success("Project deleted successfully.");

      router.push(`/organizations/${organizationId}/projects`);
    } catch (error) {
      /*
       * Convert the backend response into the standard
       * OpsFlow error message format.
       */
      const messages = getApiErrorMessage(error);

      console.error("Failed to delete project:", error);

      /*
       * Display the first useful API error as a global
       * notification.
       */
      showError(messages[0] ?? "Failed to delete project.");
    }
  };

  return (
    <ProtectedRoute>
      <AppShell>
        <div className={styles.page}>
          {isLoading && <div className={styles.state}>Loading project...</div>}

          {isError && (
            <div className={styles.errorState}>
              Unable to load this project.
            </div>
          )}

          {project && (
            <>
              <div className={styles.breadcrumb}>
                <Link href={`/organizations/${organizationId}/projects`}>
                  Projects
                </Link>

                <span>/</span>

                <span>{project.key}</span>
              </div>

              <header className={styles.header}>
                <div>
                  <div className={styles.key}>{project.key}</div>

                  <h1>{project.name}</h1>

                  <div className={styles.meta}>
                    <span
                      className={
                        project.status === "active"
                          ? styles.active
                          : styles.archived
                      }
                    >
                      {project.status}
                    </span>
                  </div>
                </div>

                <div className={styles.actions}>
                  <Link
                    href={`/organizations/${organizationId}/projects/${projectId}/edit`}
                    className={styles.editButton}
                  >
                    Edit project
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

              <section className={styles.descriptionSection}>
                <h2>Description</h2>

                <p>{project.description || "No description provided."}</p>
              </section>

              <section className={styles.infoGrid}>
                <div className={styles.infoCard}>
                  <span>Project key</span>
                  <strong>{project.key}</strong>
                </div>

                <div className={styles.infoCard}>
                  <span>Status</span>
                  <strong>{project.status}</strong>
                </div>

                <div className={styles.infoCard}>
                  <span>Created</span>
                  <strong>
                    {new Date(project.createdAt).toLocaleDateString()}
                  </strong>
                </div>

                <div className={styles.infoCard}>
                  <span>Last updated</span>
                  <strong>
                    {new Date(project.updatedAt).toLocaleDateString()}
                  </strong>
                </div>
              </section>

              <section className={styles.workspace}>
                <div className={styles.sectionHeader}>
                  <div>
                    <h2>Project workspace</h2>

                    <p>Work associated with this project will appear here.</p>
                  </div>
                </div>

                <div className={styles.workspaceGrid}>
                  <div className={styles.workspaceCard}>
                    <span className={styles.workspaceIcon}>✓</span>

                    <Link
                      href={`/organizations/${organizationId}/projects/${projectId}/tasks`}
                      className={styles.workspaceLink}
                    >
                      <div>
                        <h3>Tasks</h3>

                        <p>Manage tasks and track project progress.</p>
                      </div>
                    </Link>
                   
                  </div>

                  <div className={styles.workspaceCard}>
                    <span className={styles.workspaceIcon}>!</span>
                    <Link
                      href={`/organizations/${organizationId}/tickets`}
                      className={styles.workspaceLink}
                    >
                      <h3>Tickets</h3>

                      <p>Track support and operational issues.</p>
                    </Link>                    
                  </div>

                  
                </div>
              </section>
            </>
          )}
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}
