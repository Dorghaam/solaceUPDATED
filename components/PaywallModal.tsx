import React, { useRef, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Pressable,
  Dimensions,
  Animated,
  ActivityIndicator,
} from 'react-native';
import { PanGestureHandler, State } from 'react-native-gesture-handler';
import { LinearGradient } from 'expo-linear-gradient';
import RevenueCatUI from 'react-native-purchases-ui';
import Purchases, { PurchasesEntitlementInfo, CustomerInfo } from 'react-native-purchases';
import { theme } from '../constants/theme';
import { useUserStore } from '../store/userStore';
import * as Haptics from 'expo-haptics';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface PaywallModalProps {
  visible: boolean;
  onClose: () => void;
  onPurchaseSuccess?: () => void;
}

export const PaywallModal: React.FC<PaywallModalProps> = ({
  visible,
  onClose,
  onPurchaseSuccess,
}) => {
  const slideAnim = useRef(new Animated.Value(screenHeight)).current;
  const backgroundOpacity = useRef(new Animated.Value(0)).current;
  const panY = useRef(new Animated.Value(0)).current;
  const { setSubscriptionTier, supabaseUser } = useUserStore();

  useEffect(() => {
    if (visible) {
      // Reset pan gesture and slide up animation
      panY.setValue(0);
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(backgroundOpacity, {
          toValue: 0.5,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // Slide down animation
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: screenHeight,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(backgroundOpacity, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  const handleSuccess = useCallback(async (customerInfo: CustomerInfo) => {
    console.log('[PaywallModal] Purchase/Restore success:', customerInfo.entitlements.active);
    const hasPremium = Object.values(customerInfo.entitlements.active).some((e: PurchasesEntitlementInfo) => e.isActive);
    setSubscriptionTier(hasPremium ? 'premium' : 'free');
    
    // Close modal first
    handleClose();
    
    // Call success callback if provided
    if (onPurchaseSuccess) {
      onPurchaseSuccess();
    }
  }, [setSubscriptionTier, onPurchaseSuccess]);

  const handleClose = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // Trigger slide down animation, then call onClose
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: screenHeight,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(backgroundOpacity, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onClose();
    });
  }, [onClose]);

  const handleDismiss = useCallback(async () => {
    console.log('[PaywallModal] Paywall dismissed. Checking current subscription status...');
    
    try {
      // ✅ SYNC PURCHASES first to handle "already subscribed" scenarios
      console.log('[PaywallModal] Syncing purchases on dismiss...');
      await Purchases.syncPurchases();
      
      // Get fresh customer info to check current subscription status
      const customerInfo = await Purchases.getCustomerInfo();
      const hasPremium = Object.values(customerInfo.entitlements.active).some((e: PurchasesEntitlementInfo) => e.isActive);
      
      if (hasPremium) {
        console.log('[PaywallModal] User is premium despite dismissing paywall.');
        setSubscriptionTier('premium');
      } else {
        console.log('[PaywallModal] User dismissed paywall and has no active premium subscription.');
        setSubscriptionTier('free');
      }
    } catch (error) {
      console.warn('[PaywallModal] Failed to check subscription status on dismiss:', error);
      // If we can't check RevenueCat, keep current tier unless it's unknown
      const currentTier = useUserStore.getState().subscriptionTier;
      if (currentTier === 'unknown') {
        setSubscriptionTier('free');
      }
    }
    
    handleClose();
  }, [setSubscriptionTier, handleClose]);

  const handlePanGestureEvent = Animated.event(
    [{ nativeEvent: { translationY: panY } }],
    { useNativeDriver: true }
  );

  const handlePanStateChange = (event: any) => {
    if (event.nativeEvent.state === State.END) {
      const { translationY, velocityY } = event.nativeEvent;
      
      // If swiped down significantly or with enough velocity, close the modal
      if (translationY > 100 || velocityY > 800) {
        handleClose();
      } else {
        // Return to original position
        Animated.spring(panY, {
          toValue: 0,
          useNativeDriver: true,
          tension: 100,
          friction: 8,
        }).start();
      }
    }
  };

  // If user is not authenticated, don't render the paywall
  if (!visible || !supabaseUser) {
    return null;
  }

  return (
    <View style={styles.overlay}>
      {/* Background overlay */}
      <Animated.View 
        style={[
          styles.background,
          { opacity: backgroundOpacity }
        ]}
      >
        <Pressable style={styles.backgroundTouchable} onPress={handleClose} />
      </Animated.View>

      {/* Modal content */}
      <PanGestureHandler
        onGestureEvent={handlePanGestureEvent}
        onHandlerStateChange={handlePanStateChange}
      >
        <Animated.View
          style={[
            styles.modal,
            { 
              transform: [
                { translateY: slideAnim },
                { translateY: panY }
              ] 
            }
          ]}
        >
          <LinearGradient
            colors={[theme.colors.lightPink.lightest, theme.colors.lightPink.light]}
            style={styles.modalContent}
          >
            {/* Drag handle */}
            <View style={styles.dragHandle} />
            
            {/* Header */}
            <View style={styles.header}>
              <Pressable style={styles.closeButton} onPress={handleClose}>
                <Text style={styles.closeText}>Close</Text>
              </Pressable>
              <View style={styles.titleContainer}>
                <Text style={styles.headerTitle}>Upgrade to Premium</Text>
              </View>
            </View>

            {/* RevenueCat Paywall Content */}
            <View style={styles.paywallContainer}>
              <RevenueCatUI.Paywall
                onPurchaseCompleted={({ customerInfo }) => handleSuccess(customerInfo)}
                onRestoreCompleted={({ customerInfo }) => handleSuccess(customerInfo)}
                onDismiss={handleDismiss}
              />
            </View>
          </LinearGradient>
        </Animated.View>
      </PanGestureHandler>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
  },
  background: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'black',
  },
  backgroundTouchable: {
    flex: 1,
  },
  modal: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: screenHeight * 0.9,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
  },
  modalContent: {
    flex: 1,
    paddingTop: 12,
  },
  dragHandle: {
    width: 40,
    height: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  closeButton: {
    padding: 8,
  },
  closeText: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    fontFamily: theme.typography.fontFamily.regular,
  },
  titleContainer: {
    flex: 1,
    alignItems: 'center',
    marginRight: 40, // Balance the close button
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: theme.typography.fontFamily.semiBold,
    color: theme.colors.text,
  },
  paywallContainer: {
    flex: 1,
    backgroundColor: 'transparent',
  },
}); 