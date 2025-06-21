import { Stack } from 'expo-router';
import React from 'react';
import { useAuthGuard } from '../../utils';

export default function MainLayout() {
  // Authentication guard - redirects to onboarding if not authenticated
  const { shouldRender } = useAuthGuard();

  // If user is not authenticated, don't render the main layout (useAuthGuard handles redirect)
  if (!shouldRender) {
    return null;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
} 