'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import {
  useAddOrganizationMemberMutation,
} from './organizationsApi';

import {
  getApiErrorMessage,
} from '@/store/api/apiSlice';

import styles from './AddOrganizationMemberForm.module.scss';

const addMemberSchema = z.object({
  email: z
    .string()
    .trim()
    .email(
      'Please enter a valid email address',
    ),

  /*
   * Owners cannot be assigned through the normal
   * Add Member workflow.
   */
  role: z.enum([
    'admin',
    'member',
  ]),
});

type AddMemberFormValues =
  z.infer<typeof addMemberSchema>;

interface AddOrganizationMemberFormProps {
  organizationId: string;
  onSuccess: () => void;
}

export function AddOrganizationMemberForm({
  organizationId,
  onSuccess,
}: AddOrganizationMemberFormProps) {
  const [
    addMember,
    { isLoading },
  ] = useAddOrganizationMemberMutation();

  const {
    register,
    handleSubmit,
    formState: {
      errors,
    },
    setError,
  } = useForm<AddMemberFormValues>({
    resolver: zodResolver(
      addMemberSchema,
    ),
    defaultValues: {
      email: '',
      role: 'member',
    },
  });

  const onSubmit = async (
    values: AddMemberFormValues,
  ) => {
    try {
      await addMember({
        organizationId,
        data: {
          email: values.email,
          role: values.role,
        },
      }).unwrap();

      onSuccess();
    } catch (error) {
      console.error(
        'Failed to add organization member:',
        error,
      );

      const messages =
        getApiErrorMessage(error);

      setError('root', {
        message:
          messages[0] ??
          'Failed to add member. Please try again.',
      });
    }
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className={styles.form}
    >
      <div className={styles.field}>
        <label htmlFor="email">
          Email address
        </label>

        <input
          id="email"
          type="email"
          placeholder="user@example.com"
          {...register('email')}
        />

        {errors.email && (
          <p className={styles.error}>
            {errors.email.message}
          </p>
        )}
      </div>

      <div className={styles.field}>
        <label htmlFor="role">
          Role
        </label>

        <select
          id="role"
          {...register('role')}
        >
          <option value="member">
            Member
          </option>

          <option value="admin">
            Admin
          </option>
        </select>

        {errors.role && (
          <p className={styles.error}>
            {errors.role.message}
          </p>
        )}
      </div>

      {errors.root && (
        <div className={styles.formError}>
          {errors.root.message}
        </div>
      )}

      <div className={styles.actions}>
        <button
          type="submit"
          disabled={isLoading}
          className={
            styles.submitButton
          }
        >
          {isLoading
            ? 'Adding...'
            : 'Add Member'}
        </button>
      </div>
    </form>
  );
}