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
  NativeModules,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { PanGestureHandler, State } from 'react-native-gesture-handler';
import { router } from 'expo-router';
import { theme } from '../constants/theme';
import { signOut } from '../services/authService';
import * as Haptics from 'expo-haptics';
import { useUserStore, breakupInterestCategories } from '@/store/userStore';
import { RemindersScreen } from './RemindersScreen';
import { ProfileScreen } from './ProfileScreen';
import { supabase } from '../services/supabaseClient';

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
  { id: '2', title: 'Create My Quotes', icon: 'create' },
  { id: '3', title: 'General', icon: 'document-text' },
  { id: '4', title: 'My Favorites', icon: 'heart' },
  { id: '5', title: 'My Profile', icon: 'person' },
  { id: '6', title: 'Based on Your Mood', icon: 'happy' },
  { id: '7', title: 'Reminders', icon: 'time' },
  { id: '8', title: 'Widget Settings', icon: 'phone-portrait' },
];

const WEEKDAYS = ['We', 'Th', 'Fr', 'Sa', 'Su'];
const STREAK_DATA = [
  { day: 'We', completed: true, streak: 1 },
  { day: 'Th', completed: true, streak: 2 },
  { day: 'Fr', completed: false, streak: 0 },
  { day: 'Sa', completed: false, streak: 0 },
  { day: 'Su', completed: false, streak: 0 },
];

interface SettingsModalProps {
  visible: boolean;
  onClose: () => void;
  onSettingSelect: (setting: SettingsMenuItem) => void;
}

interface SettingsModalState {
  showReminders: boolean;
  showProfile: boolean;
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
  const [isUpdatingWidget, setIsUpdatingWidget] = useState(false);
  
  // Get data from store
  const { 
    subscriptionTier, 
    widgetSettings, 
    setWidgetSettings, 
    favoriteQuoteIds, 
    userName 
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

  const handleWidgetCategoryChange = async (categoryId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    const selectedCategory = breakupInterestCategories.find(cat => cat.id === categoryId);
    if (selectedCategory?.premium && subscriptionTier === 'free') {
      Alert.alert(
        "Premium Feature",
        `"${selectedCategory.label}" is a premium category. Please upgrade to use this topic on your widget.`
      );
      return;
    }
    
    setWidgetSettings({ category: categoryId as any });
    await updateWidgetWithCategory(categoryId);
  };

  const updateWidgetWithCategory = async (categoryId: string) => {
    if (Platform.OS !== 'ios') {
      Alert.alert("iOS Only", "Widgets are only available on iOS devices.");
      return;
    }

    setIsUpdatingWidget(true);

    try {
      let quotesToSend: string[] = [`Hello ${userName || 'User'}! Open Solace to get inspired.`];

      if (categoryId === 'favorites') {
        // Handle favorites
        if (favoriteQuoteIds.length === 0) {
          quotesToSend = [`Hi ${userName || 'User'}! Add some favorites first to see them in your widget.`];
        } else {
          const { data, error } = await supabase
            .from('quotes')
            .select('text')
            .in('id', favoriteQuoteIds)
            .limit(20);
          
          if (error) throw error;
          if (data && data.length > 0) {
            quotesToSend = data.map(q => q.text);
          }
        }
      } else {
        // Handle category-based quotes
        const categoriesToFetch = categoryId === 'all' 
          ? breakupInterestCategories
              .filter(c => subscriptionTier === 'premium' || !c.premium)
              .map(c => c.id)
          : [categoryId];

        const { data, error } = await supabase
          .from('quotes')
          .select('text')  
          .in('category', categoriesToFetch)
          .limit(50);
        
        if (error) throw error;
        if (data && data.length > 0) {
          // Shuffle the quotes for variety
          const shuffledQuotes = [...data].sort(() => Math.random() - 0.5);
          quotesToSend = shuffledQuotes.map(q => q.text);
        }
      }

      // Update widget with quotes
      const { WidgetUpdateModule } = NativeModules;
      if (WidgetUpdateModule) {
        await WidgetUpdateModule.updateQuotes(quotesToSend);
        if (userName) {
          await WidgetUpdateModule.updateUserName(userName);
        }
        
        const categoryName = categoryId === 'all' ? 'All Categories' : 
                            categoryId === 'favorites' ? 'Favorites' :
                            breakupInterestCategories.find(c => c.id === categoryId)?.label || 'Selected Category';
        
        Alert.alert("Widget Updated!", `Your widget will show ${quotesToSend.length} quotes from "${categoryName}" on rotation.`);
      } else {
        throw new Error("Widget module not found");
      }

    } catch (e: any) {
      console.error('Widget update error:', e);
      Alert.alert("Error Updating Widget", e.message || "Something went wrong");
    } finally {
      setIsUpdatingWidget(false);
    }
  };

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
      handleClose(); // Close settings modal first
      router.push('/(main)/widgetconfig');
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
                  {STREAK_DATA.map((item, index) => (
                    <View key={item.day} style={styles.streakItem}>
                      <View style={styles.streakDay}>
                        {item.completed ? (
                          <View style={styles.flameContainer}>
                            <Text style={styles.flameIcon}>🔥</Text>
                            <Text style={styles.streakNumber}>{item.streak}</Text>
                          </View>
                        ) : item.day === 'We' ? (
                          <View style={[styles.dayCircle, styles.activeDayCircle]}>
                            <Ionicons name="checkmark" size={16} color="white" />
                          </View>
                        ) : (
                          <View style={styles.dayCircle} />
                        )}
                      </View>
                      <Text style={styles.dayLabel}>{item.day}</Text>
                    </View>
                  ))}
                </View>
              </View>

              {/* Widget Category Selection */}
              {Platform.OS === 'ios' && (
                <View style={styles.widgetSection}>
                  <View style={styles.widgetHeader}>
                    <Ionicons name="phone-portrait" size={20} color={theme.colors.text} />
                    <Text style={styles.widgetTitle}>Widget Category</Text>
                  </View>
                  <Text style={styles.widgetSubtitle}>Choose what quotes appear in your widget</Text>
                  
                  <View style={styles.widgetOptions}>
                    <Pressable
                      style={[
                        styles.widgetOption,
                        widgetSettings?.category === 'all' && styles.selectedWidgetOption,
                        isUpdatingWidget && styles.disabledOption
                      ]}
                      onPress={() => !isUpdatingWidget && handleWidgetCategoryChange('all')}
                      disabled={isUpdatingWidget}
                    >
                      <Text style={[
                        styles.widgetOptionText,
                        widgetSettings?.category === 'all' && styles.selectedWidgetOptionText
                      ]}>
                        🌟 All Categories
                      </Text>
                      {widgetSettings?.category === 'all' && (
                        <Ionicons name="checkmark-circle" size={16} color={theme.colors.primary} />
                      )}
                    </Pressable>

                    <Pressable
                      style={[
                        styles.widgetOption,
                        widgetSettings?.category === 'favorites' && styles.selectedWidgetOption,
                        isUpdatingWidget && styles.disabledOption
                      ]}
                      onPress={() => !isUpdatingWidget && handleWidgetCategoryChange('favorites')}
                      disabled={isUpdatingWidget}
                    >
                      <Text style={[
                        styles.widgetOptionText,
                        widgetSettings?.category === 'favorites' && styles.selectedWidgetOptionText
                      ]}>
                        ❤️ My Favorites ({favoriteQuoteIds.length})
                      </Text>
                      {widgetSettings?.category === 'favorites' && (
                        <Ionicons name="checkmark-circle" size={16} color={theme.colors.primary} />
                      )}
                    </Pressable>

                    {breakupInterestCategories.slice(0, 3).map(category => (
                      <Pressable
                        key={category.id}
                        style={[
                          styles.widgetOption,
                          widgetSettings?.category === category.id && styles.selectedWidgetOption,
                          isUpdatingWidget && styles.disabledOption,
                          category.premium && subscriptionTier !== 'premium' && styles.premiumOption
                        ]}
                        onPress={() => !isUpdatingWidget && handleWidgetCategoryChange(category.id)}
                        disabled={isUpdatingWidget}
                      >
                        <View style={styles.widgetOptionContent}>
                          <Text style={[
                            styles.widgetOptionText,
                            widgetSettings?.category === category.id && styles.selectedWidgetOptionText,
                            category.premium && subscriptionTier !== 'premium' && styles.premiumOptionText
                          ]}>
                            {category.label}
                          </Text>
                          {category.premium && subscriptionTier !== 'premium' && (
                            <Ionicons name="diamond" size={12} color={theme.colors.categoryColors.purple} />
                          )}
                        </View>
                        {widgetSettings?.category === category.id && (
                          <Ionicons name="checkmark-circle" size={16} color={theme.colors.primary} />
                        )}
                      </Pressable>
                    ))}

                    <Pressable
                      style={[styles.widgetOption, styles.moreOptionsButton]}
                      onPress={() => {
                        handleClose();
                        router.push('/(main)/widgetconfig');
                      }}
                    >
                      <Text style={styles.moreOptionsText}>More Categories...</Text>
                      <Ionicons name="chevron-forward" size={16} color={theme.colors.textSecondary} />
                    </Pressable>
                  </View>

                  {isUpdatingWidget && (
                    <View style={styles.updatingContainer}>
                      <Text style={styles.updatingText}>Updating widget...</Text>
                    </View>
                  )}
                </View>
              )}

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
  flameContainer: {
    alignItems: 'center',
    position: 'relative',
  },
  flameIcon: {
    fontSize: 24,
  },
  streakNumber: {
    position: 'absolute',
    bottom: -2,
    fontSize: 10,
    fontFamily: theme.typography.fontFamily.semiBold,
    color: theme.colors.text,
    backgroundColor: 'white',
    borderRadius: 8,
    paddingHorizontal: 4,
    paddingVertical: 1,
    minWidth: 16,
    textAlign: 'center',
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
  // Widget styles
  widgetSection: {
    marginBottom: theme.spacing.l,
  },
  widgetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.s,
    marginBottom: theme.spacing.s,
  },
  widgetTitle: {
    fontSize: theme.typography.fontSizes.m,
    fontFamily: theme.typography.fontFamily.semiBold,
    color: theme.colors.text,
  },
  widgetSubtitle: {
    fontSize: theme.typography.fontSizes.s,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.m,
  },
  widgetOptions: {
    gap: theme.spacing.s,
  },
  widgetOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: theme.radii.s,
    paddingHorizontal: theme.spacing.m,
    paddingVertical: theme.spacing.s,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  selectedWidgetOption: {
    backgroundColor: 'rgba(255, 105, 180, 0.1)',
    borderColor: theme.colors.primary,
  },
  disabledOption: {
    opacity: 0.5,
  },
  premiumOption: {
    backgroundColor: 'rgba(200, 165, 225, 0.2)',
  },
  widgetOptionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.s,
  },
  widgetOptionText: {
    fontSize: theme.typography.fontSizes.s,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.text,
  },
  selectedWidgetOptionText: {
    fontFamily: theme.typography.fontFamily.semiBold,
    color: theme.colors.primary,
  },
  premiumOptionText: {
    color: theme.colors.categoryColors.purple,
  },
  moreOptionsButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    marginTop: theme.spacing.s,
  },
  moreOptionsText: {
    fontSize: theme.typography.fontSizes.s,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.textSecondary,
  },
  updatingContainer: {
    alignItems: 'center',
    marginTop: theme.spacing.s,
  },
  updatingText: {
    fontSize: theme.typography.fontSizes.s,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.textSecondary,
  },
}); 