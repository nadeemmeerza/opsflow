'use client';

import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

import { useCreateOrganizationMutation } from './organizationsApi';

import styles from './CreateOrganizationForm.module.scss';

const createOrganizationSchema = z.object({
  name: z
    .string()
    .min(2, 'Organization name must be at least 2 characters')
    .max(100, 'Organization name cannot exceed 100 characters'),

  slug: z
    .string()
    .min(2, 'Slug must be at least 2 characters')
    .max(100, 'Slug cannot exceed 100 characters')
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      'Slug can contain lowercase letters, numbers and hyphens only',
    ),
});

type CreateOrganizationFormData = z.infer<
  typeof createOrganizationSchema
>;

export function CreateOrganizationForm() {
  const router = useRouter();

  const [createOrganization, { isLoading, error }] =
    useCreateOrganizationMutation();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateOrganizationFormData>({
    resolver: zodResolver(createOrganizationSchema),
    defaultValues: {
      name: '',
      slug: '',
    },
  });

  const onSubmit = async (
    data: CreateOrganizationFormData,
  ) => {
    try {
      await createOrganization(data).unwrap();

      router.push('/organizations');
    } catch (error) {
      console.error(
        'Failed to create organization:',
        error,
      );
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Create Organization</h1>

        <button
          type="button"
          className={styles.backButton}
          onClick={() => router.push('/organizations')}
        >
          Back
        </button>
      </div>

      <form
        className={styles.form}
        onSubmit={handleSubmit(onSubmit)}
      >
        <div className={styles.field}>
          <label htmlFor="name">
            Organization Name
          </label>

          <input
            id="name"
            type="text"
            placeholder="Acme Corporation"
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
            placeholder="acme-corporation"
            {...register('slug')}
          />

          {errors.slug && (
            <p className={styles.error}>
              {errors.slug.message}
            </p>
          )}

          <p className={styles.help}>
            Use lowercase letters, numbers and hyphens.
          </p>
        </div>

        {error && (
          <div className={styles.apiError}>
            Failed to create organization.
          </div>
        )}

        <button
          type="submit"
          className={styles.submitButton}
          disabled={isLoading}
        >
          {isLoading
            ? 'Creating...'
            : 'Create Organization'}
        </button>
      </form>
    </div>
  );
}