'use client';

import { useParams, useRouter } from 'next/navigation';



import EditCustomerForm from '@/features/customers/EditCustomerForm';
import { useGetCustomerQuery } from '@/features/customers/customersApi';

import styles from './edit-customer.module.scss';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { AppShell } from '@/components/layout/AppShell/AppShell';

export default function EditCustomerPage() {
  const params = useParams();
  const router = useRouter();

  const organizationId = params.organizationId as string;
  const customerId = params.customerId as string;

  const {
    data,
    isLoading,
    isError,
  } = useGetCustomerQuery({
    organizationId,
    customerId,
  });

  if (isLoading) {
    return (
      <ProtectedRoute>
        <AppShell>
          <main className={styles.page}>
            <p>Loading customer...</p>
          </main>
        </AppShell>
      </ProtectedRoute>
    );
  }

  if (isError || !data?.data) {
    return (
      <ProtectedRoute>
        <AppShell>
          <main className={styles.page}>
            <p>Customer not found.</p>
          </main>
        </AppShell>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <AppShell>
        <main className={styles.page}>
          <div className={styles.header}>
            <h1>Edit Customer</h1>
            <p>Update customer information.</p>
          </div>

          <EditCustomerForm
            organizationId={organizationId}
            customer={data.data}
            onSuccess={() =>
              router.push(
                `/organizations/${organizationId}/customers/${customerId}`,
              )
            }
          />
        </main>
      </AppShell>
    </ProtectedRoute>
  );
}