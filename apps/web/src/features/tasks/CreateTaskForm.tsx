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
  useCreateTaskMutation,
} from './tasksApi';

import {
  useGetOrganizationMembersQuery,
} from '../organizations/organizationsApi';

import styles from './CreateTaskForm.module.scss';

const createTaskSchema = z.object({
  title: z
    .string()
    .trim()
    .min(2, 'Title must be at least 2 characters')
    .max(200, 'Title cannot exceed 200 characters'),

  description: z
    .string()
    .max(5000, 'Description cannot exceed 5000 characters')
    .optional(),

  assigneeId: z
    .string()
    .optional(),

  priority: z.enum([
    'low',
    'medium',
    'high',
    'urgent',
  ]),

  dueDate: z
    .string()
    .optional(),
});

type CreateTaskFormValues = z.infer<
  typeof createTaskSchema
>;

interface CreateTaskFormProps {
  organizationId: string;
  projectId: string;
}

export default function CreateTaskForm({
  organizationId,
  projectId,
}: CreateTaskFormProps) {
  const router = useRouter();

  /*
   * Global notifications provide consistent feedback for
   * successful task creation and API failures.
   */
  const {
    success,
    error: showError,
  } = useNotification();

  /*
   * Keep backend validation/business-rule errors inside
   * the form as well as displaying the first error as a toast.
   */
  const [apiError, setApiError] = useState<string[]>(
    [],
  );

  const [createTask, { isLoading }] =
    useCreateTaskMutation();

 const {
  data: membersResponse,
  isLoading: membersLoading,
} = useGetOrganizationMembersQuery({
  organizationId,
  query: {
    page: 1,
    limit: 10,
  },
});

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateTaskFormValues>({
    resolver: zodResolver(createTaskSchema),
    defaultValues: {
      priority: 'medium',
      description: '',
      assigneeId: '',
      dueDate: '',
    },
  });

  const onSubmit = async (
    values: CreateTaskFormValues,
  ) => {
    /*
     * Clear errors from the previous submission.
     */
    setApiError([]);

    try {
      await createTask({
        organizationId,
        projectId,
        data: {
          title: values.title,
          description:
            values.description || undefined,
          assigneeId:
            values.assigneeId || undefined,
          priority: values.priority,
          dueDate:
            values.dueDate || undefined,
        },
      }).unwrap();

      /*
       * Notify the user before returning to the task list.
       */
      success('Task created successfully.');

      router.push(
        `/organizations/${organizationId}/projects/${projectId}/tasks`,
      );
    } catch (error) {
      /*
       * Convert the standard API error into messages
       * suitable for the UI.
       */
      const messages =
        getApiErrorMessage(error);

      console.error(
        'Failed to create task:',
        error,
      );

      /*
       * Display all backend errors inside the form.
       */
      setApiError(messages);

      /*
       * Show the first backend error as a global toast.
       */
      showError(
        messages[0] ??
          'Failed to create task.',
      );
    }
  };

  const members =
    membersResponse?.data.items ?? [];

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
        <label htmlFor="title">
          Task title
        </label>

        <input
          id="title"
          type="text"
          placeholder="Enter task title"
          {...register('title')}
        />

        {errors.title && (
          <p className={styles.error}>
            {errors.title.message}
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
          placeholder="Describe the task..."
          {...register('description')}
        />

        {errors.description && (
          <p className={styles.error}>
            {errors.description.message}
          </p>
        )}
      </div>

      <div className={styles.field}>
        <label htmlFor="assigneeId">
          Assignee
        </label>

        <select
          id="assigneeId"
          {...register('assigneeId')}
          disabled={membersLoading}
        >
          <option value="">
            Unassigned
          </option>

          {members.map((member) => (
            <option
              key={member.userId}
              value={member.userId}
            >
              {member.user?.name ??
                member.userId}
            </option>
          ))}
        </select>
      </div>

      <div className={styles.row}>
        <div className={styles.field}>
          <label htmlFor="priority">
            Priority
          </label>

          <select
            id="priority"
            {...register('priority')}
          >
            <option value="low">
              Low
            </option>

            <option value="medium">
              Medium
            </option>

            <option value="high">
              High
            </option>

            <option value="urgent">
              Urgent
            </option>
          </select>
        </div>

        <div className={styles.field}>
          <label htmlFor="dueDate">
            Due date
          </label>

          <input
            id="dueDate"
            type="date"
            {...register('dueDate')}
          />
        </div>
      </div>

      <div className={styles.actions}>
        <button
          type="button"
          className={styles.cancelButton}
          onClick={() => router.back()}
          disabled={isLoading}
        >
          Cancel
        </button>

        <button
          type="submit"
          className={styles.submitButton}
          disabled={isLoading}
        >
          {isLoading
            ? 'Creating...'
            : 'Create Task'}
        </button>
      </div>
    </form>
  );
}
