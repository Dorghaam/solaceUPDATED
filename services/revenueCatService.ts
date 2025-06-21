import { SubscriptionTier, useUserStore } from '@/store/userStore';
import Constants from 'expo-constants';
import Purchases, { CustomerInfo } from 'react-native-purchases';

// Ensure your RevenueCat public API key is in .env and app.config.js
const apiKey = Constants.expoConfig?.extra?.RC_API_KEY as string;

// Background refresh timer (6 hours as recommended)
let backgroundRefreshTimer: ReturnType<typeof setInterval> | null = null;

// Serialization queue for RevenueCat operations
let rcOperationQueue: Promise<any> | null = null;

// First CustomerInfo wins - prevents flicker during identity transitions
let didSetInitialTier = false;

/**
 * Serialize all RevenueCat identity operations to prevent race conditions
 */
function withRevenueCat<T>(fn: () => Promise<T>): Promise<T> {
  const operation = async () => {
    try {
      return await fn();
    } catch (error) {
      console.error('[RevenueCat] Operation failed:', error);
      throw error;
    }
  };
  
  rcOperationQueue = (rcOperationQueue ?? Promise.resolve())
    .then(() => operation());
    
  return rcOperationQueue;
}

/**
 * Initializes RevenueCat SDK with optional user ID
 * If userID is provided, starts logged in (no anonymous state)
 */
export const initRevenueCat = (userID?: string | null) => {
  return withRevenueCat(async () => {
    console.log('[RevenueCat] Initializing SDK...');
    
    if (!apiKey) {
      console.warn('[RevenueCat] API key is missing. RevenueCat will not be configured.');
      console.warn('[RevenueCat] Check your .env file for EXPO_PUBLIC_RC_API_KEY');
      return;
    }

    const configOptions: any = { apiKey };
    
    // If we have a user ID, start logged in (skip anonymous state)
    if (userID) {
      configOptions.appUserID = userID;
      console.log('[RevenueCat] Configuring with user ID:', userID.substring(0, 8) + '...');
    } else {
      console.log('[RevenueCat] Configuring anonymously');
    }

    Purchases.configure(configOptions);

    // Add listener for real-time subscription updates
    Purchases.addCustomerInfoUpdateListener((customerInfo: CustomerInfo) => {
      const tier = determineSubscriptionTier(customerInfo);
      
      console.log('[RevenueCat] Customer info updated:', {
        originalAppUserId: customerInfo.originalAppUserId,
        tier,
        activeEntitlements: Object.keys(customerInfo.entitlements.active),
        timestamp: new Date().toISOString()
      });
      
      // First CustomerInfo wins strategy - prevents flicker
      if (!didSetInitialTier || tier === 'premium') {
        updateLocalSubscriptionTier(tier, 'revenuecat_listener');
        if (!didSetInitialTier) {
          didSetInitialTier = true;
          console.log('[RevenueCat] Initial tier set, future "free" events ignored unless premium expires');
        }
      } else {
        console.log('[RevenueCat] Ignoring tier update to prevent flicker:', tier);
      }
    });

    // Start background refresh timer (6 hours)
    startBackgroundRefresh();
    
    console.log('[RevenueCat] ✅ SDK configured successfully');
  });
};

/**
 * Perform initial subscription check - now serialized
 */
export const performInitialSubscriptionCheck = async (): Promise<void> => {
  return withRevenueCat(async () => {
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
        updateLocalSubscriptionTier(tier, 'initial_check');
        didSetInitialTier = true;
      } else {
        console.log('[RevenueCat] Skipping initial check - tier already set by listener');
      }
      
    } catch (error) {
      console.error('[RevenueCat] Initial subscription check failed:', error);
      // Don't update tier on error - keep current state
    }
  });
};

/**
 * Smart RevenueCat sync - no unnecessary logOut calls
 * Follows RevenueCat best practices for identity management
 */
export const syncRevenueCat = async (userId: string | null): Promise<void> => {
  return withRevenueCat(async () => {
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
        updateLocalSubscriptionTier(tier, 'sync_login');
        return;
      }

      // 4. Edge case: logged-in as different user (rare)
      console.warn('[RevenueCat] Switching from one logged-in user to another');
      await Purchases.logOut();
      const { customerInfo } = await Purchases.logIn(userId);
      const tier = determineSubscriptionTier(customerInfo);
      updateLocalSubscriptionTier(tier, 'sync_switch_user');
      
    } catch (error: any) {
      console.error('[RevenueCat] Sync failed:', error);
      
      // Network errors shouldn't disrupt subscription state
      if (error.message && error.message.includes('network')) {
        console.warn('[RevenueCat] Network error during sync - keeping current state');
        return;
      }
    }
  });
};

/**
 * Explicit logout for when user signs out of the app
 */
export const rcLogOut = async (): Promise<void> => {
  return withRevenueCat(async () => {
    try {
      const customerInfo = await Purchases.getCustomerInfo();
      
      // Skip if already anonymous
      if (customerInfo.originalAppUserId.startsWith('$RCAnonymousID:')) {
        console.log('[RevenueCat] User already anonymous, skipping logout');
        return;
      }
      
      console.log('[RevenueCat] Explicit logout for user:', customerInfo.originalAppUserId);
      await Purchases.logOut();
      
      // Reset state on explicit logout
      updateLocalSubscriptionTier('unknown', 'explicit_logout');
      didSetInitialTier = false; // Allow new tier to be set after logout
      
    } catch (error: any) {
      if (error.message && error.message.includes('anonymous')) {
        console.log('[RevenueCat] User was already anonymous');
        return;
      }
      console.warn('[RevenueCat] Logout failed:', error);
    }
  });
};

/**
 * Force refresh subscription status from RevenueCat
 */
export const forceRefreshSubscriptionStatus = async (): Promise<void> => {
  return withRevenueCat(async () => {
    try {
      console.log('[RevenueCat] 🔄 Force refreshing subscription status...');
      
      // Sync purchases first to ensure we have latest data
      await Purchases.syncPurchases();
      
      // Force refresh customer info from network
      const customerInfo = await Purchases.getCustomerInfo();
      const tier = determineSubscriptionTier(customerInfo);
      
      console.log('[RevenueCat] Force refresh result:', tier);
      updateLocalSubscriptionTier(tier, 'manual_refresh');
      
    } catch (error) {
      console.error('[RevenueCat] Force refresh failed:', error);
      throw error;
    }
  });
};

/**
 * Determine subscription tier from RevenueCat customer info
 */
const determineSubscriptionTier = (customerInfo: CustomerInfo): SubscriptionTier => {
  const hasPremiumEntitlement = customerInfo.entitlements.active['premium']?.isActive || false;
  return hasPremiumEntitlement ? 'premium' : 'free';
};

/**
 * Update local subscription tier in Zustand store
 * This is the ONLY place where subscription tier should be updated on the client
 */
const updateLocalSubscriptionTier = (tier: SubscriptionTier, source: string): void => {
  const currentTier = useUserStore.getState().subscriptionTier;
  
  // Always log and update to ensure UI reflects the definitive state
  if (currentTier === tier) {
    console.log(`[RevenueCat] Confirming tier (${source}):`, tier);
  } else {
    console.log(`[RevenueCat] Updating tier (${source}): ${currentTier} → ${tier}`);
  }
  
  // Always set the tier to ensure UI updates
  useUserStore.getState().setSubscriptionTier(tier);
  
  // Cache for offline resilience
  cacheSubscriptionTier(tier).catch(console.warn);
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