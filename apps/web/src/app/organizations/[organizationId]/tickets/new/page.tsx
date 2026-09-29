'use client';

import { useParams } from 'next/navigation';



import CreateTicketForm from '@/features/tickets/CreateTicketForm';

import styles from './new-ticket.module.scss';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { AppShell } from '@/components/layout/AppShell/AppShell';

export default function NewTicketPage() {
  const params = useParams();

  const organizationId =
    params.organizationId as string;

  return (
    <ProtectedRoute>
      <AppShell>
        <div className={styles.page}>
          <div className={styles.header}>
            <h1>Create Ticket</h1>

            <p>
              Create a support ticket for a customer.
            </p>
          </div>

          <CreateTicketForm
            organizationId={organizationId}
          />
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}