'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import {
  useNotification,
} from '@/components/notifications/NotificationContext';
import { getApiErrorMessage } from '@/store/api/apiSlice';

import {
  Project,
  useUpdateProjectMutation,
} from './projectsApi';

import styles from './EditProjectForm.module.scss';

const editProjectSchema = z.object({
  name: z
    .string()
    .trim()
    .min(
      2,
      'Project name must be at least 2 characters',
    )
    .max(
      100,
      'Project name cannot exceed 100 characters',
    ),

  key: z
    .string()
    .trim()
    .min(
      2,
      'Project key must be at least 2 characters',
    )
    .max(
      20,
      'Project key cannot exceed 20 characters',
    )
    .regex(
      /^[a-zA-Z0-9_-]+$/,
      'Project key can contain letters, numbers, hyphens and underscores',
    ),

  description: z
    .string()
    .max(
      1000,
      'Description cannot exceed 1000 characters',
    ),

  status: z.enum([
    'active',
    'archived',
  ]),
});

type EditProjectFormValues =
  z.infer<typeof editProjectSchema>;

interface EditProjectFormProps {
  organizationId: string;
  project: Project;
}

interface ApiErrorState {
  projectId: string;
  messages: string[];
}

export default function EditProjectForm({
  organizationId,
  project,
}: EditProjectFormProps) {
  const router = useRouter();

  const {
    success,
    error: showError,
  } = useNotification();

  const [
    apiError,
    setApiError,
  ] = useState<ApiErrorState | null>(null);

  const [
    updateProject,
    { isLoading },
  ] = useUpdateProjectMutation();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<EditProjectFormValues>({
    resolver: zodResolver(
      editProjectSchema,
    ),
  });

  useEffect(() => {
    reset({
      name: project.name,
      key: project.key,
      description:
        project.description ?? '',
      status: project.status,
    });
  }, [project, reset]);

  const currentApiMessages =
    apiError?.projectId === project._id
      ? apiError.messages
      : [];

  const onSubmit = async (
    values: EditProjectFormValues,
  ) => {
    setApiError(null);

    try {
      await updateProject({
        organizationId,
        projectId: project._id,
        data: {
          name: values.name.trim(),
          key: values.key
            .trim()
            .toUpperCase(),
          description:
            values.description.trim(),
          status: values.status,
        },
      }).unwrap();

      success(
        'Project updated successfully.',
      );

      router.push(
        `/organizations/${organizationId}/projects/${project._id}`,
      );
    } catch (error) {
      const messages =
        getApiErrorMessage(error);

      console.error(
        'Failed to update project:',
        error,
      );

      setApiError({
        projectId: project._id,
        messages,
      });

      showError(
        messages[0] ??
          'Failed to update project.',
      );
    }
  };

  return (
    <form
      className={styles.form}
      onSubmit={handleSubmit(onSubmit)}
    >
      {currentApiMessages.length > 0 && (
        <div className={styles.error}>
          {currentApiMessages.map(
            (message, index) => (
              <p key={index}>
                {message}
              </p>
            ),
          )}
        </div>
      )}

      <div className={styles.field}>
        <label htmlFor="name">
          Project name
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
        <label htmlFor="key">
          Project key
        </label>

        <input
          id="key"
          type="text"
          maxLength={20}
          {...register('key')}
        />

        {errors.key && (
          <p className={styles.error}>
            {errors.key.message}
          </p>
        )}
      </div>

      <div className={styles.field}>
        <label htmlFor="description">
          Description
        </label>

        <textarea
          id="description"
          rows={7}
          {...register('description')}
        />

        {errors.description && (
          <p className={styles.error}>
            {errors.description.message}
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

          <option value="archived">
            Archived
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
          className={
            styles.secondaryButton
          }
          disabled={isLoading}
          onClick={() =>
            router.push(
              `/organizations/${organizationId}/projects/${project._id}`,
            )
          }
        >
          Cancel
        </button>

        <button
          type="submit"
          className={
            styles.primaryButton
          }
          disabled={isLoading}
        >
          {isLoading
            ? 'Saving...'
            : 'Save changes'}
        </button>
      </div>
    </form>
  );
}