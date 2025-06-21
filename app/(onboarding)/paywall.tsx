import { useUserStore } from '@/store/userStore';
import { router } from 'expo-router';
import React, { useCallback, useEffect } from 'react';
import { View, ActivityIndicator, Text } from 'react-native';
import RevenueCatUI from 'react-native-purchases-ui';
import Purchases, { PurchasesEntitlementInfo, CustomerInfo } from 'react-native-purchases';

function PaywallContent() {
  const { setHasCompletedOnboarding, setSubscriptionTier, supabaseUser } = useUserStore();

  // Authentication guard - only authenticated users can access paywall
  useEffect(() => {
    if (!supabaseUser) {
      console.log('[Paywall] User not authenticated, redirecting to login...');
      router.replace('/(onboarding)/login');
      return;
    }
  }, [supabaseUser]);

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

  const handleDismiss = useCallback(() => {
    console.log('[Paywall] Paywall dismissed. Completing onboarding as a free user.');
    setSubscriptionTier('free');
    completeOnboardingAndNavigate();
  }, [setSubscriptionTier, completeOnboardingAndNavigate]);

  // If user is not authenticated, don't render the paywall
  if (!supabaseUser) {
    return null;
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