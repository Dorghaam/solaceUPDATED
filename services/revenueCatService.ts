import { SubscriptionTier, useUserStore } from '@/store/userStore';
import Constants from 'expo-constants';
import { AppState, AppStateStatus } from 'react-native';
import Purchases, { CustomerInfo, PurchasesError, PurchasesOfferings, PurchasesPackage } from 'react-native-purchases';

// 1. CONFIGURE CONSTANTS AND LISTENERS
const RC_API_KEY = Constants.expoConfig?.extra?.RC_API_KEY as string;
let appStateListener: { remove: () => void } | null = null;
let configurePromise: Promise<void> | null = null;

// Quality gate - exit early if SDK not configured
if (!RC_API_KEY) {
  throw new Error('Missing EXPO_PUBLIC_RC_API_KEY - check your .env file');
}

/**
 * Updates the global user store with the latest subscription tier.
 * This is the SINGLE SOURCE OF TRUTH for subscription status in the app.
 * @param info - The CustomerInfo object from RevenueCat.
 */
function updateTierFromInfo(info: CustomerInfo) {
  const tier: SubscriptionTier = info.entitlements.active['premium']?.isActive ? 'premium' : 'free';
  
  // Update Zustand store
  const currentTier = useUserStore.getState().subscriptionTier;
  if (currentTier !== tier) {
    console.log(`[RevenueCat] Tier updated via listener: ${currentTier} -> ${tier}`);
    useUserStore.getState().setSubscriptionTier(tier);
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
  
  configurePromise = new Promise<void>(async (resolve) => {
    try {
      // Configure with appUserID from the start to prevent anonymous user flicker.
      await Purchases.configure({ apiKey: RC_API_KEY, appUserID: appUserID || undefined });
      console.log(`[RevenueCat] ✅ SDK configured for user: ${appUserID ? appUserID.substring(0, 8) + '...' : 'Anonymous'}`);
      
      // Add the listener that will react to all subscription changes.
      Purchases.addCustomerInfoUpdateListener(updateTierFromInfo);
      
      // Add a listener to refresh data when the app comes to the foreground.
      startForegroundRefreshListener();

      // Perform an initial check to populate the tier from cached data.
      try {
        const customerInfo = await Purchases.getCustomerInfo();
        updateTierFromInfo(customerInfo);
      } catch (error) {
        console.warn('[RevenueCat] Initial getCustomerInfo failed:', error);
      }
      
      resolve(); // SDK is ready
    } catch (error) {
      console.error('[RevenueCat] Configuration failed:', error);
      resolve(); // Still resolve to prevent hanging
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
  // ① WAIT for configure to complete before any SDK calls
  await configurePromise;
  
  if (!configurePromise) {
    console.warn('[RevenueCat] SDK not configured yet, skipping identity sync');
    return;
  }
  
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
    await configurePromise; // Wait for SDK
    console.log(`[RevenueCat] Purchasing package: ${packageToPurchase.identifier}`);
    return await Purchases.purchasePackage(packageToPurchase);
}

/**
 * Manually triggers a refresh of purchases from the App Store/Play Store.
 * Primarily used for a "Restore Purchases" button.
 * Waits for SDK to be configured first.
 */
export async function restorePurchases(): Promise<CustomerInfo> {
  await configurePromise; // Wait for SDK
  console.log('[RevenueCat] Attempting to restore purchases...');
  // The listener will automatically handle the tier update.
  await Purchases.syncPurchases();
  return await Purchases.getCustomerInfo();
}

// 3. HELPER FUNCTIONS

/**
 * Listens for app state changes to refresh customer info when the app
 * becomes active. RevenueCat's SDK automatically caches this, so it's a cheap call.
 */
function startForegroundRefreshListener() {
  if (appStateListener) {
    appStateListener.remove();
  }
  
  appStateListener = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
    if (nextAppState === 'active') {
      console.log('[RevenueCat] App is active, refreshing customer info.');
      Purchases.getCustomerInfo().catch(error => {
        console.warn('[RevenueCat] Foreground refresh failed:', error);
      });
    }
  });
} 