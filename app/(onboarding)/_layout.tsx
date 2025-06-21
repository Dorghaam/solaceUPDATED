import { Stack } from 'expo-router';
import { router } from 'expo-router';
import React, { useEffect } from 'react';
import { useUserStore } from '../../store/userStore';

export default function OnboardingLayout() {
  const { supabaseUser, hasCompletedOnboarding, setHasCompletedOnboarding } = useUserStore();

  useEffect(() => {
    // If user completed onboarding but is no longer authenticated, reset onboarding
    if (hasCompletedOnboarding && !supabaseUser) {
      console.log('OnboardingLayout: User completed onboarding but not authenticated, resetting onboarding status');
      setHasCompletedOnboarding(false);
    }
    
    // If user is authenticated and has completed onboarding, go to main app
    if (supabaseUser && hasCompletedOnboarding) {
      console.log('OnboardingLayout: User authenticated and onboarding complete, redirecting to main app');
      router.replace('/(main)');
    }
  }, [supabaseUser, hasCompletedOnboarding, setHasCompletedOnboarding]);

  return <Stack screenOptions={{ headerShown: false }} />;
} 