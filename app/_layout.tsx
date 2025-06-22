// app/_layout.tsx
import 'react-native-get-random-values';
import 'react-native-reanimated';

import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import React, { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useUserStore } from '../store/userStore';
import { supabase } from '../services/supabaseClient';
import { configureGoogleSignIn } from '../services/googleAuthService';
import { initRevenueCat, identifyUserWithRevenueCat, rcLogOut } from '../services/revenueCatService';
import { fetchAndSetUserProfile } from '../services/profileService';
import { theme } from '../constants/theme';
import { ensurePostLoginSync } from '../services/authService';

// This is a placeholder ThemeProvider until we create our own
const ThemeProvider = ({ children }) => <>{children}</>; 

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const { supabaseUser, hasCompletedOnboarding, setSupabaseUser, resetState } = useUserStore();

  const [fontsLoaded, fontError] = useFonts({
    'Inter-Regular': require('../Inter/static/Inter_18pt-Regular.ttf'),
    'Inter-SemiBold': require('../Inter/static/Inter_18pt-SemiBold.ttf'),
  });

  useEffect(() => {
    if (fontError) throw fontError;
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  useEffect(() => {
    console.log('Setting up auth listener...');
    configureGoogleSignIn();
    initRevenueCat(null); // Initialise anonymously

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSupabaseUser(session?.user ?? null);
      if (session?.user) {
        fetchAndSetUserProfile(session.user.id);
        // Use enhanced sync for existing sessions too
        ensurePostLoginSync(session.user.id);
      }
    });

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        console.log(`Auth event: ${_event}`, session?.user?.id || 'No User');
        
        // Always update the user in the store
        setSupabaseUser(session?.user ?? null);

        if (_event === 'SIGNED_IN' && session?.user) {
          console.log('User signed in, fetching profile and identifying with RevenueCat...');
          // Fetch user profile from your database
          fetchAndSetUserProfile(session.user.id);
          // --- ENHANCED SYNC ---
          // Ensure RevenueCat identity and force subscription refresh
          await ensurePostLoginSync(session.user.id);
          // --- END OF ENHANCED SYNC ---
        }
        
        if (_event === 'SIGNED_OUT') {
          console.log('User signed out, resetting state and logging out of RevenueCat...');
          // The signOut function in authService will handle rcLogOut
          resetState();
        }
      }
    );

    return () => {
      authListener?.subscription?.unsubscribe();
    };
  }, [setSupabaseUser, resetState]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  // Authentication Flow Logic:
  // 1. If user hasn't completed onboarding, show onboarding (regardless of auth status)
  // 2. If user completed onboarding but isn't authenticated, redirect back to onboarding
  // 3. Only show main app if both authenticated AND completed onboarding
  const showMainApp = supabaseUser && hasCompletedOnboarding;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider>
          <Stack screenOptions={{ headerShown: false }}>
            {showMainApp ? (
              <Stack.Screen name="(main)" />
            ) : (
              <Stack.Screen name="(onboarding)" />
            )}
            <Stack.Screen name="+not-found" options={{ presentation: 'modal' }} />
          </Stack>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
} 