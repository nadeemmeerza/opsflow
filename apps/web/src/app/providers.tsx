'use client';

import { Provider } from 'react-redux';

import { AuthBootstrap } from '@/store/auth/authBootstrap';
import {
  NotificationProvider,
} from '@/components/notifications/NotificationContext';
import { store } from '@/store/store';

interface ProvidersProps {
  children: React.ReactNode;
}

export function Providers({
  children,
}: ProvidersProps) {
  return (
    <Provider store={store}>
      <AuthBootstrap />

      <NotificationProvider>
        {children}
      </NotificationProvider>
    </Provider>
  );
}