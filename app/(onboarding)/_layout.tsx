import { Stack } from 'expo-router';
import { router } from 'expo-router';
import React, { useEffect } from 'react';
import { useUserStore } from '../../store/userStore';

export default function OnboardingLayout() {
  const { supabaseUser, hasCompletedOnboarding, setHasCompletedOnboarding } = useUserStore();

  useEffect(() => {
    // Only redirect to main app if both conditions are met
    // Don't reset onboarding status as this can cause auth loops
    if (supabaseUser && hasCompletedOnboarding) {
      console.log('OnboardingLayout: User authenticated and onboarding complete, redirecting to main app');
      router.replace('/(main)');
    }
  }, [supabaseUser, hasCompletedOnboarding]);

  return <Stack screenOptions={{ headerShown: false }} />;
} 