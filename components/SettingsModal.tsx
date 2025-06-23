import React, { useRef, useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Pressable,
  Dimensions,
  Animated,
  ScrollView,
  Alert,
  Linking,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { PanGestureHandler, State } from 'react-native-gesture-handler';
import { router } from 'expo-router';
import { theme } from '../constants/theme';
import { signOut } from '../services/authService';
import * as Haptics from 'expo-haptics';
import { useUserStore } from '@/store/userStore';
import { RemindersScreen } from './RemindersScreen';
import { ProfileScreen } from './ProfileScreen';
import { WidgetSettingsScreen } from './WidgetSettingsScreen';
import { FavoritesScreen } from './FavoritesScreen';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface SettingsMenuItem {
  id: string;
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  backgroundColor?: string;
  isPremium?: boolean;
}

// Function to get settings items based on subscription tier
const getSettingsItems = (subscriptionTier: string): SettingsMenuItem[] => [
  { 
    id: '1', 
    title: subscriptionTier === 'premium' ? 'Manage Subscription' : 'Upgrade to Premium', 
    icon: 'diamond',
    backgroundColor: theme.colors.categoryColors.purple,
    isPremium: true 
  },
  { id: '4', title: 'My Favorites', icon: 'heart' },
  { id: '5', title: 'My Profile', icon: 'person' },
  { id: '7', title: 'Reminders', icon: 'time' },
  { id: '8', title: 'Widget Settings', icon: 'phone-portrait' },
];

const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

// Helper function to get the last 7 days
const getLastSevenDays = () => {
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    days.push({
      date: date.toISOString().split('T')[0],
      dayName: WEEKDAYS[date.getDay()],
      dayShort: WEEKDAYS[date.getDay()]
    });
  }
  return days;
};

interface SettingsModalProps {
  visible: boolean;
  onClose: () => void;
  onSettingSelect: (setting: SettingsMenuItem) => void;
}

interface SettingsModalState {
  showReminders: boolean;
  showProfile: boolean;
  showWidgetSettings: boolean;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  visible,
  onClose,
  onSettingSelect,
}) => {
  const slideAnim = useRef(new Animated.Value(screenHeight)).current;
  const backgroundOpacity = useRef(new Animated.Value(0)).current;
  const panY = useRef(new Animated.Value(0)).current;
  
  const [showReminders, setShowReminders] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showWidgetSettings, setShowWidgetSettings] = useState(false);
  const [showFavorites, setShowFavorites] = useState(false);
  
  // Get data from store
  const { 
    subscriptionTier,
    userName,
    streakData
  } = useUserStore();

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

  const handleSubscriptionManagement = async () => {
    if (subscriptionTier === 'premium') {
      // Open Apple subscription management page
      const url = Platform.OS === 'ios' 
        ? 'https://apps.apple.com/account/subscriptions'
        : 'https://play.google.com/store/account/subscriptions';
      
      try {
        const supported = await Linking.canOpenURL(url);
        if (supported) {
          await Linking.openURL(url);
        } else {
          Alert.alert(
            'Cannot Open Settings',
            Platform.OS === 'ios' 
              ? 'Go to Settings > Apple ID > Subscriptions to manage your subscription.'
              : 'Go to Google Play Store > Menu > Subscriptions to manage your subscription.'
          );
        }
      } catch (error) {
        console.error('Error opening subscription management:', error);
        Alert.alert('Error', 'Could not open subscription management page.');
      }
    } else {
      // Navigate to paywall for free users (same as diamond button)
      handleClose(); // Close settings modal first
      router.push('/(onboarding)/paywall');
    }
  };

  const handleSettingPress = (setting: SettingsMenuItem) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    if (setting.title === 'Reminders') {
      setShowReminders(true);
    } else if (setting.title === 'My Profile') {
      setShowProfile(true);
    } else if (setting.title === 'Widget Settings') {
      setShowWidgetSettings(true);
    } else if (setting.title === 'My Favorites') {
      setShowFavorites(true);
    } else if (setting.id === '1') { // Subscription management item
      handleSubscriptionManagement();
    } else {
      onSettingSelect(setting);
    }
  };

  const handleClose = () => {
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
  };

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

  if (!visible) {
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
              <Pressable style={styles.doneButton} onPress={handleClose}>
                <Text style={styles.doneText}>Done</Text>
              </Pressable>
              <View style={styles.titleContainer}>
                <Text style={styles.headerTitle}>Profile</Text>
              </View>
            </View>

            {/* Content */}
            <ScrollView 
              style={styles.content}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.scrollContent}
            >
              {/* Streak Section */}
              <View style={styles.streakSection}>
                <View style={styles.streakContainer}>
                  {getLastSevenDays().map((day, index) => {
                    const isActive = streakData.dailyActivity[day.date] || false;
                    const isToday = day.date === new Date().toISOString().split('T')[0];
                    
                    return (
                      <View key={day.date} style={styles.streakItem}>
                        <View style={styles.streakDay}>
                          {isActive ? (
                            <View style={styles.heartContainer}>
                              <Ionicons name="heart" size={28} color="#FF69B4" />
                              <View style={styles.checkmarkContainer}>
                                <Ionicons name="checkmark" size={14} color="white" />
                              </View>
                            </View>
                          ) : (
                            <View style={styles.heartContainer}>
                              <Ionicons name="heart-outline" size={28} color="#E0E0E0" />
                            </View>
                          )}
                        </View>
                        <Text style={styles.dayLabel}>{day.dayShort}</Text>
                      </View>
                    );
                  })}
                </View>
                <View style={styles.streakInfo}>
                  <Text style={styles.streakText}>
                    {streakData.currentStreak} day{streakData.currentStreak !== 1 ? 's' : ''} streak!
                  </Text>
                </View>
              </View>

              {/* Settings Menu Items */}
              <View style={styles.menuSection}>
                {getSettingsItems(subscriptionTier || 'free').map((item) => (
                  <Pressable
                    key={item.id}
                    style={({ pressed }) => [
                      styles.menuItem,
                      item.backgroundColor && { backgroundColor: item.backgroundColor },
                      item.id === '1' && styles.premiumSubscriptionButton, // Special styling for subscription button
                      { opacity: pressed ? 0.8 : 1 },
                      { transform: [{ scale: pressed ? 0.98 : 1 }] }
                    ]}
                    onPress={() => handleSettingPress(item)}
                  >
                    <View style={styles.menuItemLeft}>
                      <View style={[
                        styles.iconContainer,
                        item.backgroundColor && styles.premiumIconContainer
                      ]}>
                        <Ionicons 
                          name={item.icon} 
                          size={20} 
                          color={item.isPremium ? "#fff" : theme.colors.text} 
                        />
                      </View>
                      <Text style={[
                        styles.menuItemText,
                        item.isPremium && styles.premiumText
                      ]}>
                        {item.title}
                      </Text>
                    </View>
                    <Ionicons 
                      name="chevron-forward" 
                      size={20} 
                      color={item.isPremium ? "#fff" : theme.colors.textSecondary} 
                    />
                  </Pressable>
                ))}
              </View>
            </ScrollView>
          </LinearGradient>
        </Animated.View>
      </PanGestureHandler>
      
      {/* Reminders Screen */}
      <RemindersScreen
        visible={showReminders}
        onClose={() => setShowReminders(false)}
      />
      
      {/* Profile Screen */}
      <ProfileScreen
        visible={showProfile}
        onClose={() => setShowProfile(false)}
      />
      
      {/* Widget Settings Screen */}
      <WidgetSettingsScreen
        visible={showWidgetSettings}
        onClose={() => setShowWidgetSettings(false)}
      />
      
      {/* Favorites Screen */}
      <FavoritesScreen
        visible={showFavorites}
        onClose={() => setShowFavorites(false)}
      />
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
    backgroundColor: '#000',
  },
  backgroundTouchable: {
    flex: 1,
  },
  modal: {
    position: 'absolute',
    top: 50, // Same height from top as categories modal
    left: 0,
    right: 0,
    bottom: 0,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
  },
  modalContent: {
    flex: 1,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  dragHandle: {
    width: 40,
    height: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.m,
    paddingTop: 20,
    paddingBottom: theme.spacing.m,
    position: 'relative',
  },
  doneButton: {
    position: 'absolute',
    top: -10,
    left: 0,
    paddingHorizontal: 8,
    paddingVertical: 8,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  doneText: {
    fontSize: theme.typography.fontSizes.m,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.text,
  },
  titleContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: theme.typography.fontSizes.l,
    fontFamily: theme.typography.fontFamily.semiBold,
    color: theme.colors.text,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: theme.spacing.m,
    paddingBottom: theme.spacing.xl,
  },
  streakSection: {
    marginBottom: theme.spacing.l,
  },
  streakContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    borderRadius: theme.radii.m,
    paddingVertical: theme.spacing.m,
    paddingHorizontal: theme.spacing.s,
  },
  streakItem: {
    alignItems: 'center',
    gap: theme.spacing.s,
  },
  streakDay: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  heartContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 32,
    height: 32,
    position: 'relative',
  },
  checkmarkContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    width: 32,
    height: 32,
  },
  streakInfo: {
    alignItems: 'center',
    marginTop: theme.spacing.s,
  },
  streakText: {
    fontSize: theme.typography.fontSizes.m,
    fontFamily: theme.typography.fontFamily.semiBold,
    color: theme.colors.text,
  },
  dayCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderWidth: 2,
    borderColor: '#E0E0E0',
  },
  activeDayCircle: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayLabel: {
    fontSize: theme.typography.fontSizes.s,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.text,
  },
  menuSection: {
    gap: theme.spacing.s,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: theme.radii.m,
    paddingHorizontal: theme.spacing.m,
    paddingVertical: theme.spacing.m,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.m,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  premiumIconContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  menuItemText: {
    fontSize: theme.typography.fontSizes.m,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.text,
  },
  premiumText: {
    color: '#fff',
    fontFamily: theme.typography.fontFamily.semiBold,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  premiumSubscriptionButton: {
    backgroundColor: '#C8A5E1',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
}); 