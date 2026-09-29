'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';



import EditTaskForm from '@/features/tasks/EditTaskForm';
import {
  useGetTaskQuery,
} from '@/features/tasks/tasksApi';

import styles from './edit-task.module.scss';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { AppShell } from '@/components/layout/AppShell/AppShell';

export default function EditTaskPage() {
  const params = useParams<{
    organizationId: string;
    projectId: string;
    taskId: string;
  }>();

  const {
    organizationId,
    projectId,
    taskId,
  } = params;

  const {
    data,
    isLoading,
    isError,
  } = useGetTaskQuery({
    organizationId,
    projectId,
    taskId,
  });

  const task = data?.data;

  return (
    <ProtectedRoute>
      <AppShell>
        <main className={styles.page}>
          <Link
            href={`/organizations/${organizationId}/projects/${projectId}/tasks/${taskId}`}
            className={styles.backLink}
          >
            ← Back to Task
          </Link>

          <div className={styles.header}>
            <h1>Edit Task</h1>

            <p>
              Update task information and workflow
              status.
            </p>
          </div>

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
            <EditTaskForm
              organizationId={organizationId}
              projectId={projectId}
              task={task}
            />
          )}
        </main>
      </AppShell>
    </ProtectedRoute>
  );
}