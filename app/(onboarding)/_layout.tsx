import { Stack } from 'expo-router';
import { router, useSegments } from 'expo-router';
import React, { useEffect } from 'react';
import { useUserStore } from '../../store/userStore';

export default function OnboardingLayout() {
  const { supabaseUser, hasCompletedOnboarding, setHasCompletedOnboarding } = useUserStore();
  const segments = useSegments();

  useEffect(() => {
    // Get the current route segment
    const currentRoute = segments[segments.length - 1];
    
    // Only redirect to main app if both conditions are met AND user is not on paywall
    // Allow completed users to access the paywall (for upgrades)
    if (supabaseUser && hasCompletedOnboarding) {
      if (currentRoute === 'paywall') {
        console.log('OnboardingLayout: User accessing paywall, allowing access');
        return; // Don't redirect, allow paywall access
      }
      
      console.log('OnboardingLayout: User authenticated and onboarding complete, redirecting to main app');
      router.replace('/(main)');
    }
  }, [supabaseUser, hasCompletedOnboarding, segments]);

  return <Stack screenOptions={{ headerShown: false }} />;
} 