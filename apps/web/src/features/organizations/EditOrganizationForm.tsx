'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

import {
  useGetOrganizationQuery,
  useUpdateOrganizationMutation,
} from './organizationsApi';

import { zodResolver } from '@hookform/resolvers/zod';
import {
  useForm,
} from 'react-hook-form';

import {
  z,
} from 'zod';

import {
  AppShell,
} from '@/components/layout/AppShell/AppShell';

import styles from './EditOrganizationForm.module.scss';

const editOrganizationSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be at most 100 characters'),

  slug: z
    .string()
    .trim()
    .min(2, 'Slug must be at least 2 characters')
    .max(100, 'Slug must be at most 100 characters')
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      'Slug must contain only lowercase letters, numbers and hyphens',
    ),

  status: z.enum([
    'active',
    'suspended',
  ]),
});

type EditOrganizationFormData =
  z.infer<typeof editOrganizationSchema>;

interface EditOrganizationFormProps {
  organizationId: string;
}

export function EditOrganizationForm({
  organizationId,
}: EditOrganizationFormProps) {
  const router = useRouter();

  const {
    data,
    isLoading: isOrganizationLoading,
    isError,
  } = useGetOrganizationQuery(
    organizationId,
  );

  const [
    updateOrganization,
    {
      isLoading: isUpdating,
    },
  ] = useUpdateOrganizationMutation();

  const {
    register,
    handleSubmit,
    reset,
    formState: {
      errors,
    },
  } = useForm<EditOrganizationFormData>({
    resolver: zodResolver(
      editOrganizationSchema,
    ),
  });

  useEffect(() => {
    if (!data?.data) {
      return;
    }

    reset({
      name: data.data.name,
      slug: data.data.slug,
      status: data.data.status,
    });
  }, [data, reset]);

  const onSubmit = async (
    formData: EditOrganizationFormData,
  ) => {
    try {
      await updateOrganization({
        organizationId,
        data: formData,
      }).unwrap();

      router.push(
        `/organizations/${organizationId}`,
      );
    } catch (error) {
      console.error(
        'Failed to update organization:',
        error,
      );
    }
  };

  if (isOrganizationLoading) {
    return (
      <AppShell>
        <div className={styles.state}>
          Loading organization...
        </div>
      </AppShell>
    );
  }

  if (isError || !data?.data) {
    return (
      <AppShell>
        <div className={styles.state}>
          Organization not found.
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <main className={styles.container}>
        <div className={styles.header}>
          <div>
            <h1>Edit Organization</h1>

            <p>
              Update your organization information.
            </p>
          </div>
        </div>

        <form
          className={styles.form}
          onSubmit={handleSubmit(onSubmit)}
        >
          <div className={styles.field}>
            <label htmlFor="name">
              Organization name
            </label>

            <input
              id="name"
              type="text"
              {...register('name')}
            />

            {errors.name && (
              <p className={styles.error}>
                {errors.name.message}
              </p>
            )}
          </div>

          <div className={styles.field}>
            <label htmlFor="slug">
              Slug
            </label>

            <input
              id="slug"
              type="text"
              {...register('slug')}
            />

            {errors.slug && (
              <p className={styles.error}>
                {errors.slug.message}
              </p>
            )}
          </div>

          <div className={styles.field}>
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
              <p className={styles.error}>
                {errors.status.message}
              </p>
            )}
          </div>

          <div className={styles.actions}>
            <button
              type="button"
              className={styles.cancelButton}
              onClick={() =>
                router.push(
                  `/organizations/${organizationId}`,
                )
              }
            >
              Cancel
            </button>

            <button
              type="submit"
              className={styles.saveButton}
              disabled={isUpdating}
            >
              {isUpdating
                ? 'Saving...'
                : 'Save changes'}
            </button>
          </div>
        </form>
      </main>
    </AppShell>
  );
}