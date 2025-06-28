import { useUserStore } from '@/store/userStore';
import { router } from 'expo-router';
import React, { useCallback, useEffect } from 'react';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';
import RevenueCatUI from 'react-native-purchases-ui';
import { CustomerInfo } from 'react-native-purchases';

export default function PaywallScreen() {
  const { setHasCompletedOnboarding, setSubscriptionTier, supabaseUser, subscriptionTier } = useUserStore();

  // 1. AUTHENTICATION GUARD
  useEffect(() => {
    if (!supabaseUser) {
      console.log('[Paywall] No user found, redirecting to login.');
      router.replace('/(onboarding)/login');
    }
  }, [supabaseUser]);

  // 2. NAVIGATION LOGIC
  const completeOnboardingAndNavigate = useCallback(() => {
    console.log('[Paywall] Completing onboarding and navigating to main app...');
    setHasCompletedOnboarding(true);
    router.replace('/(main)');
  }, [setHasCompletedOnboarding]);

  // *** FIX: This logic is now inside a useEffect hook to prevent the "cannot update..." error. ***
  // It runs safely after the component renders, whenever `subscriptionTier` changes.
  useEffect(() => {
    if (subscriptionTier === 'premium') {
      console.log('[Paywall] useEffect detected user is premium, completing onboarding automatically.');
      completeOnboardingAndNavigate();
    }
  }, [subscriptionTier, completeOnboardingAndNavigate]);

  // 3. EVENT HANDLERS FOR THE PAYWALL COMPONENT
  const handlePurchaseSuccess = ({ customerInfo, storeTransaction }: { customerInfo: CustomerInfo; storeTransaction: any }) => {
    console.log('[Paywall] Purchase success event received. Navigating...');
    // The global listener in revenueCatService will handle the tier update.
    // We just navigate.
    completeOnboardingAndNavigate();
  };

  const handleRestoreSuccess = ({ customerInfo }: { customerInfo: CustomerInfo }) => {
    console.log('[Paywall] Restore success event received. Navigating...');
    // The global listener in revenueCatService will handle the tier update.
    // We just navigate.
    completeOnboardingAndNavigate();
  };

  const handleDismiss = () => {
    console.log('[Paywall] Paywall dismissed by user. Setting tier to free and proceeding.');
    setSubscriptionTier('free');
    completeOnboardingAndNavigate();
  };

  // RENDER LOGIC

  // If the user isn't logged in, show a loader while the redirect happens.
  if (!supabaseUser) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  // If the user is already premium, we now show a loading indicator while the
  // useEffect hook does its work in the background. This prevents the error.
  if (subscriptionTier === 'premium') {
    return (
        <View style={styles.center}>
            <ActivityIndicator size="large" />
            <Text style={styles.loadingText}>Finalizing setup...</Text>
        </View>
    );
  }

  // Render the pre-built RevenueCat Paywall UI
  return (
    <React.Suspense fallback={
        <View style={styles.center}>
            <ActivityIndicator size="large" />
            <Text style={styles.loadingText}>Loading Offers...</Text>
        </View>
    }>
        <RevenueCatUI.Paywall
            onPurchaseCompleted={handlePurchaseSuccess}
            onRestoreCompleted={handleRestoreSuccess}
            onDismiss={handleDismiss}
        />
    </React.Suspense>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFF5F7',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#333',
  },
}); 