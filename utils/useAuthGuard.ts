import { useEffect, useState } from 'react';
import { router } from 'expo-router';
import { useUserStore } from '../store/userStore';

export function useAuthGuard() {
  const { supabaseUser, hasCompletedOnboarding, isAppReady } = useUserStore();
  const [shouldRender, setShouldRender] = useState(false);

  useEffect(() => {
    // Wait for app to be fully ready before making routing decisions
    if (!isAppReady()) {
      console.log('[AuthGuard] App not ready yet, waiting...');
      setShouldRender(false);
      return;
    }

    // Determine if the user should be on this screen
    const isAuthenticatedAndOnboarded = supabaseUser && hasCompletedOnboarding;
    
    if (!isAuthenticatedAndOnboarded) {
      console.log('[AuthGuard] User not authenticated or onboarded. Redirecting to onboarding...');
      router.replace('/(onboarding)');
      setShouldRender(false);
    } else {
      console.log('[AuthGuard] User authenticated and onboarded. Allowing access to main app.');
      setShouldRender(true);
    }
  }, [supabaseUser, hasCompletedOnboarding, isAppReady]);

  return { shouldRender };
} 