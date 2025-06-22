import { SubscriptionTier, useUserStore } from '../store/userStore';
import Purchases, { CustomerInfo } from 'react-native-purchases';
import { Alert } from 'react-native';

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

// Debounce timer for subscription tier updates
let tierUpdateTimeout: number | null = null;

/**
 * Central function to update the local subscription tier in Zustand.
 */
const updateLocalSubscriptionTier = (customerInfo: CustomerInfo, source: string): void => {
  const tier: SubscriptionTier = customerInfo.entitlements.active['premium']?.isActive ? 'premium' : 'free';
  const currentTier = useUserStore.getState().subscriptionTier;

  console.log(`[RevenueCat] Source: ${source} | Determined Tier: ${tier} | Current Tier: ${currentTier}`);
  console.log(`[RevenueCat] EntitlementsDebug:`, {
    allEntitlements: Object.keys(customerInfo.entitlements.all),
    activeEntitlements: Object.keys(customerInfo.entitlements.active),
    premiumActive: customerInfo.entitlements.active['premium']?.isActive,
    premiumWillRenew: customerInfo.entitlements.active['premium']?.willRenew
  });
  
  // Skip update if tier hasn't changed
  if (currentTier === tier) {
    console.log(`[RevenueCat] Tier unchanged (${tier}), skipping update`);
    return;
  }
  
  // For login sources, always update immediately - don't wait for initial tier logic
  if (source.includes('login') || source === 'login_refresh') {
    console.log(`[RevenueCat] IMMEDIATE LOGIN UPDATE: ${currentTier} -> ${tier}`);
    useUserStore.getState().setSubscriptionTier(tier);
    didSetInitialTier = true;
    return;
  }
  
  // For other sources, use debouncing to prevent rapid updates
  if (tierUpdateTimeout) {
    clearTimeout(tierUpdateTimeout);
  }
  
  tierUpdateTimeout = setTimeout(() => {
    const latestTier = useUserStore.getState().subscriptionTier;
    if (latestTier !== tier) {
      console.log(`[RevenueCat] Debounced tier update: ${latestTier} -> ${tier} (source: ${source})`);
      useUserStore.getState().setSubscriptionTier(tier);
    }
    
    if (!didSetInitialTier) {
      didSetInitialTier = true;
      console.log('[RevenueCat] Initial tier has been set.');
    }
  }, 200); // 200ms debounce
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
    Purchases.addCustomerInfoUpdateListener((info) => updateLocalSubscriptionTier(info, 'listener'));
    console.log('[RevenueCat] SDK configured and listener attached.');
    
    // Get initial customer info immediately after configuration
    try {
      const customerInfo = await Purchases.getCustomerInfo();
      updateLocalSubscriptionTier(customerInfo, 'initial_config');
      console.log('[RevenueCat] Initial customer info retrieved after configuration');
    } catch (infoError) {
      console.warn('[RevenueCat] Could not get initial customer info:', infoError);
    }
    
  } finally {
    isConfiguring = false;
  }
};

/**
 * Logs a user into RevenueCat. Should be called after Supabase login.
 * Fixed to ensure configuration before proceeding and force immediate subscription update.
 */
export const logInRevenueCat = async (appUserID: string) => {
  try {
    // Ensure SDK is configured before proceeding
    await initRevenueCat(null); // This will ensure configure() is complete
    
    console.log(`[RevenueCat] Calling logIn for user: ${appUserID.substring(0,8)}...`);
    const { customerInfo } = await Purchases.logIn(appUserID);
    console.log('[RevenueCat] logIn successful.');
    
    // Force immediate subscription state update
    updateLocalSubscriptionTier(customerInfo, 'login');
    
    // Force refresh to get the absolute latest subscription state
    console.log('[RevenueCat] Forcing immediate subscription refresh after login...');
    try {
      const refreshedInfo = await Purchases.getCustomerInfo();
      updateLocalSubscriptionTier(refreshedInfo, 'login_refresh');
      console.log('[RevenueCat] Immediate refresh complete');
    } catch (refreshError) {
      console.warn('[RevenueCat] Refresh after login failed:', refreshError);
    }
    
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
    // Check if SDK is configured before attempting logout
    const isConfigured = await Purchases.isConfigured();
    if (!isConfigured) {
      console.log('[RevenueCat] SDK not configured, skipping logout');
      return;
    }
    
    console.log('[RevenueCat] Calling logOut...');
    const customerInfo = await Purchases.logOut();
    console.log('[RevenueCat] logOut successful.');
    didSetInitialTier = false; // Reset for next user
    updateLocalSubscriptionTier(customerInfo, 'logout');
  } catch (error: any) {
    console.error('[RevenueCat] logOut failed:', error.message);
  }
};

/**
 * Perform initial subscription check - now serialized
 */
export const performInitialSubscriptionCheck = async (): Promise<void> => {
  try {
    console.log('[RevenueCat] Performing initial subscription check...');
    
    // Get customer info (uses cache if available)
    const customerInfo = await Purchases.getCustomerInfo();
    const tier = determineSubscriptionTier(customerInfo);
    
    console.log('[RevenueCat] Initial check result:', {
      tier,
      fromCache: !customerInfo.requestDate || (Date.now() - new Date(customerInfo.requestDate).getTime()) < 5 * 60 * 1000,
      originalAppUserId: customerInfo.originalAppUserId
    });
    
    // Only update if we haven't set initial tier yet
    if (!didSetInitialTier) {
      updateLocalSubscriptionTier(customerInfo, 'initial_check');
      didSetInitialTier = true;
    } else {
      console.log('[RevenueCat] Skipping initial check - tier already set by listener');
    }
    
  } catch (error) {
    console.error('[RevenueCat] Initial subscription check failed:', error);
    // Don't update tier on error - keep current state
  }
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
 */
export const forceRefreshSubscriptionStatus = async (): Promise<void> => {
  try {
    console.log('[RevenueCat] 🔄 Force refreshing subscription status...');
    
    // Sync purchases first to ensure we have latest data
    await Purchases.syncPurchases();
    
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