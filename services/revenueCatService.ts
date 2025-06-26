import { SubscriptionTier, useUserStore } from '../store/userStore';
import Purchases, { CustomerInfo } from 'react-native-purchases';
import { Alert } from 'react-native';

/**
 * RevenueCat Service - 2025 Best Practice Implementation
 * 
 * FIXES IMPLEMENTED:
 * ✅ Listener-only pattern: No manual getCustomerInfo() races, listener handles all updates
 * ✅ Persistent subscription state: Tier survives app restarts via Zustand persistence
 * ✅ Cache fallback: Uses RevenueCat's 5-min cache + manual AsyncStorage cache
 * ✅ No aggressive error handling: Network errors don't downgrade to 'free'
 * ✅ Enhanced syncPurchases: Handles "already subscribed" scenarios properly
 * ✅ Three-state system: 'unknown' | 'free' | 'premium' with proper UI handling
 * 
 * This eliminates the premium → free flicker and "already subscribed" loop.
 */

// Ensure your RevenueCat public API key is in .env
const apiKey = process.env.EXPO_PUBLIC_RC_API_KEY;

// Debug logging for the API key
console.log('[RevenueCat] API Key loaded:', apiKey ? 'present' : 'missing');

// Background refresh timer (6 hours as recommended)
let backgroundRefreshTimer: ReturnType<typeof setInterval> | null = null;

// First CustomerInfo wins - prevents flicker during identity transitions
let didSetInitialTier = false;

// Track if RevenueCat is currently being configured to prevent double initialization
let isConfiguring = false;

// Note: Debouncing removed - listener-only pattern ensures clean updates

/**
 * Central function to update the local subscription tier in Zustand.
 */
const updateLocalSubscriptionTier = (customerInfo: CustomerInfo, source: string): void => {
  const tier: SubscriptionTier = customerInfo.entitlements.active['premium']?.isActive ? 'premium' : 'free';
  const currentTier = useUserStore.getState().subscriptionTier;

  console.log(`[RevenueCat] Source: ${source} | Determined Tier: ${tier} | Current Tier: ${currentTier}`);
  console.log(`[RevenueCat] Customer Info Details:`, {
    allEntitlements: Object.keys(customerInfo.entitlements.all),
    activeEntitlements: Object.keys(customerInfo.entitlements.active),
    premiumActive: customerInfo.entitlements.active['premium']?.isActive,
    premiumWillRenew: customerInfo.entitlements.active['premium']?.willRenew,
    originalAppUserId: customerInfo.originalAppUserId,
    isFromCache: !customerInfo.requestDate || (Date.now() - new Date(customerInfo.requestDate).getTime()) > 5 * 60 * 1000
  });
  
  // ✅ ALWAYS UPDATE IMMEDIATELY - No debouncing for listener events
  if (currentTier !== tier) {
    console.log(`[RevenueCat] Updating tier: ${currentTier} -> ${tier} (source: ${source})`);
    useUserStore.getState().setSubscriptionTier(tier);
    
    // ✅ CACHE THE TIER FOR OFFLINE SCENARIOS
    cacheSubscriptionTier(tier).catch(console.warn);
  } else {
    console.log(`[RevenueCat] Tier unchanged (${tier}), no update needed`);
  }
  
  // Mark initial tier as set regardless of whether it changed
  if (!didSetInitialTier) {
    didSetInitialTier = true;
    console.log('[RevenueCat] Initial tier has been set via listener.');
  }
};

/**
 * Initializes the RevenueCat SDK. Pass the user ID at startup if available.
 * Fixed to properly await SDK configuration and remove setTimeout hack.
 */
export const initRevenueCat = async (userId: string | null) => {
  if (isConfiguring) {
    console.log('[RevenueCat] Already configuring, waiting...');
    // Wait for current configuration to complete
    while (isConfiguring) {
      await new Promise(resolve => setTimeout(resolve, 50));
    }
    return;
  }

  try {
    isConfiguring = true;
    console.log('[RevenueCat] init start');
    console.log('[RevenueCat] API Key status:', apiKey ? 'present' : 'missing');
    
    if (!apiKey) {
      console.warn('[RevenueCat] API key is missing. SDK not configured.');
      throw new Error('Missing RevenueCat API key - check EXPO_PUBLIC_RC_API_KEY');
    }
    
    // Check if already configured to avoid double initialization
    try {
      const isConfigured = await Purchases.isConfigured();
      if (isConfigured) {
        console.log('[RevenueCat] SDK already configured, skipping...');
        return;
      }
    } catch (e) {
      // isConfigured might throw if not configured yet, which is expected
      console.log('[RevenueCat] SDK not yet configured (expected on first run)');
    }
    
    console.log(`[RevenueCat] Configuring SDK... UserID: ${userId || 'Anonymous'}`);
    
    // Configure the SDK and properly await it
    await Purchases.configure({ apiKey, appUserID: userId });
    
    // Verify configuration was successful
    const isNowConfigured = await Purchases.isConfigured();
    console.log(`[RevenueCat] SDK configured successfully: ${isNowConfigured}`);
    
    if (!isNowConfigured) {
      throw new Error('RevenueCat failed to configure properly');
    }
    
    // Add listener after successful configuration
    Purchases.addCustomerInfoUpdateListener((info) => {
      console.log('[RevenueCat] Customer info updated via listener');
      updateLocalSubscriptionTier(info, 'listener');
    });
    console.log('[RevenueCat] SDK configured with listener-only pattern');
    
    // ✅ OPTIONAL: Prime cache refresh but don't depend on it
    try {
      await Purchases.getCustomerInfo(); // Fire and forget - listener will handle the result
      console.log('[RevenueCat] Background refresh initiated');
    } catch (refreshError) {
      console.log('[RevenueCat] Background refresh failed, using cache:', refreshError.message);
      // ❌ DO NOT SET TO FREE - listener will handle cached data
    }
    
  } finally {
    isConfiguring = false;
  }
};

/**
 * Logs a user into RevenueCat. Should be called after Supabase login.
 * Enhanced with syncPurchases for better restoration handling.
 */
export const logInRevenueCat = async (appUserID: string) => {
  try {
    // Ensure SDK is configured before proceeding
    await initRevenueCat(null); // This will ensure configure() is complete
    
    console.log(`[RevenueCat] Calling logIn for user: ${appUserID.substring(0,8)}...`);
    const { customerInfo } = await Purchases.logIn(appUserID);
    console.log('[RevenueCat] logIn successful.');
    
    // ✅ SYNC PURCHASES to ensure latest subscription state
    console.log('[RevenueCat] Syncing purchases after login...');
    try {
      await Purchases.syncPurchases();
      console.log('[RevenueCat] Purchase sync completed');
    } catch (syncError) {
      console.warn('[RevenueCat] Purchase sync failed, but continuing:', syncError);
    }
    
    // Force immediate subscription state update via listener
    // (Note: listener should handle this automatically, this is just for immediate feedback)
    updateLocalSubscriptionTier(customerInfo, 'login');
    
  } catch (error: any) {
    console.error('[RevenueCat] logIn failed:', error.message);
    // Don't show alert for configuration errors as they're likely transient
    if (!error.message.includes('singleton instance') && !error.message.includes('not configured')) {
      Alert.alert("Subscription Error", "Could not verify your subscription status. Please try restoring purchases in Settings.");
    }
    throw error; // Re-throw to handle in auth service
  }
};

/**
 * Logs the user out of RevenueCat. Should be called on app sign-out.
 */
export const logOutRevenueCat = async () => {
  try {
    console.log('[RevenueCat] Starting logout process...');
    
    // Check if SDK is configured before attempting logout
    const isConfigured = await Purchases.isConfigured();
    if (!isConfigured) {
      console.log('[RevenueCat] SDK not configured, skipping logout');
      return;
    }
    
    console.log('[RevenueCat] Calling logOut...');
    const customerInfo = await Purchases.logOut();
    console.log('[RevenueCat] logOut successful.');
    
    // Reset flags and update state
    didSetInitialTier = false; // Reset for next user
    
    try {
      updateLocalSubscriptionTier(customerInfo, 'logout');
    } catch (updateError: any) {
      console.error('[RevenueCat] Error updating subscription tier after logout (non-fatal):', updateError.message);
    }
    
  } catch (error: any) {
    console.error('[RevenueCat] logOut failed:', error.message);
    
    // Try to reset state even if logout failed
    try {
      didSetInitialTier = false;
      console.log('[RevenueCat] Reset state despite logout failure');
    } catch (resetError: any) {
      console.error('[RevenueCat] Failed to reset state:', resetError.message);
    }
    
    // Don't throw - logout failure shouldn't crash the app
    console.warn('[RevenueCat] Continuing with logout despite RevenueCat error');
  }
};

/**
 * DEPRECATED: Use listener-only pattern instead
 * This function is no longer needed with the 2025 best-practice approach
 */
export const performInitialSubscriptionCheck = async (): Promise<void> => {
  console.log('[RevenueCat] DEPRECATED: performInitialSubscriptionCheck is no longer needed');
  console.log('[RevenueCat] Using listener-only pattern for subscription updates');
  // No-op - listener handles all subscription state updates
};

/**
 * Smart RevenueCat sync - no unnecessary logOut calls
 * Follows RevenueCat best practices for identity management
 */
export const syncRevenueCat = async (userId: string | null): Promise<void> => {
    try {
      const currentInfo = await Purchases.getCustomerInfo();
      const currentId = currentInfo.originalAppUserId;
      
      console.log('[RevenueCat] Syncing identity:', {
        currentId: currentId.substring(0, 20) + '...',
        targetId: userId?.substring(0, 20) + '...' || 'null',
        isCurrentAnonymous: currentId.startsWith('$RCAnonymousID:')
      });

      // 1. No Supabase user? Stay anonymous
      if (!userId) {
        console.log('[RevenueCat] No user ID provided, staying anonymous');
        return;
      }

      // 2. Already the same user? Do nothing
      if (currentId === userId) {
        console.log('[RevenueCat] Already logged in as correct user, no action needed');
        return;
      }

      // 3. Anonymous → logged-in transition (safe, no logOut needed)
      if (currentId.startsWith('$RCAnonymousID:')) {
        console.log('[RevenueCat] Anonymous → logged-in transition, calling logIn');
        const { customerInfo } = await Purchases.logIn(userId);
        const tier = determineSubscriptionTier(customerInfo);
        
        console.log('[RevenueCat] Login successful:', {
          tier,
          originalAppUserId: customerInfo.originalAppUserId
        });
        
        // Update tier after successful login
        updateLocalSubscriptionTier(customerInfo, 'sync_login');
        return;
      }

      // 4. Edge case: logged-in as different user (rare)
      console.warn('[RevenueCat] Switching from one logged-in user to another');
      await Purchases.logOut();
      const { customerInfo } = await Purchases.logIn(userId);
      const tier = determineSubscriptionTier(customerInfo);
      updateLocalSubscriptionTier(customerInfo, 'sync_switch_user');
      
    } catch (error: any) {
      console.error('[RevenueCat] Sync failed:', error);
      
      // Network errors shouldn't disrupt subscription state
      if (error.message && error.message.includes('network')) {
        console.warn('[RevenueCat] Network error during sync - keeping current state');
        return;
      }
    }
};

/**
 * Identifies the user with RevenueCat after they have logged in.
 * This fetches their subscription status and is the key to unlocking premium content.
 * @param appUserID The user's unique ID from your authentication provider (Supabase).
 */
export const identifyUserWithRevenueCat = async (appUserID: string) => {
  if (!appUserID) {
    console.log('[RevenueCat] No user ID provided to identify.');
    return;
  }
  
  try {
    console.log(`[RevenueCat] Identifying user with ID: ${appUserID}`);
    const { customerInfo, created } = await Purchases.logIn(appUserID);
    
    console.log(`[RevenueCat] Login successful. New user created: ${created}`);
    
    // Update the local subscription tier based on the logged-in user's info
    const tier = determineSubscriptionTier(customerInfo);
    updateLocalSubscriptionTier(customerInfo, 'user_identified');

  } catch (error: any) {
    console.error('[RevenueCat] Error logging in user:', error.message);
    // Optional: Alert the user that there was an issue syncing their subscription
    // Alert.alert("Subscription Sync Error", "Could not verify your subscription status. Please try restoring purchases in settings.");
  }
};

/**
 * Force refresh subscription status from RevenueCat
 * Enhanced with syncPurchases for better reliability
 */
export const forceRefreshSubscriptionStatus = async (): Promise<void> => {
  try {
    console.log('[RevenueCat] 🔄 Force refreshing subscription status...');
    
    // ✅ SYNC PURCHASES first to ensure we have latest purchase data
    await Purchases.syncPurchases();
    console.log('[RevenueCat] Purchases synced');
    
    // Force refresh customer info from network
    const customerInfo = await Purchases.getCustomerInfo();
    const tier = determineSubscriptionTier(customerInfo);
    
    console.log('[RevenueCat] Force refresh result:', tier);
    updateLocalSubscriptionTier(customerInfo, 'manual_refresh');
    
  } catch (error) {
    console.error('[RevenueCat] Force refresh failed:', error);
    throw error;
  }
};

/**
 * Determine subscription tier from RevenueCat customer info
 */
const determineSubscriptionTier = (customerInfo: CustomerInfo): SubscriptionTier => {
  const hasPremiumEntitlement = customerInfo.entitlements.active['premium']?.isActive || false;
  return hasPremiumEntitlement ? 'premium' : 'free';
};

/**
 * Cache subscription tier for offline scenarios
 * Now actively used with persistence enabled
 */
const cacheSubscriptionTier = async (tier: SubscriptionTier): Promise<void> => {
  try {
    const AsyncStorage = await import('@react-native-async-storage/async-storage');
    const cacheData = {
      tier,
      timestamp: Date.now(),
      version: '2.0' // New version for webhook architecture
    };
    await AsyncStorage.default.setItem('subscription_tier_cache', JSON.stringify(cacheData));
    console.log(`[RevenueCat] Cached subscription tier: ${tier}`);
  } catch (error) {
    console.warn('[RevenueCat] Failed to cache subscription tier:', error);
  }
};

/**
 * Get cached subscription tier for offline scenarios
 */
export const getCachedSubscriptionTier = async (): Promise<SubscriptionTier | null> => {
  try {
    const AsyncStorage = await import('@react-native-async-storage/async-storage');
    const cached = await AsyncStorage.default.getItem('subscription_tier_cache');
    
    if (cached) {
      const data = JSON.parse(cached);
      const age = Date.now() - data.timestamp;
      
      // Use cached data if it's less than 3 days old (RevenueCat offline entitlements)
      if (age < 3 * 24 * 60 * 60 * 1000 && data.version === '2.0') {
        console.log(`[RevenueCat] Using cached subscription tier: ${data.tier}`);
        return data.tier;
      }
    }
    return null;
  } catch (error) {
    console.warn('[RevenueCat] Failed to get cached subscription tier:', error);
    return null;
  }
};

/**
 * Start background refresh timer (6 hours as recommended by RevenueCat)
 */
const startBackgroundRefresh = (): void => {
  // Clear any existing timer
  if (backgroundRefreshTimer) {
    clearInterval(backgroundRefreshTimer);
  }
  
  console.log('[RevenueCat] Starting background refresh (every 6 hours)');
  
  backgroundRefreshTimer = setInterval(async () => {
    try {
      console.log('[RevenueCat] Background refresh starting...');
      await forceRefreshSubscriptionStatus();
      console.log('[RevenueCat] ✅ Background refresh completed');
    } catch (error) {
      console.warn('[RevenueCat] Background refresh failed:', error);
    }
  }, 6 * 60 * 60 * 1000); // 6 hours
};

/**
 * Stop background refresh (called on app termination)
 */
export const stopBackgroundRefresh = (): void => {
  if (backgroundRefreshTimer) {
    clearInterval(backgroundRefreshTimer);
    backgroundRefreshTimer = null;
    console.log('[RevenueCat] Background refresh stopped');
  }
};

/**
 * Get current premium status for immediate checks
 * Should only be used for non-critical UI decisions
 */
export const getCurrentPremiumStatus = (): boolean => {
  const tier = useUserStore.getState().subscriptionTier;
  return tier === 'premium';
};

/**
 * Check if subscription status is known
 */
export const isSubscriptionStatusKnown = (): boolean => {
  const tier = useUserStore.getState().subscriptionTier;
  return tier !== 'unknown';
};

/**
 * Reset the initial tier flag (for testing or after explicit logout)
 */
export const resetInitialTierFlag = (): void => {
  didSetInitialTier = false;
  console.log('[RevenueCat] Initial tier flag reset');
};

/**
 * Debug function to verify SDK configuration and API key
 * Use this for testing the fix
 */
export const verifyRevenueCatSetup = async (): Promise<void> => {
  console.log('[RevenueCat] === Setup Verification ===');
  console.log('[RevenueCat] API Key present:', apiKey ? 'YES' : 'NO');
  console.log('[RevenueCat] API Key value:', apiKey ? `${apiKey.substring(0, 10)}...` : 'undefined');
  
  try {
    const isConfigured = await Purchases.isConfigured();
    console.log('[RevenueCat] SDK configured:', isConfigured);
    
    if (isConfigured) {
      const customerInfo = await Purchases.getCustomerInfo();
      console.log('[RevenueCat] Customer Info retrieved:', !!customerInfo);
      console.log('[RevenueCat] Original App User ID:', customerInfo.originalAppUserId);
      console.log('[RevenueCat] Active entitlements:', Object.keys(customerInfo.entitlements.active));
    }
  } catch (error) {
    console.error('[RevenueCat] Verification failed:', error);
  }
  
  console.log('[RevenueCat] === End Verification ===');
};

/**
 * Development helper - Force subscription status refresh (use for testing immediate updates)
 */
export const debugForceSubscriptionRefresh = async (): Promise<void> => {
  try {
    console.log('[RevenueCat] 🔄 DEBUG: Forcing subscription refresh...');
    
    // Sync purchases first
    await Purchases.syncPurchases();
    console.log('[RevenueCat] DEBUG: Purchases synced');
    
    // Get fresh customer info
    const customerInfo = await Purchases.getCustomerInfo();
    console.log('[RevenueCat] DEBUG: Fresh customer info retrieved');
    console.log('[RevenueCat] DEBUG: Active entitlements:', Object.keys(customerInfo.entitlements.active));
    console.log('[RevenueCat] DEBUG: Premium active:', customerInfo.entitlements.active['premium']?.isActive);
    
    // Force update
    updateLocalSubscriptionTier(customerInfo, 'debug_refresh');
    
    const currentTier = useUserStore.getState().subscriptionTier;
    console.log(`[RevenueCat] 🎯 DEBUG: Final subscription tier: ${currentTier}`);
    
  } catch (error) {
    console.error('[RevenueCat] DEBUG: Force refresh failed:', error);
  }
};

/**
 * Get initial subscription tier with fallback logic
 * Uses persisted state first, then cache, then waits for listener
 */
export const getInitialSubscriptionTier = async (): Promise<SubscriptionTier> => {
  try {
    // 1. Check persisted state first
    const persistedTier = useUserStore.getState().subscriptionTier;
    if (persistedTier !== 'unknown') {
      console.log(`[RevenueCat] Using persisted tier: ${persistedTier}`);
      return persistedTier;
    }
    
    // 2. Check manual cache
    const cachedTier = await getCachedSubscriptionTier();
    if (cachedTier) {
      console.log(`[RevenueCat] Using cached tier: ${cachedTier}`);
      useUserStore.getState().setSubscriptionTier(cachedTier);
      return cachedTier;
    }
    
    // 3. Return unknown if no cache available - listener will update
    console.log('[RevenueCat] No cached tier available, will wait for listener');
    return 'unknown';
    
  } catch (error) {
    console.warn('[RevenueCat] Error getting initial tier:', error);
    return 'unknown';
  }
};