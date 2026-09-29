'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';

import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { AppShell } from '@/components/layout/AppShell/AppShell';
import {
  useNotification,
} from '@/components/notifications/NotificationContext';
import { getApiErrorMessage } from '@/store/api/apiSlice';

import {
  useDeleteCustomerMutation,
  useGetCustomerQuery,
} from '@/features/customers/customersApi';

import styles from './customer-details.module.scss';

export default function CustomerDetailsPage() {
  const params = useParams();
  const router = useRouter();

  /*
   * Get the organization and customer IDs from the
   * dynamic route:
   *
   * /organizations/[organizationId]/customers/[customerId]
   */
  const organizationId = params.organizationId as string;
  const customerId = params.customerId as string;

  /*
   * Global notification functions.
   *
   * success() displays a successful operation message.
   * error() displays an error notification.
   */
  const {
    success,
    error: showError,
  } = useNotification();

  /*
   * Load the customer details from the API.
   */
  const {
    data,
    isLoading,
    isError,
  } = useGetCustomerQuery({
    organizationId,
    customerId,
  });

  /*
   * RTK Query mutation used to delete the customer.
   */
  const [deleteCustomer, { isLoading: isDeleting }] =
    useDeleteCustomerMutation();

  const customer = data?.data;

  /*
   * Handles the destructive delete operation.
   */
  const handleDelete = async () => {
    // Safety check in case customer data is unavailable.
    if (!customer) return;

    /*
     * Ask the user to confirm before permanently
     * deleting the customer.
     */
    const confirmed = window.confirm(
      `Are you sure you want to delete "${customer.name}"?`,
    );

    // Stop if the user cancels the operation.
    if (!confirmed) return;

    try {
      /*
       * Send DELETE request to the NestJS backend.
       *
       * unwrap() converts an unsuccessful API response
       * into a rejected promise so it can be handled
       * by the catch block below.
       */
      await deleteCustomer({
        organizationId,
        customerId: customer._id,
      }).unwrap();

      /*
       * Show global success feedback before navigating
       * back to the customer list.
       */
      success('Customer deleted successfully.');

      /*
       * Return the user to the customer list after
       * successful deletion.
       */
      router.push(
        `/organizations/${organizationId}/customers`,
      );
    } catch (error) {
      /*
       * Convert the backend error into our standard
       * string[] format.
       */
      const messages = getApiErrorMessage(error);

      console.error(
        'Failed to delete customer:',
        error,
      );

      /*
       * Show the first useful API error in the global
       * notification system.
       */
      showError(
        messages[0] ?? 'Failed to delete customer.',
      );
    }
  };

  /*
   * Loading state while customer information is being
   * retrieved from the API.
   */
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

  /*
   * Error state when the customer cannot be loaded.
   */
  if (isError || !customer) {
    return (
      <ProtectedRoute>
        <AppShell>
          <main className={styles.page}>
            <p className={styles.error}>
              Failed to load customer.
            </p>

            <Link
              href={`/organizations/${organizationId}/customers`}
            >
              Back to Customers
            </Link>
          </main>
        </AppShell>
      </ProtectedRoute>
    );
  }

  /*
   * Normal customer details page.
   */
  return (
    <ProtectedRoute>
      <AppShell>
        <main className={styles.page}>
          <div className={styles.header}>
            <div>
              <h1>{customer.name}</h1>
              <p>Customer details</p>
            </div>

            <div className={styles.actions}>
              {/* Return to the customer list */}
              <Link
                href={`/organizations/${organizationId}/customers`}
                className={styles.backButton}
              >
                Back
              </Link>

              {/* Open the customer edit page */}
              <Link
                href={`/organizations/${organizationId}/customers/${customer._id}/edit`}
                className={styles.editButton}
              >
                Edit Customer
              </Link>

              {/* Delete customer */}
              <button
                type="button"
                className={styles.deleteButton}
                onClick={handleDelete}
                disabled={isDeleting}
              >
                {isDeleting
                  ? 'Deleting...'
                  : 'Delete Customer'}
              </button>
            </div>
          </div>

          <section className={styles.card}>
            <h2>Customer Information</h2>

            <div className={styles.grid}>
              <div>
                <span className={styles.label}>
                  Name
                </span>
                <p>{customer.name}</p>
              </div>

              <div>
                <span className={styles.label}>
                  Email
                </span>
                <p>{customer.email}</p>
              </div>

              <div>
                <span className={styles.label}>
                  Phone
                </span>
                <p>{customer.phone || '—'}</p>
              </div>

              <div>
                <span className={styles.label}>
                  Company
                </span>
                <p>{customer.company || '—'}</p>
              </div>

              <div>
                <span className={styles.label}>
                  Status
                </span>
                <p className={styles.status}>
                  {customer.status}
                </p>
              </div>

              <div>
                <span className={styles.label}>
                  Created
                </span>
                <p>
                  {new Date(
                    customer.createdAt,
                  ).toLocaleString()}
                </p>
              </div>

              <div>
                <span className={styles.label}>
                  Updated
                </span>
                <p>
                  {new Date(
                    customer.updatedAt,
                  ).toLocaleString()}
                </p>
              </div>
            </div>

            <div className={styles.section}>
              <h3>Notes</h3>
              <p>
                {customer.notes || 'No notes.'}
              </p>
            </div>
          </section>
        </main>
      </AppShell>
    </ProtectedRoute>
  );
}