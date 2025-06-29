import { SubscriptionTier, useUserStore } from '@/store/userStore';
import Constants from 'expo-constants';
import { AppState, AppStateStatus, Platform } from 'react-native';
import Purchases, { CustomerInfo, PurchasesError, PurchasesOfferings, PurchasesPackage, LOG_LEVEL } from 'react-native-purchases';

// 1. CONFIGURE CONSTANTS AND LISTENERS
const RC_API_KEY = Constants.expoConfig?.extra?.RC_API_KEY as string;

let appStateListener: { remove: () => void } | null = null;
let configurePromise: Promise<void> | null = null;

// ✅ FIX: Add debouncing for tier downgrades to prevent flickering
let lastPremiumTimestamp = Date.now();
const DOWNGRADE_GRACE_PERIOD_MS = 20_000; // 20 seconds grace period

// Quality gate - exit early if SDK not configured
if (!RC_API_KEY) {
  throw new Error('Missing EXPO_PUBLIC_RC_API_KEY - check your .env file');
}

/**
 * ✅ FIX: Safe customer info fetching that prevents stale cache flicker
 * Serves cache immediately for snappy UX, then ensures fresh network data
 */
export async function safeGetCustomerInfo(): Promise<CustomerInfo> {
  try {
    // 1. Serve cache immediately so app is snappy
    const cached = await Purchases.getCustomerInfo();

    // 2. Kick off a background sync to ensure fresh data arrives soon
    // Note: Using syncPurchases as a way to force a network refresh
    Purchases.syncPurchases().catch((error) => {
      console.warn('[RevenueCat] Background sync failed:', error);
    });

    return cached;
  } catch (error) {
    console.error('[RevenueCat] safeGetCustomerInfo failed:', error);
    throw error;
  }
}

/**
 * ✅ FIX: Smart tier detection with downgrade debouncing
 * Prevents flicker by holding premium state for grace period during network uncertainty
 */
function tierFromInfo(info: CustomerInfo): SubscriptionTier {
  const isPremium = info.entitlements.active['premium']?.isActive ?? false;
  
  if (isPremium) {
    lastPremiumTimestamp = Date.now();
    return 'premium';
  }

  // Hold premium for grace period after last known good state to prevent flicker
  const timeSinceLastPremium = Date.now() - lastPremiumTimestamp;
  if (!isPremium && timeSinceLastPremium < DOWNGRADE_GRACE_PERIOD_MS) {
    console.log(`[RevenueCat] Holding premium during grace period (${Math.round(timeSinceLastPremium/1000)}s)`);
    return 'premium'; // Keep premium during grace period
  }

  return 'free';
}

/**
 * ✅ FIX: Atomic tier update with equality guard to prevent duplicate renders
 * Updates the global user store with the latest subscription tier.
 * This is the SINGLE SOURCE OF TRUTH for subscription status in the app.
 * @param info - The CustomerInfo object from RevenueCat.
 */
function updateTierFromInfo(info: CustomerInfo) {
  const newTier = tierFromInfo(info);
  const store = useUserStore.getState();
  
  // Atomic update with equality guard
  const currentTier = store.subscriptionTier;
  if (currentTier !== newTier) {
    console.log(`[RevenueCat] Tier updated via listener: ${currentTier} -> ${newTier}`);
    store.setSubscriptionTier(newTier);
  }

  // ✅ FIX: Mark subscription as initialized after first reliable update
  if (!store.subscriptionInitialized) {
    console.log('[RevenueCat] Subscription state initialized');
    store.setSubscriptionInitialized(true);
  }
}

// 2. CORE LIFECYCLE FUNCTIONS

/**
 * Initializes the RevenueCat SDK. Call this once at app startup.
 * Uses a promise gate to prevent race conditions.
 * @param appUserID - The Supabase user ID, if available.
 */
export function initRevenueCat(appUserID?: string | null): Promise<void> {
  if (configurePromise) return configurePromise; // already started
  
  configurePromise = new Promise<void>(async (resolve, reject) => {
    try {
      // Set debug logging in development
      if (__DEV__) {
        Purchases.setLogLevel(LOG_LEVEL.DEBUG);
      }
      
      // Configure with appUserID from the start to prevent anonymous user flicker.
      // FIXED: Removed unnecessary await - configure() is synchronous
      Purchases.configure({ 
        apiKey: RC_API_KEY, 
        appUserID: appUserID || undefined,
        useAmazon: false
      });
      
      console.log(`[RevenueCat] ✅ SDK configured for user: ${appUserID ? appUserID.substring(0, 8) + '...' : 'Anonymous'}`);
      
      // Add the listener that will react to all subscription changes.
      Purchases.addCustomerInfoUpdateListener(updateTierFromInfo);
      
      // Add a listener to refresh data when the app comes to the foreground.
      startForegroundRefreshListener();

      // ✅ FIX: Use safe customer info to prevent initial stale cache flicker
      try {
        const customerInfo = await safeGetCustomerInfo();
        updateTierFromInfo(customerInfo);
      } catch (error) {
        console.warn('[RevenueCat] Initial safeGetCustomerInfo failed:', error);
      }
      
      resolve(); // SDK is ready
    } catch (error) {
      console.error('[RevenueCat] Configuration failed:', error);
      reject(error); // FIXED: Reject on error instead of resolving
    }
  });
  
  return configurePromise;
}

/**
 * Syncs the RevenueCat identity when the Supabase user logs in or out.
 * WAITS for configure promise to ensure SDK is ready before proceeding.
 * @param newUserID - The new Supabase user ID, or null if logged out.
 */
export async function syncIdentity(newUserID: string | null) {
  // FIXED: Move guard BEFORE await to prevent awaiting null
  if (!configurePromise) {
    console.warn('[RevenueCat] SDK not configured yet, skipping identity sync');
    return;
  }
  
  // ① WAIT for configure to complete before any SDK calls
  await configurePromise;
  
  try {
    const { originalAppUserId } = await Purchases.getCustomerInfo();
    
    // Case 1: Logging out.
    if (!newUserID) {
      if (!originalAppUserId.startsWith('$RCAnonymousID:')) {
        console.log('[RevenueCat] User logged out, resetting to anonymous.');
        await Purchases.logOut();
      }
      return;
    }
    
    // Case 2: Logging in or switching users.
    if (originalAppUserId !== newUserID) {
      console.log(`[RevenueCat] Logging in user: ${newUserID.substring(0, 8)}...`);
      // No need for logout first, logIn handles the identity switch.
      await Purchases.logIn(newUserID);
    }
  } catch (error) {
    console.error('[RevenueCat] Identity sync failed:', error);
  }
}

/**
 * Fetches the available offerings (e.g., "default") from RevenueCat.
 * Waits for SDK to be configured first.
 */
export async function getOfferings(): Promise<PurchasesOfferings> {
  if (!configurePromise) {
    throw new Error('[RevenueCat] SDK not configured yet');
  }
  
  await configurePromise; // Wait for SDK
  console.log('[RevenueCat] Fetching offerings...');
  return await Purchases.getOfferings();
}

/**
 * Purchases a specific package from an offering.
 * Waits for SDK to be configured first.
 * @param packageToPurchase - The RevenueCat package object to purchase.
 */
export async function purchasePackage(packageToPurchase: PurchasesPackage) {
  if (!configurePromise) {
    throw new Error('[RevenueCat] SDK not configured yet');
  }
  
  await configurePromise; // Wait for SDK
  console.log(`[RevenueCat] Purchasing package: ${packageToPurchase.identifier}`);
  
  try {
    // FIXED: Added proper error handling
    return await Purchases.purchasePackage(packageToPurchase);
  } catch (error) {
    console.error(`[RevenueCat] Purchase failed for ${packageToPurchase.identifier}:`, error);
    throw error; // Re-throw for UI to handle
  }
}

/**
 * Manually triggers a refresh of purchases from the App Store/Play Store.
 * Primarily used for a "Restore Purchases" button.
 * Waits for SDK to be configured first.
 */
export async function restorePurchases(): Promise<CustomerInfo> {
  if (!configurePromise) {
    throw new Error('[RevenueCat] SDK not configured yet');
  }
  
  await configurePromise; // Wait for SDK
  console.log('[RevenueCat] Attempting to restore purchases...');
  
  try {
    // FIXED: Added proper error handling
    // The listener will automatically handle the tier update.
    await Purchases.syncPurchases();
    return await Purchases.getCustomerInfo();
  } catch (error) {
    console.error('[RevenueCat] Restore purchases failed:', error);
    throw error; // Re-throw for UI to handle
  }
}

/**
 * Logs out the current user from RevenueCat.
 * Waits for SDK to be configured first.
 */
export async function logOut(): Promise<void> {
  if (!configurePromise) {
    throw new Error('[RevenueCat] SDK not configured yet');
  }
  
  await configurePromise; // Wait for SDK
  console.log('[RevenueCat] Logging out user...');
  try {
    await Purchases.logOut();
    console.log('[RevenueCat] User logged out successfully');
  } catch (error) {
    console.error('[RevenueCat] Error during logout:', error);
    throw error;
  }
}

// 3. HELPER FUNCTIONS

/**
 * ✅ FIX: Enhanced foreground refresh with safe customer info fetching
 * Listens for app state changes to refresh customer info when the app
 * becomes active. Uses safe fetching to prevent stale cache flicker.
 */
function startForegroundRefreshListener() {
  if (appStateListener) {
    appStateListener.remove();
  }
  
  appStateListener = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
    if (nextAppState === 'active') {
      console.log('[RevenueCat] App is active, safely refreshing customer info.');
      safeGetCustomerInfo().catch(error => {
        console.warn('[RevenueCat] Foreground safe refresh failed:', error);
      });
    }
  });
}

/**
 * FIXED: Added cleanup function to prevent memory leaks
 * Stops the foreground refresh listener and cleans up resources.
 * Call this when the app unmounts or during logout.
 */
export function stopForegroundRefreshListener() {
  if (appStateListener) {
    appStateListener.remove();
    appStateListener = null;
    console.log('[RevenueCat] Foreground refresh listener stopped');
  }
}

/**
 * FIXED: Added cleanup function for complete RevenueCat cleanup
 * Cleans up all listeners and resets the configuration state.
 * Use this during app shutdown or when completely resetting the SDK.
 */
export function cleanupRevenueCat() {
  stopForegroundRefreshListener();
  configurePromise = null;
  console.log('[RevenueCat] Complete cleanup performed');
} 