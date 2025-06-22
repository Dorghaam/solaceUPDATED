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
    console.log('[Paywall] Purchase/Restore success:', customerInfo.entitlements.active);
    const hasPremium = Object.values(customerInfo.entitlements.active).some((e: PurchasesEntitlementInfo) => e.isActive);
    setSubscriptionTier(hasPremium ? 'premium' : 'free');
    completeOnboardingAndNavigate();
  }, [setSubscriptionTier, completeOnboardingAndNavigate]);

  const handleDismiss = useCallback(async () => {
    console.log('[Paywall] Paywall dismissed. Checking current subscription status...');
    
    try {
      // Get fresh customer info to check current subscription status
      const customerInfo = await Purchases.getCustomerInfo();
      const hasPremium = Object.values(customerInfo.entitlements.active).some((e: PurchasesEntitlementInfo) => e.isActive);
      
      if (hasPremium) {
        console.log('[Paywall] User is premium despite dismissing paywall. Completing onboarding as premium.');
        setSubscriptionTier('premium');
      } else {
        console.log('[Paywall] User dismissed paywall and has no active premium subscription. Completing onboarding as free user.');
        setSubscriptionTier('free');
      }
    } catch (error) {
      console.warn('[Paywall] Failed to check subscription status on dismiss, defaulting to current tier:', subscriptionTier);
      // If we can't check RevenueCat, keep current tier unless it's unknown
      if (subscriptionTier === 'unknown') {
        setSubscriptionTier('free');
      }
    }
    
    completeOnboardingAndNavigate();
  }, [setSubscriptionTier, completeOnboardingAndNavigate, subscriptionTier]);

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