'use client';

import { useParams } from 'next/navigation';



import CreateTaskForm from '@/features/tasks/CreateTaskForm';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { AppShell } from '@/components/layout/AppShell/AppShell';

export default function NewTaskPage() {
  const params = useParams<{
    organizationId: string;
    projectId: string;
  }>();

  const { organizationId, projectId } = params;

  return (
    <ProtectedRoute>
      <AppShell>
        <main>
          <h1>Create Task</h1>

          <p>
            Create a task for this project.
          </p>

          <CreateTaskForm
            organizationId={organizationId}
            projectId={projectId}
          />
        </main>
      </AppShell>
    </ProtectedRoute>
  );
}