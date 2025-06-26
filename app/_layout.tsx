// app/_layout.tsx - REPLACED

import 'react-native-get-random-values';
import 'react-native-reanimated';

import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import * as Linking from 'expo-linking';
import React, { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useUserStore } from '../store/userStore';
import { supabase } from '../services/supabaseClient';
import { configureGoogleSignIn } from '../services/googleAuthService';
import { initRevenueCat, verifyRevenueCatSetup } from '../services/revenueCatService';
import { fetchAndSetUserProfile } from '../services/profileService';
import { ensurePostLoginSync, signOut } from '../services/authService';
import { reviewService } from '../services/reviewService';
import { networkService } from '../services/networkService';
import { waitForStoreHydration } from '../utils';
import { router } from 'expo-router';

// This is a placeholder ThemeProvider until we create our own
const ThemeProvider = ({ children }: { children: React.ReactNode }) => <>{children}</>; 

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const { 
    supabaseUser, 
    hasCompletedOnboarding, 
    setSupabaseUser, 
    resetState, 
    updateStreakData,
    hydrated,
    authChecked,
    setAuthChecked,
    isAppReady
  } = useUserStore();
  const [pendingDeepLink, setPendingDeepLink] = React.useState<string | null>(null);
  const [isInitialized, setIsInitialized] = React.useState(false);

  const [fontsLoaded, fontError] = useFonts({
    'Inter-Regular': require('../Inter/static/Inter_18pt-Regular.ttf'),
    'Inter-SemiBold': require('../Inter/static/Inter_18pt-SemiBold.ttf'),
  });

  // Consolidated initialization - wait for ALL async operations before rendering
  useEffect(() => {
    const initializeApp = async () => {
      console.time('[Startup] Total initialization time');
      
      try {
        console.log('[Startup] Starting consolidated app initialization...');
        
        // Wait for store hydration first (critical to prevent routing flashes)
        await waitForStoreHydration();
        console.log('[Startup] ✅ Store hydration complete');

        // Now run all other initialization tasks in parallel
        const [session] = await Promise.all([
          // Core auth session
          supabase.auth.getSession().then(({ data: { session } }) => {
            console.log('[Startup] ✅ Supabase session fetched:', session?.user?.id || 'none');
            return session;
          }),
          
          // RevenueCat initialization
          (async () => {
            try {
              console.log('[Startup] Initializing RevenueCat...');
              const session = await supabase.auth.getSession().then(({ data: { session } }) => session);
              await initRevenueCat(session?.user?.id ?? null);
              await verifyRevenueCatSetup();
              const { performInitialSubscriptionCheck } = await import('../services/revenueCatService');
              await performInitialSubscriptionCheck();
              console.log('[Startup] ✅ RevenueCat setup complete');
            } catch (rcError) {
              console.error('[Startup] RevenueCat initialization failed:', rcError);
              useUserStore.getState().setSubscriptionTier('free');
              console.log('[Startup] Set fallback subscription tier to free');
            }
          })(),
          
          // Other services
          (async () => {
            configureGoogleSignIn();
            await networkService.checkConnection();
            console.log('[Startup] ✅ Additional services initialized');
          })(),
        ]);

        // Set authentication state
        if (session?.user) {
          setSupabaseUser(session.user);
          
          // Background tasks (don't await)
          fetchAndSetUserProfile(session.user.id).catch(console.error);
          ensurePostLoginSync(session.user.id).catch(console.error);
          reviewService.trackAppOpen();
          updateStreakData();
          
          console.log('[Startup] ✅ User authenticated and background tasks started');
        } else {
          setSupabaseUser(null);
          console.log('[Startup] ✅ No user session found');
        }

        // Mark auth check as complete
        setAuthChecked(true);
        console.log('[Startup] ✅ Auth check complete');

      } catch (e) {
        console.error('[Startup] Error during app initialization:', e);
        // Ensure auth is marked as checked even on error
        setAuthChecked(true);
      } finally {
        console.timeEnd('[Startup] Total initialization time');
        setIsInitialized(true);
        
        // Hide splash screen
        if (fontsLoaded || fontError) {
          await SplashScreen.hideAsync();
          console.log('[Startup] ✅ Splash screen hidden, app ready');
        }
      }
    };
    
    initializeApp();
  }, []);

  // This effect listens for auth changes AFTER initial startup
  useEffect(() => {
    let isProcessing = false; // Prevent race condition on rapid events
    
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (isProcessing) {
          console.log(`[AuthListener] Event: ${_event} - Already processing, skipping`);
          return;
        }
        
        isProcessing = true;
        try {
          console.log(`[AuthListener] Event: ${_event}`, session?.user?.id || 'No User');
          setSupabaseUser(session?.user ?? null);

          if (_event === 'SIGNED_IN' && session?.user) {
            // Don't await these - let them happen in background to avoid blocking
            ensurePostLoginSync(session.user.id).catch(console.error);
            fetchAndSetUserProfile(session.user.id).catch(console.error);
            
            // Track app open on sign in
            reviewService.trackAppOpen();
            updateStreakData();
          } else if (_event === 'SIGNED_OUT') {
            // The signOut function already handles RC logout.
            // resetState clears the zustand store for the next user.
            resetState();
          }
        } finally {
          isProcessing = false;
        }
      }
    );

    return () => {
      authListener?.subscription?.unsubscribe();
    };
  }, [setSupabaseUser, resetState]);

  // Handle deep links for widget navigation
  useEffect(() => {
    const handleDeepLink = (url: string) => {
      console.log('[DeepLink] Received:', url);
      
      // For now, just open the main app - no special widget navigation
      if (url.includes('solaceapp://')) {
        if (supabaseUser && hasCompletedOnboarding) {
          console.log('[DeepLink] Opening main app');
          // Just ensure we're in the main app - no special navigation needed
          router.replace('/(main)');
        } else {
          console.log('[DeepLink] User not ready, storing pending deep link');
          setPendingDeepLink(url);
        }
      }
    };

    // Handle initial URL if app was opened from widget
    Linking.getInitialURL().then((url) => {
      if (url) {
        console.log('[DeepLink] Initial URL:', url);
        handleDeepLink(url);
      }
    });

    // Listen for subsequent deep links
    const subscription = Linking.addEventListener('url', ({ url }) => {
      handleDeepLink(url);
    });

    return () => {
      subscription?.remove();
    };
  }, [supabaseUser, hasCompletedOnboarding]);

  // Handle pending deep link when user becomes ready
  useEffect(() => {
    if (pendingDeepLink && supabaseUser && hasCompletedOnboarding) {
      console.log('[DeepLink] Processing pending deep link:', pendingDeepLink);
      
      if (pendingDeepLink.includes('solaceapp://')) {
        // Just open the main app
        router.replace('/(main)');
        setPendingDeepLink(null);
      }
    }
  }, [pendingDeepLink, supabaseUser, hasCompletedOnboarding]);

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  // Don't render anything until fonts are loaded AND app is fully initialized
  if (!fontsLoaded && !fontError) {
    return null;
  }

  // CRITICAL: Don't render stacks until everything is ready (prevents welcome screen flash)
  // Exception: If user explicitly logged out, allow rendering even if not fully initialized
  const hasExplicitlyLoggedOut = !supabaseUser && authChecked;
  
  if (!isInitialized || !hydrated || (!authChecked && !hasExplicitlyLoggedOut)) {
    console.log('[Layout] Waiting for app readiness...', { 
      isInitialized, 
      hydrated, 
      authChecked,
      hasExplicitlyLoggedOut
    });
    return null; // Splash screen remains visible
  }

  // Authentication Flow Logic:
  // 1. If user hasn't completed onboarding, show onboarding (regardless of auth status)  
  // 2. If user completed onboarding but isn't authenticated, redirect back to onboarding
  // 3. Only show main app if both authenticated AND completed onboarding
  const showMainApp = supabaseUser && hasCompletedOnboarding;

  console.log('[Layout] Rendering app stacks', { 
    showMainApp, 
    hasUser: !!supabaseUser, 
    hasCompletedOnboarding 
  });

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