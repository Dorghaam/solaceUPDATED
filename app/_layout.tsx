// app/_layout.tsx - FINAL VERSION

import 'react-native-get-random-values';
import 'react-native-reanimated';

import { useFonts } from 'expo-font';
import { Stack, router } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import * as Linking from 'expo-linking';
import React, { useEffect, useRef } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { useUserStore } from '../store/userStore';
import { supabase } from '../services/supabaseClient';
import { initRevenueCat, syncIdentity } from '../services/revenueCatService';
import { fetchAndSetUserProfile } from '../services/profileService';
import { ensurePostLoginSync } from '../services/authService';
import { reviewService } from '../services/reviewService';
import { networkService } from '../services/networkService';
import { waitForStoreHydration } from '../utils';
import { configureGoogleSignIn } from '../services/googleAuthService';

// This is a placeholder ThemeProvider until we create our own
const ThemeProvider = ({ children }: { children: React.ReactNode }) => <>{children}</>; 

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const { 
    supabaseUser,
    hasCompletedOnboarding,
    hydrated,
    authChecked,
    setSupabaseUser, 
    resetState, 
    updateStreakData,
    setAuthChecked,
    isAppReady,
  } = useUserStore();
  const [pendingDeepLink, setPendingDeepLink] = React.useState<string | null>(null);
  const [isInitialized, setIsInitialized] = React.useState(false);
  
  // Block React 18 Strict Mode double-mounting in dev
  const didInit = useRef(false);

  const [fontsLoaded, fontError] = useFonts({
    'Inter-Regular': require('../Inter/static/Inter_18pt-Regular.ttf'),
    'Inter-SemiBold': require('../Inter/static/Inter_18pt-SemiBold.ttf'),
  });

  // Initialize app with splash screen logic - prevent double mounting
  useEffect(() => {
    if (didInit.current) return; // skip second mount in dev
    didInit.current = true;
    
    let cancelled = false;
    
    const start = async () => {
      try {
        console.log('[Startup] Starting app initialization...');
        await waitForStoreHydration();
        console.log('[Startup] Store hydrated');

        // *** CONFIGURE GOOGLE SIGN-IN EARLY ***
        // This ensures Google Sign-In is ready before anything else happens.
        configureGoogleSignIn();

        const { data: { session } } = await supabase.auth.getSession();
        console.log('[Startup] Session check complete');
        
        // ① Configure RevenueCat FIRST before setting up auth listener
        await initRevenueCat(session?.user?.id);
        if (cancelled) return;
        
        // ② THEN set up auth listener (which calls syncIdentity)
        const { data: authListener } = supabase.auth.onAuthStateChange(
          async (_event, session) => {
            console.log(`[AuthListener] Event: ${_event}`, session?.user?.id || 'No User');
            setSupabaseUser(session?.user ?? null);
            
            // syncIdentity will await configurePromise internally
            await syncIdentity(session?.user?.id ?? null);

            if (_event === 'SIGNED_IN' && session?.user) {
              // Other background tasks
              fetchAndSetUserProfile(session.user.id).catch(console.error);
              reviewService.trackAppOpen();
              updateStreakData();
            } else if (_event === 'SIGNED_OUT') {
              setTimeout(() => {
                  resetState();
                  console.log('[AuthListener] State reset after sign out.');
              }, 50);
            }
          }
        );
        
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

        await networkService.checkConnection();
        setAuthChecked(true);
        console.log('[Startup] Initialization complete');
        
        // Cleanup function for auth listener
        return () => {
          authListener?.subscription?.unsubscribe();
        };

      } catch (e) {
        console.error('[Startup] Critical error:', e);
        setAuthChecked(true);
      } finally {
        if (!cancelled) {
          setIsInitialized(true);
          if (fontsLoaded || fontError) {
            setTimeout(() => {
              SplashScreen.hideAsync().catch(console.error);
            }, 1000);
          }
        }
      }
    };
    
    const cleanupPromise = start();
    
    return () => {
      cancelled = true;
      cleanupPromise.then(cleanup => cleanup?.());
    };
  }, []); // empty dependency array – run once

  // Handle deep links for widget navigation
  useEffect(() => {
    const handleDeepLink = (url: string) => {
      console.log('[DeepLink] Received:', url);
      
      if (url.includes('solaceapp://')) {
        if (!isInitialized || !authChecked) {
          console.log('[DeepLink] App not ready, storing pending deep link');
          setPendingDeepLink(url);
          return;
        }

        const { supabaseUser, hasCompletedOnboarding } = useUserStore.getState();
        if (supabaseUser && hasCompletedOnboarding) {
          console.log('[DeepLink] Opening main app');
          router.replace('/(main)');
        } else {
          console.log('[DeepLink] User not authenticated/onboarded, opening onboarding');
          router.replace('/(onboarding)');
        }
      }
    };

    Linking.getInitialURL().then((url) => {
      if (url) {
        console.log('[DeepLink] Initial URL:', url);
        handleDeepLink(url);
      }
    });

    const subscription = Linking.addEventListener('url', ({ url }) => {
      handleDeepLink(url);
    });

    return () => {
      subscription?.remove();
    };
  }, [isInitialized, authChecked]);

  // Handle pending deep link when app becomes ready
  useEffect(() => {
    if (pendingDeepLink && isInitialized && authChecked) {
      console.log('[DeepLink] Processing pending deep link:', pendingDeepLink);
      
      if (pendingDeepLink.includes('solaceapp://')) {
        const { supabaseUser, hasCompletedOnboarding } = useUserStore.getState();
        if (supabaseUser && hasCompletedOnboarding) {
          console.log('[DeepLink] Navigating to main app');
          router.replace('/(main)');
        } else {
          console.log('[DeepLink] Navigating to onboarding');
          router.replace('/(onboarding)');
        }
        setPendingDeepLink(null);
      }
    }
  }, [pendingDeepLink, isInitialized, authChecked]);

  useEffect(() => {
    if (fontsLoaded || fontError) {
      if (isInitialized) {
        SplashScreen.hideAsync().catch(console.error);
      }
    }
  }, [fontsLoaded, fontError, isInitialized]);

  const showMainApp = supabaseUser && hasCompletedOnboarding;

  if (!fontsLoaded && !fontError) return null;
  if (!hydrated) return null;
  if (!isInitialized) return null;

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