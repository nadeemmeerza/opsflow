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

import { useCreateCustomerMutation } from './customersApi';
import styles from './CreateCustomerForm.module.scss';

const customerSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Name must be at least 2 characters')
    .max(200, 'Name cannot exceed 200 characters'),

  email: z
    .string()
    .trim()
    .email('Enter a valid email address'),

  phone: z
    .string()
    .trim()
    .max(30, 'Phone number cannot exceed 30 characters')
    .optional()
    .or(z.literal('')),

  company: z
    .string()
    .trim()
    .max(200, 'Company cannot exceed 200 characters')
    .optional()
    .or(z.literal('')),

  // address: z
  //   .string()
  //   .trim()
  //   .max(500, 'Address cannot exceed 500 characters')
  //   .optional()
  //   .or(z.literal('')),

  notes: z
    .string()
    .trim()
    .max(5000, 'Notes cannot exceed 5000 characters')
    .optional()
    .or(z.literal('')),
});

type CustomerFormValues = z.infer<typeof customerSchema>;

interface CreateCustomerFormProps {
  organizationId: string;
}

export default function CreateCustomerForm({
  organizationId,
}: CreateCustomerFormProps) {
  const router = useRouter();

  const { success, error: showError } = useNotification();

  const [apiError, setApiError] = useState<string[]>([]);

  const [createCustomer, { isLoading }] =
    useCreateCustomerMutation();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CustomerFormValues>({
    resolver: zodResolver(customerSchema),

    defaultValues: {
      name: '',
      email: '',
      phone: '',
      company: '',
      // address: '',
      notes: '',
    },
  });

  const onSubmit = async (values: CustomerFormValues) => {
    setApiError([]);

    try {
      await createCustomer({
        organizationId,

        data: {
          name: values.name,
          email: values.email,
          phone: values.phone || undefined,
          company: values.company || undefined,
          // address: values.address || undefined,
          notes: values.notes || undefined,
        },
      }).unwrap();

      success('Customer created successfully.');

      router.push(
        `/organizations/${organizationId}/customers`,
      );
    } catch (error) {
      const messages = getApiErrorMessage(error);

      console.error(
        'Failed to create customer:',
        error,
      );

      setApiError(messages);

      showError(
        messages[0] ?? 'Failed to create customer.',
      );
    }
  };

  return (
    <form
      className={styles.form}
      onSubmit={handleSubmit(onSubmit)}
    >
      {apiError.length > 0 && (
        <div className={styles.error}>
          {apiError.map((message, index) => (
            <p key={index}>{message}</p>
          ))}
        </div>
      )}

      <div className={styles.field}>
        <label htmlFor="name">
          Name
        </label>

        <input
          id="name"
          {...register('name')}
        />

        {errors.name && (
          <p className={styles.error}>
            {errors.name.message}
          </p>
        )}
      </div>

      <div className={styles.field}>
        <label htmlFor="email">
          Email
        </label>

        <input
          id="email"
          type="email"
          {...register('email')}
        />

        {errors.email && (
          <p className={styles.error}>
            {errors.email.message}
          </p>
        )}
      </div>

      <div className={styles.field}>
        <label htmlFor="phone">
          Phone
        </label>

        <input
          id="phone"
          {...register('phone')}
        />

        {errors.phone && (
          <p className={styles.error}>
            {errors.phone.message}
          </p>
        )}
      </div>

      <div className={styles.field}>
        <label htmlFor="company">
          Company
        </label>

        <input
          id="company"
          {...register('company')}
        />

        {errors.company && (
          <p className={styles.error}>
            {errors.company.message}
          </p>
        )}
      </div>

      <div className={styles.field}>
        <label htmlFor="notes">
          Notes
        </label>

        <textarea
          id="notes"
          rows={5}
          {...register('notes')}
        />

        {errors.notes && (
          <p className={styles.error}>
            {errors.notes.message}
          </p>
        )}
      </div>

      <div className={styles.actions}>
        <button
          type="button"
          className={styles.cancelButton}
          onClick={() =>
            router.push(
              `/organizations/${organizationId}/customers`,
            )
          }
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
            : 'Create Customer'}
        </button>
      </div>
    </form>
  );
}