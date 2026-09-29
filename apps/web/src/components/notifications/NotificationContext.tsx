'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';

import styles from './NotificationContainer.module.scss';

/*
 * Types of notifications supported by OpsFlow.
 */
type NotificationType =
  | 'success'
  | 'error'
  | 'info'
  | 'warning';

/*
 * Internal representation of a notification.
 */
interface Notification {
  id: number;
  type: NotificationType;
  message: string;
}

/*
 * Public API exposed through useNotification().
 */
interface NotificationContextValue {
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
  warning: (message: string) => void;
}

/*
 * React Context used to make the notification system
 * available throughout the application.
 */
const NotificationContext =
  createContext<NotificationContextValue | null>(
    null,
  );

interface NotificationProviderProps {
  children: ReactNode;
}

/*
 * Global notification configuration.
 */
const NOTIFICATION_DURATION = 4000;
const MAX_NOTIFICATIONS = 5;

export function NotificationProvider({
  children,
}: NotificationProviderProps) {
  const [notifications, setNotifications] = useState<
    Notification[]
  >([]);

  /*
   * Stores active timeout IDs.
   *
   * This allows us to cancel timers when a notification
   * is manually closed or when the provider unmounts.
   */
  const timersRef = useRef<
    Map<number, ReturnType<typeof setTimeout>>
  >(new Map());

  /*
   * Remove a notification from the screen.
   */
  const removeNotification = useCallback(
    (id: number) => {
      setNotifications((current) =>
        current.filter(
          (notification) =>
            notification.id !== id,
        ),
      );

      /*
       * Cancel the automatic removal timer because
       * the notification has already been removed.
       */
      const timer = timersRef.current.get(id);

      if (timer) {
        clearTimeout(timer);
        timersRef.current.delete(id);
      }
    },
    [],
  );

  /*
   * Central notification creation function.
   *
   * All notification types eventually pass through here.
   */
  const notify = useCallback(
    (
      type: NotificationType,
      message: string,
    ) => {
      const trimmedMessage = message.trim();

      /*
       * Never display an empty notification.
       */
      if (!trimmedMessage) {
        return;
      }

      /*
       * Generate the notification ID once so that the
       * notification and its timer use the same ID.
       */
      const id =
        Date.now() + Math.random();

      setNotifications((current) => {
        /*
         * Prevent identical notifications from appearing
         * multiple times simultaneously.
         */
        const duplicateExists = current.some(
          (notification) =>
            notification.type === type &&
            notification.message ===
              trimmedMessage,
        );

        if (duplicateExists) {
          return current;
        }

        const notification: Notification = {
          id,
          type,
          message: trimmedMessage,
        };

        /*
         * Add the new notification to the queue.
         *
         * slice(-MAX_NOTIFICATIONS) keeps only the
         * newest notifications when the queue is full.
         */
        return [
          ...current,
          notification,
        ].slice(-MAX_NOTIFICATIONS);
      });

      /*
       * Automatically remove the notification after
       * four seconds.
       */
      const timer = setTimeout(() => {
        setNotifications((current) =>
          current.filter(
            (notification) =>
              notification.id !== id,
          ),
        );

        timersRef.current.delete(id);
      }, NOTIFICATION_DURATION);

      timersRef.current.set(id, timer);
    },
    [],
  );

  /*
   * Convenience methods exposed to application features.
   */
  const success = useCallback(
    (message: string) => {
      notify('success', message);
    },
    [notify],
  );

  const error = useCallback(
    (message: string) => {
      notify('error', message);
    },
    [notify],
  );

  const info = useCallback(
    (message: string) => {
      notify('info', message);
    },
    [notify],
  );

  const warning = useCallback(
    (message: string) => {
      notify('warning', message);
    },
    [notify],
  );

  /*
   * Clean up all active timers when the provider
   * is unmounted.
   */
  useEffect(() => {
    return () => {
      timersRef.current.forEach(
        (timer) => clearTimeout(timer),
      );

      timersRef.current.clear();
    };
  }, []);

  return (
    <NotificationContext.Provider
      value={{
        success,
        error,
        info,
        warning,
      }}
    >
      {children}

      {/*
       * The notification container is rendered once
       * globally instead of separately inside every feature.
       */}
      <div
        className={styles.container}
        aria-live="polite"
        aria-atomic="true"
      >
        {notifications.map(
          (notification) => (
            <div
              key={notification.id}
              className={`${styles.notification} ${styles[notification.type]}`}
              role={
                notification.type === 'error'
                  ? 'alert'
                  : 'status'
              }
            >
              {/* Icon representing the notification type */}
              <div
                className={styles.icon}
                aria-hidden="true"
              >
                {notification.type ===
                  'success' && '✓'}
                {notification.type ===
                  'error' && '×'}
                {notification.type ===
                  'info' && 'i'}
                {notification.type ===
                  'warning' && '!'}
              </div>

              {/* Notification message */}
              <p className={styles.message}>
                {notification.message}
              </p>

              {/* Manual close button */}
              <button
                type="button"
                className={styles.closeButton}
                onClick={() =>
                  removeNotification(
                    notification.id,
                  )
                }
                aria-label="Close notification"
              >
                ×
              </button>
            </div>
          ),
        )}
      </div>
    </NotificationContext.Provider>
  );
}

/*
 * Hook used by application components to trigger
 * global notifications.
 *
 * Example:
 *
 * const { success, error } = useNotification();
 *
 * success('Customer created successfully.');
 */
export function useNotification(): NotificationContextValue {
  const context =
    useContext(NotificationContext);

  if (!context) {
    throw new Error(
      'useNotification must be used inside NotificationProvider',
    );
  }

  return context;
}