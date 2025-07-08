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
import { setupNotificationResponseListener } from '../services/notificationService';

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
          // If it's a widget URL, let the router handle it normally
          // This will navigate to /widget route which will handle the quote
          console.log('[DeepLink] User authenticated, letting router handle URL');
          // Don't manually navigate - let Expo Router handle the URL
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
          // Extract the path from the deep link and navigate to it
          const path = pendingDeepLink.replace('solaceapp://', '/');
          console.log('[DeepLink] Processing pending link, navigating to:', path);
          router.replace(path as any);
        } else {
          console.log('[DeepLink] Navigating to onboarding');
          router.replace('/(onboarding)');
        }
        setPendingDeepLink(null);
      }
    }
  }, [pendingDeepLink, isInitialized, authChecked]);

  // Handle notification responses
  useEffect(() => {
    if (!isInitialized || !authChecked) {
      console.log('[Notification] Not setting up listener yet - initialized:', isInitialized, 'authChecked:', authChecked);
      return;
    }

    console.log('[Notification] Setting up notification response listener');
    const subscription = setupNotificationResponseListener((response) => {
      console.log('[Notification] Response received:', JSON.stringify(response, null, 2));
      
      const { supabaseUser, hasCompletedOnboarding, setTargetQuote } = useUserStore.getState();
      console.log('[Notification] User state - authenticated:', !!supabaseUser, 'onboarded:', hasCompletedOnboarding);
      
      if (!supabaseUser || !hasCompletedOnboarding) {
        console.log('[Notification] User not authenticated/onboarded, ignoring notification response');
        return;
      }

      // Extract quote data from notification
      const notificationData = response.notification.request.content.data;
      console.log('[Notification] Notification data:', notificationData);
      
      if (notificationData?.type === 'quote' && typeof notificationData?.quoteText === 'string') {
        console.log('[Notification] Setting target quote from notification:', notificationData.quoteText);
        
        const targetQuoteData = {
          id: typeof notificationData.quoteId === 'string' ? notificationData.quoteId : 'notification-quote',
          text: notificationData.quoteText,
          category: 'notification', // Force notification category for easier debugging
        };
        
        console.log('[Notification] Target quote data:', targetQuoteData);
        setTargetQuote(targetQuoteData);
        
        // Navigate to main feed which will show the modal
        console.log('[Notification] Navigating to main feed');
        router.push('/(main)');
      } else {
        console.log('[Notification] Invalid notification data - type:', notificationData?.type, 'quoteText type:', typeof notificationData?.quoteText);
      }
    });

    console.log('[Notification] Notification listener set up successfully');
    return () => {
      console.log('[Notification] Cleaning up notification listener');
      subscription?.remove();
    };
  }, [isInitialized, authChecked]);

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
            <Stack.Screen name="widget" options={{ presentation: 'modal' }} />
            <Stack.Screen name="notification" options={{ presentation: 'modal' }} />
            <Stack.Screen name="+not-found" options={{ presentation: 'modal' }} />
          </Stack>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
} 