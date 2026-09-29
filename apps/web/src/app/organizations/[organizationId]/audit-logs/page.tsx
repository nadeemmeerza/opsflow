"use client";

import Link from "next/link";
import { useParams } from "next/navigation";

import { AppShell } from "@/components/layout/AppShell/AppShell";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";

import {
  type AuditLog,
  useGetAuditLogsQuery,
} from "@/features/audit/auditApi";

import styles from "./audit-logs.module.scss";

export default function AuditLogsPage() {
  return (
    <ProtectedRoute>
      <AuditLogsContent />
    </ProtectedRoute>
  );
}

function AuditLogsContent() {
  const params = useParams();
  const organizationId = params.organizationId as string;

  const {
    data: auditResponse,
    isLoading,
    isError,
  } = useGetAuditLogsQuery(organizationId);

  const logs = auditResponse?.data ?? [];

  /*
   * The API may return either a populated user object or only the user ID.
   * Keeping this logic in helpers prevents the table markup from becoming
   * cluttered with repeated type checks.
   */
  const getUserName = (log: AuditLog) => {
    if (typeof log.userId === "object") {
      return log.userId.name;
    }

    return "Unknown user";
  };

  const getUserEmail = (log: AuditLog) => {
    if (typeof log.userId === "object") {
      return log.userId.email;
    }

    return "";
  };

  /*
   * Audit actions are stored as machine-friendly enum values such as
   * CHANGE_ROLE. The UI converts them into readable text for users.
   */
  const formatAction = (action: AuditLog["action"]) => {
    return action.replaceAll("_", " ");
  };

  /*
   * Entity names can also contain underscores. Capitalizing each word
   * gives the audit table a consistent human-readable representation.
   */
  const formatEntity = (entity: string) => {
    return entity
      .replaceAll("_", " ")
      .replace(/\b\w/g, (character) =>
        character.toUpperCase(),
      );
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString();
  };

  /*
   * Metadata is intentionally kept flexible on the backend because
   * different audit actions can record different information.
   *
   * This formatter converts primitive values and nested objects into
   * readable text without allowing an unexpected object value to break
   * the audit-log table.
   */
  const formatMetadata = (
    metadata: Record<string, unknown>,
  ) => {
    if (Object.keys(metadata).length === 0) {
      return "No additional details";
    }

    return Object.entries(metadata)
      .map(([key, value]) => {
        let displayValue: string;

        if (
          typeof value === "object" &&
          value !== null
        ) {
          try {
            displayValue = JSON.stringify(value);
          } catch {
            displayValue = "[Object]";
          }
        } else {
          displayValue = String(value);
        }

        return `${key}: ${displayValue}`;
      })
      .join(" • ");
  };

  return (
    <AppShell>
      <div className={styles.page}>
        <div className={styles.header}>
          <div>
            <Link
              href={`/organizations/${organizationId}`}
              className={styles.backLink}
            >
              ← Organization
            </Link>

            <h1>Audit Logs</h1>

            <p>
              Review important activity performed within
              this organization.
            </p>
          </div>
        </div>

        {isLoading && (
          <div
            className={styles.state}
            role="status"
            aria-live="polite"
          >
            Loading audit logs...
          </div>
        )}

        {isError && (
          <div
            className={`${styles.state} ${styles.error}`}
            role="alert"
          >
            <h2>Unable to load audit logs</h2>

            <p>
              You may not have permission to view audit
              logs, or the server may be unavailable.
            </p>
          </div>
        )}

        {!isLoading &&
          !isError &&
          logs.length === 0 && (
            <div className={styles.empty}>
              <h2>No audit activity yet</h2>

              <p>
                Organization activity will appear here as
                actions are performed.
              </p>
            </div>
          )}

        {!isLoading &&
          !isError &&
          logs.length > 0 && (
            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <caption className="sr-only">
                  Organization audit activity
                </caption>

                <thead>
                  <tr>
                    <th scope="col">Action</th>
                    <th scope="col">Entity</th>
                    <th scope="col">User</th>
                    <th scope="col">Date</th>
                    <th scope="col">Details</th>
                  </tr>
                </thead>

                <tbody>
                  {logs.map((log) => {
                    const metadata = formatMetadata(
                      log.metadata,
                    );

                    return (
                      <tr key={log._id}>
                        <td>
                          <span
                            className={`${styles.actionBadge} ${
                              styles[
                                `action_${log.action.toLowerCase()}`
                              ]
                            }`}
                          >
                            {formatAction(log.action)}
                          </span>
                        </td>

                        <td>
                          <span className={styles.entity}>
                            {formatEntity(log.entity)}
                          </span>
                        </td>

                        <td>
                          <div className={styles.user}>
                            <strong>
                              {getUserName(log)}
                            </strong>

                            {getUserEmail(log) && (
                              <span>
                                {getUserEmail(log)}
                              </span>
                            )}
                          </div>
                        </td>

                        <td>
                          <time
                            dateTime={log.createdAt}
                            className={styles.date}
                          >
                            {formatDate(log.createdAt)}
                          </time>
                        </td>

                        <td>
                          <span
                            className={styles.metadata}
                            title={metadata}
                          >
                            {metadata}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
      </div>
    </AppShell>
  );
}
