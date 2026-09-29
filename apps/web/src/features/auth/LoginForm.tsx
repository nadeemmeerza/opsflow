'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

import { useLoginMutation } from './authApi';
import { useAppDispatch } from '@/store/hooks';
import { setCredentials } from '@/store/auth/authSlice';

import styles from './LoginForm.module.scss';

export function LoginForm() {
  const router = useRouter();
  const dispatch = useAppDispatch();

  const [login, { isLoading }] = useLoginMutation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [errorMessage, setErrorMessage] =
    useState('');

  const handleSubmit = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    setErrorMessage('');

    try {
      const response = await login({
        email,
        password,
      }).unwrap();

      dispatch(
        setCredentials({
          user: response.data.user,
          accessToken: response.data.accessToken,
        }),
      );

      router.push('/dashboard');
    } catch (error) {
      console.error('Login failed:', error);

      setErrorMessage(
        'Invalid email or password.',
      );
    }
  };

  return (
    <main className={styles.container}>
      <div className={styles.card}>
        <div className={styles.header}>
          <h1>Welcome to OpsFlow</h1>

          <p>
            Sign in to manage your operations.
          </p>
        </div>

        <form
          className={styles.form}
          onSubmit={handleSubmit}
        >
          <div className={styles.field}>
            <label htmlFor="email">
              Email
            </label>

            <input
              id="email"
              type="email"
              value={email}
              onChange={(event) =>
                setEmail(event.target.value)
              }
              placeholder="you@example.com"
              autoComplete="email"
              required
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="password">
              Password
            </label>

            <input
              id="password"
              type="password"
              value={password}
              onChange={(event) =>
                setPassword(event.target.value)
              }
              placeholder="Enter your password"
              autoComplete="current-password"
              required
            />
          </div>

          {errorMessage && (
            <div className={styles.apiError}>
              {errorMessage}
            </div>
          )}

          <button
            type="submit"
            className={styles.submitButton}
            disabled={isLoading}
          >
            {isLoading
              ? 'Signing in...'
              : 'Sign in'}
          </button>
        </form>

        <div className={styles.footer}>
          <p>OpsFlow Enterprise Operations Platform</p>
        </div>
      </div>
    </main>
  );
}