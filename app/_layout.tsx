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

  // Simplified initialization with better error handling
  useEffect(() => {
    const initializeApp = async () => {
      try {
        console.log('[Startup] Starting app initialization...');
        
        // Wait for basic store hydration
        await waitForStoreHydration();
        console.log('[Startup] Store hydrated');

        // Initialize core services with error handling
        try {
          const { data: { session } } = await supabase.auth.getSession();
          console.log('[Startup] Session check complete');
          
          if (session?.user) {
            setSupabaseUser(session.user);
            // Background tasks
            fetchAndSetUserProfile(session.user.id).catch(console.error);
            ensurePostLoginSync(session.user.id).catch(console.error);
            reviewService.trackAppOpen();
            updateStreakData();
          } else {
            setSupabaseUser(null);
          }
        } catch (authError) {
          console.error('[Startup] Auth error:', authError);
          setSupabaseUser(null);
        }

        // Initialize RevenueCat safely
        try {
          const { data: { session } } = await supabase.auth.getSession();
          await initRevenueCat(session?.user?.id ?? null);
          
          // ✅ Get initial tier from cache/persistence (don't depend on network)
          const { getInitialSubscriptionTier } = await import('../services/revenueCatService');
          const initialTier = await getInitialSubscriptionTier();
          
          if (initialTier !== 'unknown') {
            console.log(`[Startup] Using initial tier: ${initialTier}`);
          } else {
            console.log('[Startup] Will wait for RevenueCat listener to determine tier');
          }
          
        } catch (rcError) {
          console.error('[Startup] RevenueCat error:', rcError);
          // ✅ REMOVE AGGRESSIVE FALLBACK - Let persisted/cached state handle UI
          console.warn('[RevenueCat] Will use cached/persisted subscription state');
          // ❌ REMOVED: useUserStore.getState().setSubscriptionTier('free');
        }

        // Other services
        try {
          configureGoogleSignIn();
          await networkService.checkConnection();
        } catch (servicesError) {
          console.error('[Startup] Services error:', servicesError);
        }

        setAuthChecked(true);
        console.log('[Startup] Initialization complete');

      } catch (e) {
        console.error('[Startup] Critical error:', e);
        setAuthChecked(true);
        // ✅ REMOVE AGGRESSIVE FALLBACK - Let persisted/cached state handle UI
        console.warn('[RevenueCat] Will use cached/persisted subscription state');
      } finally {
        setIsInitialized(true);
        if (fontsLoaded || fontError) {
          SplashScreen.hideAsync().catch(console.error);
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

  // Simplified production-safe rendering logic
  // Only wait for fonts and basic hydration to prevent crashes
  const isBasicallyReady = (fontsLoaded || fontError) && hydrated;
  
  if (!isBasicallyReady) {
    console.log('[Layout] Waiting for basic app readiness...', { 
      fontsLoaded, 
      fontError, 
      hydrated 
    });
    return null; // Keep splash screen visible
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