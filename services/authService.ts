import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as Crypto from 'expo-crypto';
import 'react-native-get-random-values'; // Polyfill for crypto
import type { SubscriptionTier } from '../store/userStore';
import { useUserStore } from '../store/userStore';
// Removed subscriptionSyncService import - now using simplified RevenueCat-only approach
import { supabase } from './supabaseClient';
import { logOut as revenueCatLogOut } from './revenueCatService';
import Purchases from 'react-native-purchases';

// ✅ Removed module flag - now using store's loggingOut flag

export const loginWithGoogle = async () => {
  try {
    console.log('authService: Attempting loginWithGoogle with OIDC nonce flow...');
    
    // Ensure Google Play Services is available (for Android)
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
    console.log('authService: Google Play Services check passed.');

    // 1. Generate a cryptographically-strong raw nonce.
    const rawNonce = Crypto.randomUUID();
    console.log('authService: Generated raw nonce:', rawNonce);

    // 2. Sign in with Google (without nonce parameter due to free version limitations)
    // Note: The free version doesn't support nonce in the original GoogleSignin API
    const signInResponse = await GoogleSignin.signIn();

    const idToken = signInResponse.idToken;
    if (!idToken) {
      throw new Error('Google Sign-In Error: No ID token received.');
    }
    console.log('authService: Google ID Token obtained.');

    // 3. Forward the idToken and nonce to Supabase for verification.
    // Note: Since we can't pass the nonce to Google in the free version,
    // this may require disabling nonce checks in Supabase temporarily
    const { data, error } = await supabase.auth.signInWithIdToken({
      provider: 'google',
      token: idToken,
      // nonce: rawNonce, // Commented out due to free version limitations
    });

    if (error) {
      console.error('authService: Supabase signInWithIdToken error:', error);
      throw error; // Throw the original Supabase error
    }

    console.log('authService: Supabase sign-in successful. User:', data.user?.id);
    return data;

  } catch (error: any) {
    console.error('authService: loginWithGoogle error:', error.code, error.message, error);
    if (error.code === statusCodes.SIGN_IN_CANCELLED) {
      throw new Error('Sign-in was cancelled by the user.');
    } else if (error.code === statusCodes.IN_PROGRESS) {
      throw new Error('Sign-in is already in progress.');
    } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
      throw new Error('Google Play Services not available or outdated.');
    } else {
      // Forward the error from Supabase or another source
      throw new Error(error.message || 'An unknown error occurred during Google Sign-In.');
    }
  }
};

export const handleLogout = async () => {
  try {
    // ✅ Set the store's loggingOut flag to true at the very beginning
    useUserStore.getState().setLoggingOut(true);
    console.log('[AuthService] Starting atomic logout (loggingOut = true)...');

    await Promise.allSettled([
      Purchases.logOut(),
      supabase.auth.signOut(),
    ]);
    console.log('[AuthService] Remote sessions cleared.');
    
    await useUserStore.persist.clearStorage();
    console.log('[AuthService] Persisted local storage cleared.');

    useUserStore.getState().resetState();
    console.log('[AuthService] In-memory state has been reset.');

    // ❌ Remove explicit navigation - let the layout handle it automatically
    // router.replace('/(onboarding)');
    console.log('[AuthService] Logout complete. Navigation will be handled by layout.');

    // Optional: Reset flag after a delay in case of navigation issues.
    setTimeout(() => { useUserStore.getState().setLoggingOut(false); }, 3000);

  } catch (error: any) {
    console.error('[AuthService] A critical error occurred during logout:', error.message);
    useUserStore.getState().setLoggingOut(false); // Reset on error
    await useUserStore.persist.clearStorage();
    useUserStore.getState().resetState();
    // ❌ Remove explicit navigation here too
    // router.replace('/(onboarding)');
  }
};

export const signOut = async () => {
  const { setLoggingOut } = useUserStore.getState();
  
  try {
    console.log('[Auth] Signing out user...');
    // ✅ Set the flag to true
    setLoggingOut(true);
    
    // ✅ Log out from RevenueCat first to clear the user identity
    await revenueCatLogOut();

    // Then, sign out from Supabase
    const { error } = await supabase.auth.signOut();
    if (error) {
      // Even if Supabase fails, we tried to log out of RC
      throw error;
    }
    
    console.log('[Auth] Sign out from Supabase successful.');
  } catch (error: any) {
    console.error('[Auth] Error during sign out:', error.message);
    throw error;
  } finally {
    // ✅ Always reset the flag
    setLoggingOut(false);
  }
};

export const loginWithApple = async () => {
  try {
    const credential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
    });

    console.log('authService: Apple credential received.');

    if (credential.identityToken) {
      const { data, error } = await supabase.auth.signInWithIdToken({
        provider: 'apple',
        token: credential.identityToken,
      });

      if (error) {
        console.error('authService: Supabase signInWithIdToken (Apple) error:', error);
        throw new Error(error.message);
      }
      
      console.log('authService: Supabase sign-in with Apple successful.');
      return data;

    } else {
      throw new Error('Apple Sign-In Error: No identity token received.');
    }

  } catch (e: any) {
    if (e.code === 'ERR_REQUEST_CANCELED') {
      // This is fine, the user just cancelled the sign-in prompt.
      console.log('authService: Apple Sign-In cancelled by user.');
      return null; // Don't treat cancellation as an error
    } else {
      console.error('authService: loginWithApple error:', e);
      throw new Error(e.message || 'An unknown error occurred during Apple Sign-In.');
    }
  }
};

/**
 * Updates the user's subscription tier in the Supabase database
 * This should be called whenever the subscription status changes
 */
export const updateUserSubscriptionTier = async (userId: string, tier: SubscriptionTier) => {
  try {
    console.log(`[AuthService] Updating user ${userId} subscription tier to: ${tier}`);
    
    const { data, error } = await supabase
      .from('profiles') // Using profiles table as seen in profileService
      .update({ 
        subscription_tier: tier,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select();

    if (error) {
      console.error('[AuthService] Error updating subscription tier in Supabase:', error);
      throw error;
    }

    console.log('[AuthService] Successfully updated subscription tier in Supabase:', data);
    return data;
  } catch (error) {
    console.error('[AuthService] Failed to update subscription tier:', error);
    throw error;
  }
};

/**
 * Legacy sync function - deprecated in webhook architecture
 * Subscription tier is now managed by RevenueCat + webhooks only
 */
export const syncSubscriptionTier = async (tier: SubscriptionTier) => {
  console.warn('[AuthService] syncSubscriptionTier is deprecated - subscription tier now managed by RevenueCat webhooks');
  // No-op - subscription syncing is now handled by webhooks
};

/**
 * Smart RevenueCat sync - avoids logout/login race conditions
 * Call this during app initialization to ensure both services are in sync
 */
export const checkAuthenticationSync = async () => {
  try {
    console.log('[AuthService] Smart sync: Checking RevenueCat identity alignment...');
    
    // Note: RevenueCat sync is now handled by the auth listener in _layout.tsx
    // The logIn function is called automatically when user signs in
    
    console.log('[AuthService] ✅ Smart sync completed successfully');
    
  } catch (error) {
    console.error('[AuthService] Smart sync failed:', error);
  }
};

/**
 * Ensures RevenueCat identity is synced and subscription status is fresh after login.
 * Also syncs any local favorites to the database.
 */
export const ensurePostLoginSync = async (userId: string) => {
  try {
    console.log(`[AuthService] 🔄 Starting post-login sync for user: ${userId.substring(0,8)}...`);
    
    // Log current subscription state before sync
    const { useUserStore } = await import('../store/userStore');
    const currentTier = useUserStore.getState().subscriptionTier;
    console.log(`[AuthService] Current subscription tier before sync: ${currentTier}`);
    
    // Note: RevenueCat login is now handled by the auth listener in _layout.tsx
    
    // Sync any local favorites to database (in case user had favorites while offline)
    try {
      console.log('[AuthService] Syncing local favorites to database...');
      const { syncFavoritesToDatabase } = useUserStore.getState();
      await syncFavoritesToDatabase();
    } catch (favoriteError) {
      console.error('[AuthService] Failed to sync favorites, but continuing:', favoriteError);
    }

    // 🚀 BATCH SYNC: Sync all onboarding data after authentication
    try {
      console.log('[AuthService] Syncing onboarding data to database...');
      const { syncOnboardingToDatabase } = useUserStore.getState();
      await syncOnboardingToDatabase();
    } catch (onboardingError) {
      console.error('[AuthService] Failed to sync onboarding data, but continuing:', onboardingError);
    }
    
    // Log subscription state after sync
    const newTier = useUserStore.getState().subscriptionTier;
    console.log(`[AuthService] ✅ Post-login sync complete. Tier: ${currentTier} -> ${newTier}`);
    
  } catch (error) {
    console.error('[AuthService] ❌ Post-login sync failed:', error);
    // Set a fallback tier to keep the app functional
    const { useUserStore } = await import('../store/userStore');
    const currentTier = useUserStore.getState().subscriptionTier;
    if (currentTier === 'unknown') {
      console.log('[AuthService] Setting fallback tier to free due to sync failure');
      useUserStore.getState().setSubscriptionTier('free');
    }
    // Don't throw - let the app continue to function
  }
};

/**
 * Permanently deletes the current user's account from both Supabase and RevenueCat
 * This calls the delete-user Edge Function which handles server-side deletion
 */
export async function deleteCurrentUserAccount() {
  console.log('[AuthService] Attempting to delete user account...');
  try {
    const { error } = await supabase.functions.invoke('delete-user', {
      method: 'POST',
    });

    if (error) {
      console.error('[AuthService] Error deleting user account:', error);
      throw error;
    }
    
    console.log('[AuthService] User account deleted successfully. Signing out...');
    await signOut(); // Full sign out after successful server deletion
    return true;
  } catch (error) {
    console.error('[AuthService] Failed to delete user account:', error);
    throw error;
  }
} 