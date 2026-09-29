'use client';

import { useParams } from 'next/navigation';

import CreateProjectForm from '@/features/projects/CreateProjectForm';
import { AppShell } from '@/components/layout/AppShell/AppShell';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';

export default function NewProjectPage() {
  const params = useParams();

  const organizationId =
    params.organizationId as string;

  return (
    <ProtectedRoute>
      <AppShell>
        <div style={{ padding: '32px' }}>
          <h1>Create Project</h1>

          <p>
            Create a new project for this
            organization.
          </p>

          <CreateProjectForm
            organizationId={organizationId}
          />
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}