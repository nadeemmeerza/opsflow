'use client';

import { useRouter } from 'next/navigation';

import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { logout } from '@/store/auth/authSlice';

import styles from './Topbar.module.scss';

export function Topbar() {
  const router = useRouter();
  const dispatch = useAppDispatch();

  const user = useAppSelector(
    (state) => state.auth.user,
  );

  const handleLogout = () => {
    dispatch(logout());
    router.push('/login');
  };

  return (
    <header className={styles.topbar}>
      <div className={styles.left}>
        <h2>OpsFlow</h2>
      </div>

      <div className={styles.right}>
        <button
          type="button"
          className={styles.notificationButton}
        >
          🔔
        </button>

        <div className={styles.user}>
          <div className={styles.avatar}>
            {user?.name?.charAt(0).toUpperCase() ?? 'U'}
          </div>

          <div className={styles.userInfo}>
            <strong>{user?.name ?? 'User'}</strong>
            <span>{user?.email ?? ''}</span>
          </div>
        </div>

        <button
          type="button"
          className={styles.logoutButton}
          onClick={handleLogout}
        >
          Logout
        </button>
      </div>
    </header>
  );
}