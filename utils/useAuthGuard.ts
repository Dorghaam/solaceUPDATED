import { useEffect, useState } from 'react';
import { router } from 'expo-router';
import { useUserStore } from '../store/userStore';

export function useAuthGuard() {
  const { supabaseUser, hasCompletedOnboarding } = useUserStore();
  const [shouldRender, setShouldRender] = useState(false);

  useEffect(() => {
    // Determine if the user should be on this screen
    const isAuthenticatedAndOnboarded = supabaseUser && hasCompletedOnboarding;
    
    if (!isAuthenticatedAndOnboarded) {
      console.log('[AuthGuard] User not authenticated or onboarded. Redirecting to onboarding...');
      router.replace('/(onboarding)');
      setShouldRender(false);
    } else {
      setShouldRender(true);
    }
  }, [supabaseUser, hasCompletedOnboarding]);

  return { shouldRender };
} 