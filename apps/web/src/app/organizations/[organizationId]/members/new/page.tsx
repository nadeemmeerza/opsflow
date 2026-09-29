'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';

import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { AppShell } from '@/components/layout/AppShell/AppShell';

import { AddOrganizationMemberForm } from '@/features/organizations/AddOrganizationMemberForm';

import styles from './new-member.module.scss';

export default function NewOrganizationMemberPage() {
  return (
    <ProtectedRoute>
      <NewMemberContent />
    </ProtectedRoute>
  );
}

function NewMemberContent() {
  const params = useParams();
  const organizationId = params.organizationId as string;

  const router = useRouter();

  const handleSuccess = () => {
    router.push(
      `/organizations/${organizationId}/members`,
    );
  };

  return (
    <AppShell>
      <main className={styles.container}>
        <Link
          href={`/organizations/${organizationId}/members`}
          className={styles.backLink}
        >
          ← Members
        </Link>

        <header className={styles.header}>
          <h1>Add Member</h1>

          <p>
            Add an existing OpsFlow user to this
            organization.
          </p>
        </header>

        <section className={styles.card}>
          <AddOrganizationMemberForm
            organizationId={organizationId}
            onSuccess={handleSuccess}
          />
        </section>
      </main>
    </AppShell>
  );
}