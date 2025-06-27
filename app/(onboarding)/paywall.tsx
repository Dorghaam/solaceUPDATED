import { useUserStore } from '@/store/userStore';
import { router } from 'expo-router';
import React, { useCallback, useEffect } from 'react';
import { View, ActivityIndicator, Text } from 'react-native';
import RevenueCatUI from 'react-native-purchases-ui';
import Purchases, { PurchasesEntitlementInfo, CustomerInfo } from 'react-native-purchases';

function PaywallContent() {
  const { setHasCompletedOnboarding, setSubscriptionTier, supabaseUser, subscriptionTier } = useUserStore();

  // Authentication guard - only authenticated users can access paywall
  useEffect(() => {
    if (!supabaseUser) {
      console.log('[Paywall] User not authenticated, redirecting to login...');
      router.replace('/(onboarding)/login');
      return;
    }
  }, [supabaseUser]);

  // Check if user is already premium and complete onboarding immediately
  useEffect(() => {
    if (subscriptionTier === 'premium') {
      console.log('[Paywall] User is already premium, completing onboarding directly...');
      completeOnboardingAndNavigate();
    }
  }, [subscriptionTier]);

  const completeOnboardingAndNavigate = useCallback(() => {
    // Double check authentication before completing onboarding
    if (!supabaseUser) {
      console.log('[Paywall] User not authenticated during onboarding completion, redirecting to login...');
      router.replace('/(onboarding)/login');
      return;
    }
    
    console.log('[Paywall] Completing onboarding and navigating to main app...');
    setHasCompletedOnboarding(true);
    router.replace('/(main)');
  }, [setHasCompletedOnboarding, supabaseUser]);

  const handleSuccess = useCallback(async (customerInfo: CustomerInfo) => {
    console.log('[Paywall] Purchase/Restore successful. Processing entitlements...');

    // ✅ Explicitly check for the 'premium' entitlement from the event.
    const hasPremium = customerInfo.entitlements.active.premium?.isActive || false;

    if (hasPremium) {
      console.log('[Paywall] "premium" entitlement found. Granting premium access.');
      setSubscriptionTier('premium');
    } else {
      console.warn('[Paywall] Purchase success event fired, but no active "premium" entitlement was found. Defaulting to free.');
      setSubscriptionTier('free');
    }
    
    // Sync purchases to ensure everything is up-to-date with the server.
    try {
      await Purchases.syncPurchases();
    } catch (e) {
      console.error('[Paywall] Error syncing purchases after success:', e);
    }

    // Complete the onboarding process and navigate to the main app.
    completeOnboardingAndNavigate();
  }, [setSubscriptionTier, completeOnboardingAndNavigate]);

  const handleDismiss = useCallback(() => {
    // ✅ CORRECT LOGIC: If the paywall is dismissed, the user is NOT premium.
    // No need to check anything. Just set their status to free and proceed.
    console.log('[Paywall] Paywall dismissed by user. Setting tier to free.');
    
    // Set the subscription tier to 'free' in the global state.
    setSubscriptionTier('free');
    
    // Navigate the user into the main app experience.
    completeOnboardingAndNavigate();
  }, [setSubscriptionTier, completeOnboardingAndNavigate]);

  // If user is not authenticated, don't render the paywall
  if (!supabaseUser) {
    return null;
  }

  // If user is already premium, show loading while we complete onboarding
  if (subscriptionTier === 'premium') {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
        <Text style={{ marginTop: 16 }}>Completing setup...</Text>
      </View>
    );
  }

  return (
    <RevenueCatUI.Paywall
      onPurchaseCompleted={({ customerInfo }) => handleSuccess(customerInfo)}
      onRestoreCompleted={({ customerInfo }) => handleSuccess(customerInfo)}
      onDismiss={handleDismiss}
    />
  );
}

export default function PaywallScreen() {
  return (
    <React.Suspense
      fallback={
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" />
          <Text style={{ marginTop: 16 }}>Loading Offers...</Text>
        </View>
      }
    >
      <PaywallContent />
    </React.Suspense>
  );
} 