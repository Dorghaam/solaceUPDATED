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
import { AppState } from 'react-native';
import { useUserStore } from '../store/userStore';
import { supabase } from '../services/supabaseClient';
import { configureGoogleSignIn } from '../services/googleAuthService';
import { initRevenueCat, getInitialSubscriptionTier, logIn, logOut, refreshCustomerInfo } from '../services/revenueCatService';
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
    isAppReady,
    subscriptionTier,
    fetchQuotes
  } = useUserStore();
  const [pendingDeepLink, setPendingDeepLink] = React.useState<string | null>(null);
  const [isInitialized, setIsInitialized] = React.useState(false);

  const [fontsLoaded, fontError] = useFonts({
    'Inter-Regular': require('../Inter/static/Inter_18pt-Regular.ttf'),
    'Inter-SemiBold': require('../Inter/static/Inter_18pt-SemiBold.ttf'),
  });

  // Initialize app with splash screen logic - keep splash visible while loading
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

        // Initialize RevenueCat and get subscription tier
        try {
          // ✅ Initialize RevenueCat without a user ID
          await initRevenueCat();

          // Then get the initial subscription state from the cache
          const initialTier = await getInitialSubscriptionTier();
          console.log(`[Startup] Initial subscription tier from cache: ${initialTier}`);
          
        } catch (rcError) {
          console.error('[Startup] RevenueCat error:', rcError);
          console.warn('[RevenueCat] Will use cached/persisted subscription state');
        }

        // Other services
        try {
          configureGoogleSignIn();
          await networkService.checkConnection();
        } catch (servicesError) {
          console.error('[Startup] Services error:', servicesError);
        }

        // Pre-load quotes in background if user is authenticated and subscription is ready
        try {
          const { data: { session: currentSession } } = await supabase.auth.getSession();
          if (currentSession?.user && subscriptionTier !== 'unknown') {
            console.log('[Startup] Pre-loading quotes...');
            await fetchQuotes();
            console.log('[Startup] Quotes pre-loaded');
          }
        } catch (quotesError) {
          console.error('[Startup] Failed to pre-load quotes:', quotesError);
        }

        setAuthChecked(true);
        console.log('[Startup] Initialization complete');

      } catch (e) {
        console.error('[Startup] Critical error:', e);
        setAuthChecked(true);
        console.warn('[RevenueCat] Will use cached/persisted subscription state');
      } finally {
        setIsInitialized(true);
        // Hide splash screen after everything is loaded
        if (fontsLoaded || fontError) {
          setTimeout(() => {
            SplashScreen.hideAsync().catch(console.error);
          }, 1000); // 1 second delay to show splash screen
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
          
          // Always update the user state first
          setSupabaseUser(session?.user ?? null);

          if (_event === 'SIGNED_IN' && session?.user) {
            // ✅ Log the user into RevenueCat with their Supabase ID
            await logIn(session.user.id);
            
            // Other background tasks
            ensurePostLoginSync(session.user.id).catch(console.error);
            fetchAndSetUserProfile(session.user.id).catch(console.error);
            
            // Track app open on sign in
            reviewService.trackAppOpen();
            updateStreakData();
          } else if (_event === 'SIGNED_OUT') {
            // ✅ Log the user out of RevenueCat
            await logOut();
            console.log('[AuthListener] Processing sign out...');
            
            // Add delay to prevent race conditions with navigation
            setTimeout(() => {
              try {
                // The signOut function already handles RC logout.
                // resetState clears the zustand store for the next user.
                console.log('[AuthListener] Resetting state after sign out');
                resetState();
              } catch (resetError) {
                console.error('[AuthListener] Error resetting state:', resetError);
              }
            }, 50);
          }
        } catch (error) {
          console.error(`[AuthListener] Error processing ${_event}:`, error);
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

  // Add AppState listener to refresh subscription status when app comes to foreground
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active') {
        console.log('[AppState] App has come to the foreground, refreshing subscription status.');
        refreshCustomerInfo();
      }
    });

    return () => {
      subscription.remove();
    };
  }, []);

  useEffect(() => {
    if (fontsLoaded || fontError) {
      // Don't hide splash immediately - let initialization complete
      if (isInitialized) {
        SplashScreen.hideAsync().catch(console.error);
      }
    }
  }, [fontsLoaded, fontError, isInitialized]);

  // Don't render anything until fonts are loaded AND app is initialized
  if (!fontsLoaded && !fontError) {
    return null;
  }

  // Wait for basic initialization to complete
  if (!isInitialized || !hydrated) {
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