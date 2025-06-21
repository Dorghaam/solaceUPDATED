import { useUserStore } from '@/store/userStore';
import { Alert } from 'react-native';

/**
 * Testing utility service for simulating different subscription states
 * This should ONLY be used in development/testing environments
 */
export class TestingService {
  
  /**
   * Simulate premium subscription
   */
  static simulatePremium() {
    const { setSubscriptionTier } = useUserStore.getState();
    setSubscriptionTier('premium');
    console.log('🧪 TESTING: Simulated premium subscription');
    Alert.alert('Testing Mode', 'Simulated Premium Subscription Activated! 🎉\n\nAll categories are now unlocked.');
  }

  /**
   * Simulate free subscription
   */
  static simulateFree() {
    const { setSubscriptionTier } = useUserStore.getState();
    setSubscriptionTier('free');
    console.log('🧪 TESTING: Simulated free subscription');
    Alert.alert('Testing Mode', 'Simulated Free Subscription Activated! 🔒\n\nOnly free categories are accessible.');
  }

  /**
   * Show testing options alert
   */
  static showTestingOptions() {
    Alert.alert(
      '🧪 Testing Mode',
      'Choose a subscription state to simulate:',
      [
        {
          text: '🔒 Free User',
          onPress: () => this.simulateFree()
        },
        {
          text: '🎉 Premium User',
          onPress: () => this.simulatePremium()
        },
        {
          text: 'Cancel',
          style: 'cancel'
        }
      ]
    );
  }

  /**
   * Show current subscription info
   */
  static showSubscriptionInfo() {
    const { subscriptionTier } = useUserStore.getState();
    const premiumCategoriesCount = 14; // Based on your categories
    const freeCategoriesCount = 2;
    
    Alert.alert(
      'Subscription Info',
      `Current Tier: ${subscriptionTier?.toUpperCase() || 'FREE'}\n\n` +
      `Free Categories: ${freeCategoriesCount}\n` +
      `Premium Categories: ${premiumCategoriesCount}\n` +
      `Total Available: ${subscriptionTier === 'premium' ? premiumCategoriesCount + freeCategoriesCount : freeCategoriesCount}`
    );
  }
}

// Development-only helper to add testing button to settings
export const isDevelopment = __DEV__; 