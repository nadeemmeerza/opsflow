'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';



import {
  useGetProjectQuery,
} from '@/features/projects/projectsApi';

import EditProjectForm from '@/features/projects/EditProjectForm';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { AppShell } from '@/components/layout/AppShell/AppShell';

export default function EditProjectPage() {
  const params = useParams();

  const organizationId =
    params.organizationId as string;

  const projectId =
    params.projectId as string;

  const {
    data,
    isLoading,
    isError,
  } = useGetProjectQuery({
    organizationId,
    projectId,
  });

  const project = data?.data;

  return (
    <ProtectedRoute>
      <AppShell>
        <div style={{ padding: '32px' }}>
          <Link
            href={`/organizations/${organizationId}/projects/${projectId}`}
          >
            ← Back to project
          </Link>

          <h1>Edit Project</h1>

          {isLoading && (
            <p>Loading project...</p>
          )}

          {isError && (
            <p>
              Unable to load this project.
            </p>
          )}

          {project && (
            <EditProjectForm
              organizationId={organizationId}
              project={project}
            />
          )}
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}