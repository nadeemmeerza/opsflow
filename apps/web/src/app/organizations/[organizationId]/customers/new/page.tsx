'use client';

import { useParams } from 'next/navigation';

import CreateCustomerForm from '@/features/customers/CreateCustomerForm';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { AppShell } from '@/components/layout/AppShell/AppShell';

export default function NewCustomerPage() {
  const params = useParams();

  const organizationId = params.organizationId as string;

  return (
    <ProtectedRoute>
      <AppShell>
        <main>
          <h1>New Customer</h1>
          <p>Create a customer for this organization.</p>

          <CreateCustomerForm organizationId={organizationId} />
        </main>
      </AppShell>
    </ProtectedRoute>
  );
}