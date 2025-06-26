import { useEffect, useState } from 'react';
import { router } from 'expo-router';
import { useUserStore } from '../store/userStore';

export function useAuthGuard() {
  const { supabaseUser, hasCompletedOnboarding, hydrated } = useUserStore();
  const [shouldRender, setShouldRender] = useState(false);

  useEffect(() => {
    // Wait for basic hydration
    if (!hydrated) {
      setShouldRender(false);
      return;
    }

    // Determine if the user should be on this screen
    const isAuthenticatedAndOnboarded = supabaseUser && hasCompletedOnboarding;
    
    if (!isAuthenticatedAndOnboarded) {
      router.replace('/(onboarding)');
      setShouldRender(false);
    } else {
      setShouldRender(true);
    }
  }, [supabaseUser, hasCompletedOnboarding, hydrated]);

  return { shouldRender };
} 