// Re-export polyfill
export * from './backHandlerPolyfill';

import { useEffect } from 'react';
import { router } from 'expo-router';
import { useUserStore } from '../store/userStore';

/**
 * Authentication hook that redirects unauthenticated users to onboarding
 * @param redirectPath - Path to redirect to if not authenticated (defaults to onboarding)
 * @returns Object with authentication status and user info
 */
export const useAuthGuard = (redirectPath = '/(onboarding)') => {
  const { supabaseUser, hasCompletedOnboarding, isAuthenticated } = useUserStore();

  useEffect(() => {
    if (!supabaseUser || !hasCompletedOnboarding) {
      console.log('useAuthGuard: User not authenticated, redirecting to:', redirectPath);
      router.replace(redirectPath);
    }
  }, [supabaseUser, hasCompletedOnboarding, redirectPath]);

  return {
    isAuthenticated: isAuthenticated(),
    supabaseUser,
    hasCompletedOnboarding,
    shouldRender: supabaseUser && hasCompletedOnboarding
  };
};

/**
 * Hook for components that require authentication
 * Returns null if not authenticated (for early return in components)
 */
export const useRequireAuth = () => {
  const authGuard = useAuthGuard();
  
  if (!authGuard.shouldRender) {
    return null;
  }
  
  return authGuard;
};
