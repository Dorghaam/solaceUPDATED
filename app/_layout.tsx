// app/_layout.tsx
import React, { useEffect } from 'react';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';

// Keep the splash screen visible while we load resources
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    'Inter-Regular': require('../Inter/static/Inter_18pt-Regular.ttf'),
    'Inter-SemiBold': require('../Inter/static/Inter_18pt-SemiBold.ttf'),
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      // Hide the splash screen after the fonts have loaded
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  // Prevent rendering until the font assets are loaded
  if (!fontsLoaded && !fontError) {
    return null;
  }

  // For this demo, we will start with the onboarding flow.
  // Later, this will have logic to check if the user is logged in.
  const isUserAuthenticated = false; // Placeholder

  return (
    <SafeAreaProvider>
      <Stack screenOptions={{ headerShown: false }}>
        {isUserAuthenticated ? (
          <Stack.Screen name="(main)" />
        ) : (
          <Stack.Screen name="(onboarding)" />
        )}
      </Stack>
    </SafeAreaProvider>
  );
} 