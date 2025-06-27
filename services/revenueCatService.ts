import Purchases, { LOG_LEVEL, PurchasesStoreProduct, CustomerInfo } from 'react-native-purchases';
import { useUserStore } from '../store/userStore';
import { supabase } from './supabaseClient'; // Ensure Supabase is imported

const API_KEY = process.env.EXPO_PUBLIC_RC_API_KEY;

/**
 * Initializes the RevenueCat SDK at app startup.
 * Now prevents duplicate configuration and optionally takes a user ID.
 * @param uid Optional user ID to configure with (prevents anonymous ID creation)
 */
export const initRevenueCat = async (uid?: string) => {
  if (!API_KEY) {
    console.warn('[RevenueCat] API key is missing.');
    return;
  }
  
  // ✅ Check if already configured to prevent duplication
  const isConfigured = await Purchases.isConfigured();
  if (isConfigured) {
    console.log('[RevenueCat] SDK already configured, skipping initialization.');
    return;
  }
  
  // Configure with optional user ID to prevent unnecessary anonymous ID creation
  await Purchases.configure({ 
    apiKey: API_KEY, 
    appUserID: uid 
  });
  
  // Set appropriate log level
  Purchases.setLogLevel(__DEV__ ? LOG_LEVEL.DEBUG : LOG_LEVEL.ERROR);
  
  console.log('[RevenueCat] SDK configured successfully.');

  // Add a listener for real-time subscription updates
  Purchases.addCustomerInfoUpdateListener(updateSubscriptionTier);
};

/**
 * Consolidated subscription tier update function
 * Uses store's loggingOut flag and upsert for Supabase
 */
const updateSubscriptionTier = async (customerInfo: CustomerInfo) => {
  // ✅ Check the store's loggingOut flag instead of module flag
  const { loggingOut } = useUserStore.getState();
  if (loggingOut) {
    console.log('[RevenueCat] Logout in progress, listener is skipping database write.');
    return;
  }

  const { entitlements } = customerInfo;
  const hasPremium = entitlements.active.premium?.isActive || false;
  const newTier = hasPremium ? 'premium' : 'free';

  useUserStore.getState().setSubscriptionTier(newTier);
  console.log(`[RevenueCat] Listener updated subscription tier to: ${newTier}`);

  // ✅ Background sync to Supabase with upsert
  const userId = useUserStore.getState().supabaseUser?.id;
  if (userId && !customerInfo.originalAppUserId.startsWith('$RCAnonymousID:')) {
    try {
      console.log(`[RevenueCat] Syncing tier '${newTier}' to Supabase for user ${userId}`);
      await supabase
        .from('profiles')
        .upsert({ 
          id: userId, 
          subscription_tier: newTier,
          updated_at: new Date().toISOString()
        });
      console.log(`[RevenueCat] Successfully synced tier to Supabase.`);
    } catch (error: any) {
      console.error('[RevenueCat] Error updating subscription tier in Supabase:', error.message);
    }
  } else {
    console.log('[RevenueCat] Skipping Supabase sync: User is anonymous or logged out.');
  }
};

/**
 * Associates the current RevenueCat user with your app's user ID.
 * Now includes immediate refresh to ensure UI consistency.
 * @param userId The unique user ID from your system (e.g., Supabase user ID).
 */
export const logIn = async (userId: string) => {
  try {
    console.log(`[RevenueCat] Identifying user: ${userId}`);
    
    // Ensure RevenueCat is configured before attempting to log in
    const isConfigured = await Purchases.isConfigured();
    if (!isConfigured) {
      console.log('[RevenueCat] SDK not configured, initializing with user ID...');
      await initRevenueCat(userId);
      return; // initRevenueCat with userId already handles the login
    }
    
    await Purchases.logIn(userId);
    
    // ✅ Force immediate refresh to prevent stale UI
    await Purchases.getCustomerInfo();
    
    console.log('[RevenueCat] User logged in successfully with immediate refresh');
  } catch (e: any) {
    console.error('[RevenueCat] Login error:', e.message);
  }
};

/**
 * Consolidated logout function that safely handles anonymous users.
 * Uses store's loggingOut flag instead of module flag.
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

    // ✅ Check if the user is already anonymous to prevent errors
    const isAnonymous = await Purchases.isAnonymous();
    if (isAnonymous) {
      console.log('[RevenueCat] User is already anonymous. Skipping logout call.');
      useUserStore.getState().setSubscriptionTier('free');
      return;
    }

    console.log('[RevenueCat] Logging out user...');
    await Purchases.logOut();
    useUserStore.getState().setSubscriptionTier('free');
    console.log('[RevenueCat] Logout successful.');
  } catch (e: any) {
    console.error('[RevenueCat] Logout error:', e.message);
    // Ensure tier is set to free even on error
    useUserStore.getState().setSubscriptionTier('free');
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
    
    // ✅ Use cached customer info to avoid unnecessary network calls
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

/**
 * Forces a refresh of the customer info from the network if the cache is stale.
 * Now uses cachedOrFetched policy for better performance.
 */
export const refreshCustomerInfo = async () => {
  try {
    console.log('[RevenueCat] Refreshing customer info...');
    // ✅ Use cached customer info when available
    const customerInfo = await Purchases.getCustomerInfo(); 
    
    // The listener will automatically handle the update
    console.log('[RevenueCat] Refresh complete. Listener will handle any updates.');
  } catch (e: any) {
    console.warn('[RevenueCat] Customer info refresh failed:', e.message);
  }
}; 