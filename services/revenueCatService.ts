import Purchases, { LOG_LEVEL, PurchasesStoreProduct, CustomerInfo } from 'react-native-purchases';
import { useUserStore } from '../store/userStore';
import { supabase } from './supabaseClient'; // Ensure Supabase is imported
import { isLoggingOut } from './authService'; // ✅ Import the flag

const API_KEY = process.env.EXPO_PUBLIC_RC_API_KEY;

/**
 * Initializes the RevenueCat SDK at app startup.
 * This should be called once when the app is launched.
 */
export const initRevenueCat = async () => {
  if (!API_KEY) {
    console.warn('[RevenueCat] API key is missing.');
    return;
  }
  // It's safe to configure the SDK without a user ID.
  await Purchases.configure({ apiKey: API_KEY });
  console.log('[RevenueCat] SDK configured successfully.');

  // Add a listener for real-time subscription updates
  Purchases.addCustomerInfoUpdateListener(async (customerInfo: CustomerInfo) => {
    // ✅ Step 3: Check the flag before processing
    if (isLoggingOut) {
      console.log('[RevenueCat] Logout in progress, listener is skipping database write.');
      return;
    }

    const hasPremium = customerInfo.entitlements.active.premium?.isActive || false;
    const newTier = hasPremium ? 'premium' : 'free';

    const currentState = useUserStore.getState();
    
    // Only update if the tier has actually changed
    if (currentState.subscriptionTier !== newTier) {
      console.log(`[RevenueCat] Tier changed: ${currentState.subscriptionTier} -> ${newTier}. Updating state and DB.`);
      
      // 1. Update UI state first for immediate feedback
      currentState.setSubscriptionTier(newTier);

      // 2. Asynchronously write the new tier to the database as a "shadow write"
      if (currentState.supabaseUser?.id) {
        // This part is now safe and will not run during logout
        try {
          await supabase
            .from('profiles')
            .update({ subscription_tier: newTier })
            .eq('id', currentState.supabaseUser.id);
          console.log(`[RevenueCat] Successfully synced tier '${newTier}' to Supabase.`);
        } catch (error: any) {
          console.error('[RevenueCat] Failed to sync tier to Supabase:', error.message);
        }
      }
    }
  });
};

/**
 * Associates the current RevenueCat user with your app's user ID.
 * Call this function after a user logs in.
 * @param userId The unique user ID from your system (e.g., Supabase user ID).
 */
export const logIn = async (userId: string) => {
  try {
    console.log(`[RevenueCat] Identifying user: ${userId}`);
    
    // Ensure RevenueCat is configured before attempting to log in
    const isConfigured = await Purchases.isConfigured();
    if (!isConfigured) {
      console.log('[RevenueCat] SDK not configured, initializing first...');
      await initRevenueCat();
    }
    
    await Purchases.logIn(userId);
    console.log('[RevenueCat] User logged in successfully');
  } catch (e: any) {
    console.error('[RevenueCat] Login error:', e.message);
  }
};

/**
 * Clears the RevenueCat user identity.
 * Call this function when a user logs out.
 */
export const logOut = async () => {
  try {
    // Check if RevenueCat is configured before attempting to log out
    const isConfigured = await Purchases.isConfigured();
    if (!isConfigured) {
      console.log('[RevenueCat] SDK not configured, skipping logout');
      useUserStore.getState().setSubscriptionTier('free');
      return;
    }

    // ✅ Check if the user is already anonymous
    const isAnonymous = await Purchases.isAnonymous();
    if (isAnonymous) {
      console.log('[RevenueCat] User is already anonymous. Skipping logout call.');
      return;
    }

    console.log('[RevenueCat] Logging out user...');
    await Purchases.logOut();
    useUserStore.getState().setSubscriptionTier('free');
    console.log('[RevenueCat] Logout successful.');
  } catch (e: any) {
    console.error('[RevenueCat] Logout error:', e.message);
  }
};

/**
 * Gets the subscription tier from the latest cached CustomerInfo.
 */
export const getInitialSubscriptionTier = async () => {
  try {
    // Check if RevenueCat is configured before attempting to get customer info
    const isConfigured = await Purchases.isConfigured();
    if (!isConfigured) {
      console.log('[RevenueCat] SDK not configured, initializing first...');
      await initRevenueCat();
    }
    
    const customerInfo = await Purchases.getCustomerInfo();
    const hasPremium = customerInfo.entitlements.active.premium?.isActive || false;
    const tier = hasPremium ? 'premium' : 'free';
    useUserStore.getState().setSubscriptionTier(tier);
    return tier;
  } catch (e) {
    console.warn('[RevenueCat] Could not get initial customer info. Defaulting to unknown.', e);
    return 'unknown';
  }
}; 