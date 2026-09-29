'use client';

import { useEffect } from 'react';

import { loadAuth } from './authStorage';


import { useAppDispatch } from '../hooks';
import { initializeAuth } from './authSlice';

export function AuthBootstrap() {
  const dispatch = useAppDispatch();

  useEffect(() => {
    const storedAuth = loadAuth();

    dispatch(
      initializeAuth(storedAuth),
    );
  }, [dispatch]);

  return null;
}