"use client";

import Link from "next/link";
import { useParams } from "next/navigation";

import { AppShell } from "@/components/layout/AppShell/AppShell";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";

import {
  useGetDashboardQuery,
  type DashboardStats,
} from "@/features/dashboard/dashboardApi";

import {
  type AuditLog,
  useGetAuditLogsQuery,
} from "@/features/audit/auditApi";

import styles from "./dashboard.module.scss";

function getActivityDescription(log: AuditLog) {
  const metadata = log.metadata;

  if (log.action === "CREATE") {
    if (typeof metadata.name === "string") {
      return `created "${metadata.name}"`;
    }

    if (typeof metadata.title === "string") {
      return `created "${metadata.title}"`;
    }

    return "created a new record";
  }

  if (log.action === "UPDATE") {
    if (Array.isArray(metadata.updatedFields)) {
      const fields = metadata.updatedFields.filter(
        (field): field is string => typeof field === "string",
      );

      if (fields.length > 0) {
        return `updated ${fields.join(", ")}`;
      }
    }

    return "updated a record";
  }

  if (log.action === "DELETE") {
    return "deleted a record";
  }

  if (log.action === "ADD_MEMBER") {
    const role =
      typeof metadata.role === "string"
        ? metadata.role
        : "member";

    return `added a ${role}`;
  }

  if (log.action === "REMOVE_MEMBER") {
    return "removed a member";
  }

  if (log.action === "CHANGE_ROLE") {
    const role =
      typeof metadata.role === "string"
        ? metadata.role
        : "member";

    return `changed a member role to ${role}`;
  }

  if (log.action === "LOGIN") {
    return "logged in";
  }

  return "performed an action";
}

function formatRelativeTime(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();

  const differenceInSeconds = Math.floor(
    (now.getTime() - date.getTime()) / 1000,
  );

  if (differenceInSeconds < 60) {
    return "just now";
  }

  const minutes = Math.floor(differenceInSeconds / 60);

  if (minutes < 60) {
    return `${minutes} ${
      minutes === 1 ? "minute" : "minutes"
    } ago`;
  }

  const hours = Math.floor(minutes / 60);

  if (hours < 24) {
    return `${hours} ${
      hours === 1 ? "hour" : "hours"
    } ago`;
  }

  const days = Math.floor(hours / 24);

  if (days < 7) {
    return `${days} ${
      days === 1 ? "day" : "days"
    } ago`;
  }

  return date.toLocaleDateString();
}

function ActivityItem({ log }: { log: AuditLog }) {
  const user =
    typeof log.userId === "object"
      ? log.userId.name
      : "Unknown user";

  const description = getActivityDescription(log);
  const time = formatRelativeTime(log.createdAt);

  return (
    <div className={styles.activityItem}>
      <div className={styles.activityAction}>
        <span className={styles.actionBadge}>
          {log.action}
        </span>
      </div>

      <div className={styles.activityDetails}>
        <strong>{log.entity}</strong>

        <span>
          {user} {description}
        </span>
      </div>

      <time className={styles.activityTime}>
        {time}
      </time>
    </div>
  );
}

interface RecentActivityProps {
  logs: AuditLog[];
  isLoading: boolean;
  isError: boolean;
}

function RecentActivity({
  logs,
  isLoading,
  isError,
}: RecentActivityProps) {
  return (
    <section className={styles.activity}>
      <div className={styles.activityHeader}>
        <div>
          <h2>Recent Activity</h2>
          <p>
            Latest activity in this organization.
          </p>
        </div>
      </div>

      {isLoading && (
        <div className={styles.activityState}>
          Loading activity...
        </div>
      )}

      {isError && (
        <div className={styles.activityError}>
          Failed to load recent activity.
        </div>
      )}

      {!isLoading &&
        !isError &&
        logs.length === 0 && (
          <div className={styles.activityState}>
            No recent activity.
          </div>
        )}

      {!isLoading &&
        !isError &&
        logs.length > 0 && (
          <div className={styles.activityList}>
            {logs.slice(0, 10).map((log) => (
              <ActivityItem
                key={log._id}
                log={log}
              />
            ))}
          </div>
        )}
    </section>
  );
}

export default function OrganizationDashboardPage() {
  const params =
    useParams<{ organizationId: string }>();

  const organizationId = params.organizationId;

  const {
    data,
    isLoading,
    isError,
  } = useGetDashboardQuery(organizationId);

  const {
    data: auditData,
    isLoading: isAuditLoading,
    isError: isAuditError,
  } = useGetAuditLogsQuery(organizationId);

  const dashboard = data?.data;

  return (
    <ProtectedRoute>
      <AppShell>
        <div className={styles.page}>
          <div className={styles.header}>
            <div>
              <h1>Dashboard</h1>

              <p>
                Overview of your organization&apos;s
                operations.
              </p>
            </div>

            <Link
              href={`/organizations/${organizationId}`}
              className={styles.backLink}
            >
              ← Organization
            </Link>
          </div>

          {isLoading && (
            <div className={styles.state}>
              Loading dashboard...
            </div>
          )}

          {isError && (
            <div className={styles.error}>
              Failed to load dashboard.
            </div>
          )}

          {dashboard && (
            <>
              {dashboard.overdueTasks > 0 && (
                <div className={styles.alert}>
                  <div>
                    <strong>Overdue Tasks</strong>

                    <p>
                      {dashboard.overdueTasks}{" "}
                      {dashboard.overdueTasks === 1
                        ? "task is"
                        : "tasks are"}{" "}
                      past their due date.
                    </p>
                  </div>

                  <Link
                    href={`/organizations/${organizationId}/projects`}
                    className={styles.alertLink}
                  >
                    View Tasks →
                  </Link>
                </div>
              )}

              <div className={styles.grid}>
                <DashboardCard
                  title="Projects"
                  total={dashboard.projects.total}
                  details={`${dashboard.projects.active} active · ${dashboard.projects.archived} archived`}
                  href={`/organizations/${organizationId}/projects`}
                />

                <TaskDashboardCard
                  tasks={dashboard.tasks}
                  href={`/organizations/${organizationId}/projects`}
                />

                <DashboardCard
                  title="Customers"
                  total={dashboard.customers.total}
                  details={`${dashboard.customers.active} active · ${dashboard.customers.inactive} inactive`}
                  href={`/organizations/${organizationId}/customers`}
                />

                <TicketDashboardCard
                  tickets={dashboard.tickets}
                  href={`/organizations/${organizationId}/tickets`}
                />
              </div>

              <RecentActivity
                logs={auditData?.data ?? []}
                isLoading={isAuditLoading}
                isError={isAuditError}
              />
            </>
          )}
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}

interface DashboardCardProps {
  title: string;
  total: number;
  details: string;
  href: string;
}

function DashboardCard({
  title,
  total,
  details,
  href,
}: DashboardCardProps) {
  return (
    <Link
      href={href}
      className={styles.card}
    >
      <div className={styles.cardHeader}>
        <h2>{title}</h2>

        <span>→</span>
      </div>

      <div className={styles.total}>
        {total}
      </div>

      <p>{details}</p>
    </Link>
  );
}

interface TaskDashboardCardProps {
  tasks: DashboardStats["tasks"];
  href: string;
}

function TaskDashboardCard({
  tasks,
  href,
}: TaskDashboardCardProps) {
  return (
    <Link
      href={href}
      className={styles.card}
    >
      <div className={styles.cardHeader}>
        <h2>Tasks</h2>

        <span>→</span>
      </div>

      <div className={styles.total}>
        {tasks.total}
      </div>

      <div className={styles.taskBreakdown}>
        <div className={styles.taskRow}>
          <span>Todo</span>
          <strong>{tasks.todo}</strong>
        </div>

        <div className={styles.taskRow}>
          <span>In Progress</span>
          <strong>{tasks.inProgress}</strong>
        </div>

        <div className={styles.taskRow}>
          <span>Review</span>
          <strong>{tasks.review}</strong>
        </div>

        <div className={styles.taskRow}>
          <span>Done</span>
          <strong>{tasks.done}</strong>
        </div>
      </div>
    </Link>
  );
}

interface TicketDashboardCardProps {
  tickets: DashboardStats["tickets"];
  href: string;
}

function TicketDashboardCard({
  tickets,
  href,
}: TicketDashboardCardProps) {
  return (
    <Link
      href={href}
      className={styles.card}
    >
      <div className={styles.cardHeader}>
        <h2>Tickets</h2>

        <span>→</span>
      </div>

      <div className={styles.total}>
        {tickets.total}
      </div>

      <div className={styles.ticketBreakdown}>
        <div className={styles.ticketRow}>
          <span>Open</span>
          <strong>{tickets.open}</strong>
        </div>

        <div className={styles.ticketRow}>
          <span>In Progress</span>
          <strong>{tickets.inProgress}</strong>
        </div>

        <div className={styles.ticketRow}>
          <span>Waiting</span>
          <strong>{tickets.waiting}</strong>
        </div>

        <div className={styles.ticketRow}>
          <span>Resolved</span>
          <strong>{tickets.resolved}</strong>
        </div>

        <div className={styles.ticketRow}>
          <span>Closed</span>
          <strong>{tickets.closed}</strong>
        </div>
      </div>
    </Link>
  );
}