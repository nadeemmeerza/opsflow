'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';

import { AppShell } from '@/components/layout/AppShell/AppShell';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';

import {
  getApiErrorMessage,
} from '@/store/api/apiSlice';

import {
  useNotification,
} from '@/components/notifications/NotificationContext';

import {
  useDeleteOrganizationMutation,
  useGetOrganizationQuery,
  useUpdateOrganizationMutation,
} from '@/features/organizations/organizationsApi';

import styles from './settings.module.scss';

/*
 * Form values used by the organization settings form.
 *
 * The status values match the organization status
 * supported by the backend.
 */
interface OrganizationFormValues {
  name: string;
  slug: string;
  status: 'active' | 'suspended';
}

export default function OrganizationSettingsPage() {
  /*
   * Keep authentication protection at the page boundary
   * so every settings operation requires a logged-in user.
   */
  return (
    <ProtectedRoute>
      <OrganizationSettingsContent />
    </ProtectedRoute>
  );
}

function OrganizationSettingsContent() {
  const params = useParams();
  const router = useRouter();

  const organizationId =
    params.organizationId as string;

  /*
   * Global notification methods.
   *
   * NotificationContext exposes success/error/warning/info
   * rather than exposing its internal notify() function.
   */
  const {
    success,
    error,
    warning,
  } = useNotification();

  /*
   * Load the organization that owns this settings page.
   */
  const {
    data,
    isLoading,
    isError,
  } = useGetOrganizationQuery(
    organizationId,
  );

  const organization = data?.data;

  /*
   * Update organization mutation.
   */
  const [
    updateOrganization,
    {
      isLoading: isUpdating,
    },
  ] = useUpdateOrganizationMutation();

  /*
   * Delete organization mutation.
   */
  const [
    deleteOrganization,
    {
      isLoading: isDeleting,
    },
  ] = useDeleteOrganizationMutation();

  /*
   * Delete confirmation is intentionally separate from
   * the normal form. The user must type the exact
   * organization name before deletion is allowed.
   */
  const [
    showDeleteConfirmation,
    setShowDeleteConfirmation,
  ] = useState(false);

  const [
    deleteConfirmation,
    setDeleteConfirmation,
  ] = useState('');

  /*
   * React Hook Form manages validation and form state.
   *
   * The form starts empty because the organization data
   * is loaded asynchronously from the API.
   */
  const {
    register,
    handleSubmit,
    reset,
    formState: {
      errors,
      isDirty,
    },
  } = useForm<OrganizationFormValues>({
    defaultValues: {
      name: '',
      slug: '',
      status: 'active',
    },
  });

  /*
   * Populate the form when the organization has been
   * successfully loaded.
   */
  useEffect(() => {
    if (!organization) {
      return;
    }

    reset({
      name: organization.name,
      slug: organization.slug,
      status: organization.status,
    });
  }, [
    organization,
    reset,
  ]);

  /*
   * Save organization changes.
   *
   * The backend remains responsible for authorization,
   * uniqueness checks, and persistence.
   */
  const onSubmit = async (
    formData: OrganizationFormValues,
  ) => {
    try {
      await updateOrganization({
        organizationId,
        data: formData,
      }).unwrap();

      /*
       * Resetting the form makes the current values the
       * new clean state, so Save becomes disabled until
       * another change is made.
       */
      reset(formData);

      success(
        'Organization updated successfully.',
      );
    } catch (requestError) {
      /*
       * Convert the backend error into one or more
       * human-readable notification messages.
       */
      const messages =
        getApiErrorMessage(requestError);

      messages.forEach((message) => {
        error(message);
      });
    }
  };

  /*
   * Start the delete confirmation workflow.
   */
  const openDeleteConfirmation = () => {
    setDeleteConfirmation('');
    setShowDeleteConfirmation(true);
  };

  /*
   * Cancel deletion and clear the confirmation input.
   */
  const cancelDeleteConfirmation = () => {
    setDeleteConfirmation('');
    setShowDeleteConfirmation(false);
  };

  /*
   * Delete the organization only when the user has typed
   * its exact name.
   */
  const handleDeleteOrganization = async () => {
    if (!organization) {
      return;
    }

    if (
      deleteConfirmation !==
      organization.name
    ) {
      warning(
        'Please type the organization name exactly as shown to confirm deletion.',
      );

      return;
    }

    try {
      await deleteOrganization(
        organizationId,
      ).unwrap();

      success(
        'Organization deleted successfully.',
      );

      /*
       * The organization no longer exists, so return
       * the user to the organization list.
       */
      router.push('/organizations');
    } catch (requestError) {
      const messages =
        getApiErrorMessage(requestError);

      messages.forEach((message) => {
        error(message);
      });
    }
  };

  /*
   * Loading state while the organization is being
   * retrieved from the API.
   */
  if (isLoading) {
    return (
      <AppShell>
        <main className={styles.page}>
          <div className={styles.state}>
            Loading organization settings...
          </div>
        </main>
      </AppShell>
    );
  }

  /*
   * Handle both API failure and an unexpected missing
   * organization response.
   */
  if (isError || !organization) {
    return (
      <AppShell>
        <main className={styles.page}>
          <div
            className={`${styles.state} ${styles.error}`}
          >
            Failed to load organization settings.
          </div>
        </main>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <main className={styles.page}>
        {/* Page heading */}
        <header className={styles.header}>
          <div>
            <h1>Organization Settings</h1>

            <p>
              Manage your organization information
              and account settings.
            </p>
          </div>
        </header>

        {/* Read-only organization information */}
        <section className={styles.card}>
          <div className={styles.cardHeader}>
            <div>
              <h2>Organization Information</h2>

              <p>
                Current information for this
                organization.
              </p>
            </div>
          </div>

          <div className={styles.infoGrid}>
            <div className={styles.infoItem}>
              <span className={styles.label}>
                Name
              </span>

              <strong className={styles.value}>
                {organization.name}
              </strong>
            </div>

            <div className={styles.infoItem}>
              <span className={styles.label}>
                Slug
              </span>

              <strong className={styles.value}>
                {organization.slug}
              </strong>
            </div>

            <div className={styles.infoItem}>
              <span className={styles.label}>
                Status
              </span>

              <span
                className={`${styles.status} ${
                  organization.status === 'active'
                    ? styles.active
                    : styles.suspended
                }`}
              >
                {organization.status}
              </span>
            </div>

            <div className={styles.infoItem}>
              <span className={styles.label}>
                Organization ID
              </span>

              <span className={styles.value}>
                {organization._id}
              </span>
            </div>
          </div>
        </section>

        {/* Organization edit form */}
        <section className={styles.card}>
          <div className={styles.cardHeader}>
            <div>
              <h2>Edit Organization</h2>

              <p>
                Update the name, slug, or status of
                this organization.
              </p>
            </div>
          </div>

          <form
            className={styles.form}
            onSubmit={handleSubmit(onSubmit)}
          >
            {/* Organization name */}
            <div className={styles.formGroup}>
              <label htmlFor="name">
                Organization Name
              </label>

              <input
                id="name"
                type="text"
                {...register('name', {
                  required:
                    'Organization name is required.',

                  minLength: {
                    value: 2,
                    message:
                      'Organization name must be at least 2 characters.',
                  },

                  maxLength: {
                    value: 100,
                    message:
                      'Organization name cannot exceed 100 characters.',
                  },
                })}
              />

              {errors.name && (
                <p className={styles.fieldError}>
                  {errors.name.message}
                </p>
              )}
            </div>

            {/* Organization slug */}
            <div className={styles.formGroup}>
              <label htmlFor="slug">
                Organization Slug
              </label>

              <input
                id="slug"
                type="text"
                {...register('slug', {
                  required:
                    'Organization slug is required.',

                  minLength: {
                    value: 2,
                    message:
                      'Organization slug must be at least 2 characters.',
                  },

                  maxLength: {
                    value: 100,
                    message:
                      'Organization slug cannot exceed 100 characters.',
                  },

                  pattern: {
                    value:
                      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,

                    message:
                      'Use lowercase letters, numbers, and hyphens only.',
                  },
                })}
              />

              <p className={styles.helpText}>
                Example: acme-company
              </p>

              {errors.slug && (
                <p className={styles.fieldError}>
                  {errors.slug.message}
                </p>
              )}
            </div>

            {/* Organization status */}
            <div className={styles.formGroup}>
              <label htmlFor="status">
                Status
              </label>

              <select
                id="status"
                {...register('status')}
              >
                <option value="active">
                  Active
                </option>

                <option value="suspended">
                  Suspended
                </option>
              </select>

              {errors.status && (
                <p className={styles.fieldError}>
                  {errors.status.message}
                </p>
              )}
            </div>

            {/* Save action */}
            <div className={styles.actions}>
              <button
                type="submit"
                disabled={
                  isUpdating || !isDirty
                }
                className={styles.saveButton}
              >
                {isUpdating
                  ? 'Saving...'
                  : 'Save Changes'}
              </button>
            </div>
          </form>
        </section>

        {/* Destructive organization action */}
        <section
          className={`${styles.card} ${styles.dangerCard}`}
        >
          <div className={styles.cardHeader}>
            <div>
              <h2>Danger Zone</h2>

              <p>
                Permanently delete this
                organization and its associated
                data.
              </p>
            </div>
          </div>

          {!showDeleteConfirmation ? (
            <div className={styles.deleteActions}>
              <button
                type="button"
                className={styles.deleteButton}
                onClick={
                  openDeleteConfirmation
                }
              >
                Delete Organization
              </button>
            </div>
          ) : (
            <div
              className={
                styles.deleteConfirmation
              }
            >
              <div className={styles.warning}>
                <strong>
                  This action cannot be undone.
                </strong>

                <p>
                  To confirm deletion, type the
                  organization name exactly:
                </p>

                <strong>
                  {organization.name}
                </strong>
              </div>

              <div
                className={styles.formGroup}
              >
                <label htmlFor="deleteConfirmation">
                  Organization Name
                </label>

                <input
                  id="deleteConfirmation"
                  type="text"
                  value={deleteConfirmation}
                  onChange={(event) =>
                    setDeleteConfirmation(
                      event.target.value,
                    )
                  }
                  placeholder={
                    organization.name
                  }
                  autoComplete="off"
                />
              </div>

              <div
                className={styles.deleteActions}
              >
                <button
                  type="button"
                  className={
                    styles.cancelButton
                  }
                  onClick={
                    cancelDeleteConfirmation
                  }
                  disabled={isDeleting}
                >
                  Cancel
                </button>

                <button
                  type="button"
                  className={
                    styles.deleteButton
                  }
                  onClick={
                    handleDeleteOrganization
                  }
                  disabled={
                    isDeleting ||
                    deleteConfirmation !==
                      organization.name
                  }
                >
                  {isDeleting
                    ? 'Deleting...'
                    : 'Permanently Delete'}
                </button>
              </div>
            </div>
          )}
        </section>
      </main>
    </AppShell>
  );
}