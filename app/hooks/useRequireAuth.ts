'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

/**
 * Hook that ensures a user is authenticated.
 * Returns the user object, guaranteed to be non-null after loading.
 * Throws an error if user is not authenticated (should be caught by RequireAuth component).
 */
export function useRequireAuth() {
  const { user, isLoading, isAuthenticated } = useAuth();

  // During loading, return null - parent component should handle loading state
  if (isLoading) {
    return null;
  }

  // If not authenticated, return null - parent component should handle this
  if (!isAuthenticated || !user) {
    return null;
  }

  // TypeScript now knows user is non-null
  return user;
}

/**
 * Hook that throws an error if user is not authenticated.
 * Use this when you absolutely require authentication and want to fail fast.
 */
export function useAuthGuard() {
  const { user, isLoading, isAuthenticated } = useAuth();

  if (isLoading) {
    throw new Error('Auth is still loading');
  }

  if (!isAuthenticated || !user) {
    throw new Error('User must be authenticated');
  }

  return user; // TypeScript knows user is non-null
}

