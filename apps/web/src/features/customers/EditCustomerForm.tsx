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

/*
 * Zod schema defines the validation rules for the
 * customer edit form before the request reaches the API.
 */
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

  notes: z
    .string()
    .trim()
    .max(5000, 'Notes cannot exceed 5000 characters')
    .optional()
    .or(z.literal('')),

  status: z.enum(['active', 'inactive']),
});

type CustomerFormValues = z.infer<typeof customerSchema>;

interface EditCustomerFormProps {
  organizationId: string;
  customer: Customer;

  // Parent component decides what should happen
  // after a successful update.
  onSuccess: () => void;
}

export default function EditCustomerForm({
  organizationId,
  customer,
  onSuccess,
}: EditCustomerFormProps) {
  /*
   * Global notification functions allow this form to
   * display success/error messages consistently across
   * the entire OpsFlow application.
   */
  const {
    success,
    error: showError,
  } = useNotification();

  /*
   * RTK Query mutation used to update the customer.
   */
  const [updateCustomer, { isLoading }] =
    useUpdateCustomerMutation();

  /*
   * API errors are kept separately from React Hook Form
   * validation errors.
   *
   * Example:
   * Backend may return multiple validation messages.
   */
  const [apiError, setApiError] = useState<string[]>([]);

  /*
   * React Hook Form manages the form fields and
   * client-side Zod validation.
   */
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CustomerFormValues>({
    resolver: zodResolver(customerSchema),
  });

  /*
   * Whenever a different customer is loaded into this
   * form, populate the form with that customer's data.
   */
  useEffect(() => {
    reset({
      name: customer.name,
      email: customer.email,
      phone: customer.phone ?? '',
      company: customer.company ?? '',
      notes: customer.notes ?? '',
      status: customer.status,
    });

    // Clear any previous API error when switching customers.
    setApiError([]);
  }, [customer, reset]);

  /*
   * Submit the edited customer to the NestJS API.
   */
  const onSubmit = async (values: CustomerFormValues) => {
    // Remove errors from a previous failed submission.
    setApiError([]);

    try {
      /*
       * RTK Query sends the PATCH request to the backend.
       *
       * unwrap() makes the mutation behave like a normal
       * promise and throws when the API returns an error.
       */
      await updateCustomer({
        organizationId,
        customerId: customer._id,

        data: {
          name: values.name,
          email: values.email,
          phone: values.phone || undefined,
          company: values.company || undefined,
          notes: values.notes || undefined,
          status: values.status,
        },
      }).unwrap();

      /*
       * Show a global success notification instead of
       * relying only on the UI changing silently.
       */
      success('Customer updated successfully.');

      /*
       * Tell the parent component that the update succeeded.
       * The parent can then close the form/modal or refresh
       * the customer details.
       */
      onSuccess();
    } catch (error) {
      /*
       * Convert the backend error response into the same
       * string[] format used by CreateCustomerForm.
       */
      const messages = getApiErrorMessage(error);

      console.error(
        'Failed to update customer:',
        error,
      );

      /*
       * Keep detailed API errors visible inside the form.
       */
      setApiError(messages);

      /*
       * Also provide a global notification so the user gets
       * immediate feedback.
       */
      showError(
        messages[0] ?? 'Failed to update customer.',
      );
    }
  };

  return (
    <form
      className={styles.form}
      onSubmit={handleSubmit(onSubmit)}
    >
      {/* Display backend/API errors above the form. */}
      {apiError.length > 0 && (
        <div className={styles.error}>
          {apiError.map((message, index) => (
            <p key={index}>{message}</p>
          ))}
        </div>
      )}

      {/* Customer name */}
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

      {/* Customer email */}
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

      {/* Customer phone */}
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

      {/* Customer company */}
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

      {/* Customer notes */}
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

      {/* Customer active/inactive status */}
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

      {/* Form submission */}
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