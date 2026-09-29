'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import {
  useNotification,
} from '@/components/notifications/NotificationContext';
import { getApiErrorMessage } from '@/store/api/apiSlice';

import {
  useCreateProjectMutation,
} from './projectsApi';

import styles from './CreateProjectForm.module.scss';

const createProjectSchema = z.object({
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
    .max(1000, 'Description cannot exceed 1000 characters')
    .optional(),
});

type CreateProjectFormValues = z.infer<
  typeof createProjectSchema
>;

interface CreateProjectFormProps {
  organizationId: string;
}

export default function CreateProjectForm({
  organizationId,
}: CreateProjectFormProps) {
  const router = useRouter();

  /*
   * Global notification methods allow this form to report
   * successful operations and API failures consistently.
   */
  const {
    success,
    error: showError,
  } = useNotification();

  /*
   * API errors are kept separately so backend validation
   * messages can also be displayed inside the form.
   */
  const [apiError, setApiError] = useState<string[]>(
    [],
  );

  const [createProject, { isLoading }] =
    useCreateProjectMutation();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateProjectFormValues>({
    resolver: zodResolver(createProjectSchema),
    defaultValues: {
      name: '',
      key: '',
      description: '',
    },
  });

  const onSubmit = async (
    values: CreateProjectFormValues,
  ) => {
    /*
     * Clear previous backend errors before submitting
     * the new request.
     */
    setApiError([]);

    try {
      const response = await createProject({
        organizationId,
        data: {
          name: values.name.trim(),
          key: values.key.trim().toUpperCase(),
          description:
            values.description?.trim() || undefined,
        },
      }).unwrap();

      /*
       * Notify the user before navigating to the newly
       * created project.
       */
      success('Project created successfully.');

      router.push(
        `/organizations/${organizationId}/projects/${response.data._id}`,
      );
    } catch (error) {
      /*
       * Convert the standard API error response into
       * user-friendly messages.
       */
      const messages =
        getApiErrorMessage(error);

      console.error(
        'Failed to create project:',
        error,
      );

      /*
       * Display all backend validation errors inside
       * the form.
       */
      setApiError(messages);

      /*
       * Also show the first error as a global notification.
       */
      showError(
        messages[0] ??
          'Failed to create project.',
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
          placeholder="e.g. Website Redesign"
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
          placeholder="e.g. WEB"
          maxLength={20}
          {...register('key')}
        />

        <p className={styles.help}>
          This key identifies the project inside the
          organization.
        </p>

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
          rows={6}
          placeholder="Describe the project..."
          {...register('description')}
        />

        {errors.description && (
          <p className={styles.error}>
            {errors.description.message}
          </p>
        )}
      </div>

      <div className={styles.actions}>
        <button
          type="button"
          className={styles.secondaryButton}
          onClick={() =>
            router.push(
              `/organizations/${organizationId}/projects`,
            )
          }
          disabled={isLoading}
        >
          Cancel
        </button>

        <button
          type="submit"
          className={styles.primaryButton}
          disabled={isLoading}
        >
          {isLoading
            ? 'Creating...'
            : 'Create project'}
        </button>
      </div>
    </form>
  );
}