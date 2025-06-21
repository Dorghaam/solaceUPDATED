import { useUserStore } from '@/store/userStore';
import { router } from 'expo-router';
import React, { useCallback } from 'react';
import { View, ActivityIndicator, Text } from 'react-native';
import RevenueCatUI from 'react-native-purchases-ui';
import Purchases, { PurchasesEntitlementInfo, CustomerInfo } from 'react-native-purchases';

function PaywallContent() {
  const setHasCompletedOnboarding = useUserStore((s) => s.setHasCompletedOnboarding);
  const setSubscriptionTier = useUserStore((s) => s.setSubscriptionTier);

  const completeOnboardingAndNavigate = useCallback(() => {
    console.log('[Paywall] Completing onboarding and navigating to main app...');
    setHasCompletedOnboarding(true);
    router.replace('/(main)');
  }, [setHasCompletedOnboarding]);

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