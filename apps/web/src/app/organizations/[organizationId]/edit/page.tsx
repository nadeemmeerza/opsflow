'use client';

import { useParams } from 'next/navigation';

import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { EditOrganizationForm } from '@/features/organizations/EditOrganizationForm';

export default function EditOrganizationPage() {
  const params = useParams();

  const organizationId = params.organizationId as string;

  return (
    <ProtectedRoute>
      <EditOrganizationForm
        organizationId={organizationId}
      />
    </ProtectedRoute>
  );
}