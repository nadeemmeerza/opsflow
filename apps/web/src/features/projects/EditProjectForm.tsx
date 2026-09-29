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
    .min(2, 'Project name must be at least 2 characters')
    .max(100, 'Project name cannot exceed 100 characters'),

  key: z
    .string()
    .trim()
    .min(2, 'Project key must be at least 2 characters')
    .max(20, 'Project key cannot exceed 20 characters')
    .regex(
      /^[a-zA-Z0-9_-]+$/,
      'Project key can contain letters, numbers, hyphens and underscores',
    ),

  description: z
    .string()
    .max(1000, 'Description cannot exceed 1000 characters'),

  status: z.enum(['active', 'archived']),
});

type EditProjectFormValues = z.infer<
  typeof editProjectSchema
>;

interface EditProjectFormProps {
  organizationId: string;
  project: Project;
}

export default function EditProjectForm({
  organizationId,
  project,
}: EditProjectFormProps) {
  const router = useRouter();

  /*
   * Global notifications provide immediate feedback after
   * successful updates or API failures.
   */
  const {
    success,
    error: showError,
  } = useNotification();

  /*
   * Backend errors are also displayed inside the form so
   * validation or business-rule failures are visible even
   * after the toast disappears.
   */
  const [apiError, setApiError] = useState<string[]>(
    [],
  );

  const [updateProject, { isLoading }] =
    useUpdateProjectMutation();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<EditProjectFormValues>({
    resolver: zodResolver(editProjectSchema),
  });

  /*
   * Populate the form whenever the selected project changes.
   *
   * Clearing API errors here prevents an old error from one
   * project from appearing while editing another project.
   */
  useEffect(() => {
    reset({
      name: project.name,
      key: project.key,
      description: project.description ?? '',
      status: project.status,
    });

    setApiError([]);
  }, [project, reset]);

  const onSubmit = async (
    values: EditProjectFormValues,
  ) => {
    /*
     * Clear errors from the previous submission.
     */
    setApiError([]);

    try {
      await updateProject({
        organizationId,
        projectId: project._id,
        data: {
          name: values.name.trim(),
          key: values.key.trim().toUpperCase(),
          description: values.description.trim(),
          status: values.status,
        },
      }).unwrap();

      /*
       * Tell the user that the update completed before
       * navigating back to the project details page.
       */
      success('Project updated successfully.');

      router.push(
        `/organizations/${organizationId}/projects/${project._id}`,
      );
    } catch (error) {
      /*
       * Convert the standard OpsFlow API error response
       * into messages that can be displayed by the UI.
       */
      const messages =
        getApiErrorMessage(error);

      console.error(
        'Failed to update project:',
        error,
      );

      /*
       * Display all backend errors inside the form.
       */
      setApiError(messages);

      /*
       * Show the first error globally as a toast.
       */
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
      {/* Backend/API errors */}
      {apiError.length > 0 && (
        <div className={styles.error}>
          {apiError.map(
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
          className={styles.secondaryButton}
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
          className={styles.primaryButton}
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
