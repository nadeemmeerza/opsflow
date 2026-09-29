"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useNotification } from "@/components/notifications/NotificationContext";
import { getApiErrorMessage } from "@/store/api/apiSlice";

import {
  useDeleteTaskMutation,
  useGetTaskQuery,
  type Task,
} from "@/features/tasks/tasksApi";

import styles from "./task-details.module.scss";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { AppShell } from "@/components/layout/AppShell/AppShell";

function getAssigneeName(task: Task): string {
  if (!task.assigneeId) {
    return "Unassigned";
  }

  if (typeof task.assigneeId === "object") {
    return task.assigneeId.name;
  }

  return "Assigned";
}

export default function TaskDetailsPage() {
  const params = useParams<{
    organizationId: string;
    projectId: string;
    taskId: string;
  }>();

  const router = useRouter();

  const {
    success,
    error: showError,
  } = useNotification();

  const { organizationId, projectId, taskId } = params;

  const {
    data,
    isLoading,
    isError,
  } = useGetTaskQuery({
    organizationId,
    projectId,
    taskId,
  });

  const [
    deleteTask,
    { isLoading: isDeleting },
  ] = useDeleteTaskMutation();

  const task = data?.data;

  const handleDelete = async () => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${task?.title}"?`,
    );

    if (!confirmed || !task) {
      return;
    }

    try {
      await deleteTask({
        organizationId,
        projectId,
        taskId: task._id,
      }).unwrap();

      success("Task deleted successfully.");

      router.push(
        `/organizations/${organizationId}/projects/${projectId}/tasks`,
      );
    } catch (error) {
      const messages =
        getApiErrorMessage(error);

      console.error(
        "Failed to delete task:",
        error,
      );

      showError(
        messages[0] ??
          "Failed to delete task.",
      );
    }
  };

  return (
    <ProtectedRoute>
      <AppShell>
        <main className={styles.page}>
          <Link
            href={`/organizations/${organizationId}/projects/${projectId}/tasks`}
            className={styles.backLink}
          >
            ← Back to Tasks
          </Link>

          {isLoading && (
            <div className={styles.message}>
              Loading task...
            </div>
          )}

          {isError && (
            <div className={styles.error}>
              Failed to load task.
            </div>
          )}

          {task && (
            <>
              <div className={styles.header}>
                <div>
                  <h1>{task.title}</h1>

                  <p>Task details</p>
                </div>

                <div className={styles.actions}>
                  <Link
                    href={`/organizations/${organizationId}/projects/${projectId}/tasks/${taskId}/edit`}
                    className={styles.editButton}
                  >
                    Edit Task
                  </Link>

                  <button
                    type="button"
                    className={styles.deleteButton}
                    onClick={handleDelete}
                    disabled={isDeleting}
                  >
                    {isDeleting
                      ? "Deleting..."
                      : "Delete Task"}
                  </button>
                </div>
              </div>

              <section className={styles.card}>
                <div className={styles.description}>
                  <h2>Description</h2>

                  <p>
                    {task.description ||
                      "No description provided."}
                  </p>
                </div>

                <div className={styles.details}>
                  <div className={styles.detail}>
                    <span>Status</span>

                    <strong>
                      {task.status}
                    </strong>
                  </div>

                  <div className={styles.detail}>
                    <span>Priority</span>

                    <strong>
                      {task.priority}
                    </strong>
                  </div>

                  <div className={styles.detail}>
                    <span>Assignee</span>

                    <strong>
                      {getAssigneeName(task)}
                    </strong>
                  </div>

                  <div className={styles.detail}>
                    <span>Due date</span>

                    <strong>
                      {task.dueDate
                        ? new Date(
                            task.dueDate,
                          ).toLocaleDateString()
                        : "No due date"}
                    </strong>
                  </div>

                  <div className={styles.detail}>
                    <span>Created</span>

                    <strong>
                      {new Date(
                        task.createdAt,
                      ).toLocaleString()}
                    </strong>
                  </div>

                  <div className={styles.detail}>
                    <span>Last updated</span>

                    <strong>
                      {new Date(
                        task.updatedAt,
                      ).toLocaleString()}
                    </strong>
                  </div>
                </div>
              </section>
            </>
          )}
        </main>
      </AppShell>
    </ProtectedRoute>
  );
}
