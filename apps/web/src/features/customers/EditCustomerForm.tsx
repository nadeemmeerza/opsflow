'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import {
  useNotification,
} from '@/components/notifications/NotificationContext';
import { getApiErrorMessage } from '@/store/api/apiSlice';

import {
  Customer,
  useUpdateCustomerMutation,
} from './customersApi';

import styles from './EditCustomerForm.module.scss';

const customerSchema = z.object({
  name: z
    .string()
    .trim()
    .min(
      2,
      'Name must be at least 2 characters',
    )
    .max(
      200,
      'Name cannot exceed 200 characters',
    ),

  email: z
    .string()
    .trim()
    .email(
      'Enter a valid email address',
    ),

  phone: z
    .string()
    .trim()
    .max(
      30,
      'Phone number cannot exceed 30 characters',
    )
    .optional()
    .or(z.literal('')),

  company: z
    .string()
    .trim()
    .max(
      200,
      'Company cannot exceed 200 characters',
    )
    .optional()
    .or(z.literal('')),

  notes: z
    .string()
    .trim()
    .max(
      5000,
      'Notes cannot exceed 5000 characters',
    )
    .optional()
    .or(z.literal('')),

  status: z.enum([
    'active',
    'inactive',
  ]),
});

type CustomerFormValues =
  z.infer<typeof customerSchema>;

interface EditCustomerFormProps {
  organizationId: string;
  customer: Customer;
  onSuccess: () => void;
}

interface ApiErrorState {
  customerId: string;
  messages: string[];
}

export default function EditCustomerForm({
  organizationId,
  customer,
  onSuccess,
}: EditCustomerFormProps) {
  const {
    success,
    error: showError,
  } = useNotification();

  const [
    updateCustomer,
    { isLoading },
  ] = useUpdateCustomerMutation();

  const [
    apiError,
    setApiError,
  ] = useState<ApiErrorState | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CustomerFormValues>({
    resolver: zodResolver(customerSchema),
  });

  useEffect(() => {
    reset({
      name: customer.name,
      email: customer.email,
      phone: customer.phone ?? '',
      company: customer.company ?? '',
      notes: customer.notes ?? '',
      status: customer.status,
    });
  }, [customer, reset]);

  const currentApiMessages =
    apiError?.customerId === customer._id
      ? apiError.messages
      : [];

  const onSubmit = async (
    values: CustomerFormValues,
  ) => {
    setApiError(null);

    try {
      await updateCustomer({
        organizationId,
        customerId: customer._id,

        data: {
          name: values.name,
          email: values.email,
          phone:
            values.phone || undefined,
          company:
            values.company || undefined,
          notes:
            values.notes || undefined,
          status: values.status,
        },
      }).unwrap();

      success(
        'Customer updated successfully.',
      );

      onSuccess();
    } catch (error) {
      const messages =
        getApiErrorMessage(error);

      console.error(
        'Failed to update customer:',
        error,
      );

      setApiError({
        customerId: customer._id,
        messages,
      });

      showError(
        messages[0] ??
          'Failed to update customer.',
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
              <p key={index}>{message}</p>
            ),
          )}
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

          <option value="inactive">
            Inactive
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
          type="submit"
          className={styles.submitButton}
          disabled={isLoading}
        >
          {isLoading
            ? 'Saving...'
            : 'Save Changes'}
        </button>
      </div>
    </form>
  );
}