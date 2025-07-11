import React, { useState, useRef, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Pressable,
  Dimensions,
  Animated,
  ScrollView,
  Alert,
  Switch,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { PanGestureHandler, State } from 'react-native-gesture-handler';
import { theme } from '../constants/theme';
import { useUserStore, breakupInterestCategories, BreakupCategory } from '../store/userStore';
import { scheduleDailyAffirmationReminders, cancelAllScheduledAffirmationReminders, getPushTokenAndPermissionsAsync } from '../services/notificationService';
import { TimeRangeScreen } from './TimeRangeScreen';
import * as Haptics from 'expo-haptics';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface RemindersScreenProps {
  visible: boolean;
  onClose: () => void;
}

// Updated frequency options to go from 1 to 10
const FREQUENCY_OPTIONS = Array.from({ length: 10 }, (_, i) => ({
  id: `${i + 1}x`,
  label: `${i + 1}x`,
  value: i + 1,
}));

export const RemindersScreen: React.FC<RemindersScreenProps> = ({
  visible,
  onClose,
}) => {
  const slideAnim = useRef(new Animated.Value(screenHeight)).current;
  const backgroundOpacity = useRef(new Animated.Value(0)).current;
  const panY = useRef(new Animated.Value(0)).current;

  const { subscriptionTier, notificationSettings, setNotificationSettings } = useUserStore();
  
  // State for all reminder settings
  const [notificationsEnabled, setNotificationsEnabled] = useState(notificationSettings?.enabled || false);
  const [selectedFrequency, setSelectedFrequency] = useState(() => {
    // Parse frequency from store (e.g., '8x' -> 8, '3x' -> 3)
    const storedFrequency = notificationSettings?.frequency;
    if (storedFrequency) {
      const numericFreq = parseInt(storedFrequency.replace('x', ''), 10);
      return !isNaN(numericFreq) && numericFreq >= 1 && numericFreq <= 10 ? numericFreq : 3;
    }
    return 3; // Default to 3x
  });
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [showCategoriesList, setShowCategoriesList] = useState(false);
  const [showTimeRangeModal, setShowTimeRangeModal] = useState(false);
  const [isSchedulingNotifications, setIsSchedulingNotifications] = useState(false);
  
  // Animation refs for categories list
  const categoriesSlideAnim = useRef(new Animated.Value(screenHeight)).current;
  const categoriesBackgroundOpacity = useRef(new Animated.Value(0)).current;

  // Sync state with store values when they change
  useEffect(() => {
    if (notificationSettings) {
      setNotificationsEnabled(notificationSettings.enabled);
      
      // Parse and update frequency from store
      const storedFrequency = notificationSettings.frequency;
      if (storedFrequency) {
        const numericFreq = parseInt(storedFrequency.replace('x', ''), 10);
        if (!isNaN(numericFreq) && numericFreq >= 1 && numericFreq <= 10) {
          setSelectedFrequency(numericFreq);
        }
      }
      
      // Load selected categories from store
      if (notificationSettings.selectedCategories) {
        setSelectedCategories(notificationSettings.selectedCategories);
      }
    }
  }, [notificationSettings]);

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
      
      // Also hide categories list if main modal is closing
      if (showCategoriesList) {
        handleCloseCategoriesList();
      }
    }
  }, [visible]);



  const handleClose = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
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
      
      if (translationY > 100 || velocityY > 800) {
        handleClose();
      } else {
        Animated.spring(panY, {
          toValue: 0,
          useNativeDriver: true,
          tension: 100,
          friction: 8,
        }).start();
      }
    }
  };

  const handleFrequencyChange = (direction: 'increase' | 'decrease') => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    if (direction === 'increase' && selectedFrequency < 10) {
      setSelectedFrequency(selectedFrequency + 1);
    } else if (direction === 'decrease' && selectedFrequency > 1) {
      setSelectedFrequency(selectedFrequency - 1);
    }
  };

  const handleCategoriesPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // Start animation from off-screen position
    categoriesSlideAnim.setValue(screenHeight);
    setShowCategoriesList(true);
    
    // Animate in
    setTimeout(() => {
      Animated.timing(categoriesSlideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }, 50);
  };

  const handleCloseCategoriesList = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // Animate out
    Animated.timing(categoriesSlideAnim, {
      toValue: screenHeight,
      duration: 250,
      useNativeDriver: true,
    }).start(() => {
      setShowCategoriesList(false);
    });
  };

  const handleCategoryToggle = (categoryId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const category = breakupInterestCategories.find(cat => cat.id === categoryId);
    
    if (category?.premium && subscriptionTier !== 'premium') {
      Alert.alert(
        'Premium Category',
        'This category is available for premium subscribers. Upgrade to unlock all categories!',
        [{ text: 'OK' }]
      );
      return;
    }

    setSelectedCategories(prev => {
      if (prev.includes(categoryId)) {
        return prev.filter(id => id !== categoryId);
      } else {
        return [...prev, categoryId];
      }
    });
  };

  const generateCustomNotificationTimes = (frequency: number) => {
    const times: { hour: number; minute: number }[] = [];
    
    // Use custom time range if available and user is premium, otherwise use defaults
    const customTimeRange = notificationSettings?.customTimeRange;
    const useCustomRange = subscriptionTier === 'premium' && customTimeRange;
    
    const startHour = useCustomRange ? customTimeRange.startHour : 9;
    const startMinute = useCustomRange ? customTimeRange.startMinute : 0;
    const endHour = useCustomRange ? customTimeRange.endHour : 22;
    const endMinute = useCustomRange ? customTimeRange.endMinute : 0;
    
    // Calculate the time range in minutes
    const startTimeInMinutes = startHour * 60 + startMinute;
    const endTimeInMinutes = endHour * 60 + endMinute;
    const totalMinutes = endTimeInMinutes - startTimeInMinutes;
    
    // Calculate interval between notifications
    const interval = Math.floor(totalMinutes / frequency);
    
    for (let i = 0; i < frequency; i++) {
      const timeInMinutes = startTimeInMinutes + (i * interval);
      const hour = Math.floor(timeInMinutes / 60);
      const minute = timeInMinutes % 60;
      
      times.push({ hour, minute });
    }
    
    return times;
  };

  const handleTimeRangeSave = (timeRange: { startHour: number; startMinute: number; endHour: number; endMinute: number }) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    // Update notification settings with custom time range
    setNotificationSettings({
      ...notificationSettings,
      customTimeRange: timeRange,
    });
    
    Alert.alert(
      'Time Range Updated',
      `Your reminders will now be sent between ${String(timeRange.startHour).padStart(2, '0')}:${String(timeRange.startMinute).padStart(2, '0')}` +
      ` and ${String(timeRange.endHour).padStart(2, '0')}:${String(timeRange.endMinute).padStart(2, '0')}.`,
      [{ text: 'OK' }]
    );
  };

  const handleCustomTimeRangePress = () => {
    if (subscriptionTier !== 'premium') {
      Alert.alert(
        'Premium Feature',
        'Custom time ranges are available for premium subscribers. Upgrade to customize when you receive reminders!',
        [{ text: 'OK' }]
      );
      return;
    }
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setShowTimeRangeModal(true);
  };

  const formatTimeRange = () => {
    const customTimeRange = notificationSettings?.customTimeRange;
    if (subscriptionTier === 'premium' && customTimeRange) {
      const startTime = `${String(customTimeRange.startHour).padStart(2, '0')}:${String(customTimeRange.startMinute).padStart(2, '0')}`;
      const endTime = `${String(customTimeRange.endHour).padStart(2, '0')}:${String(customTimeRange.endMinute).padStart(2, '0')}`;
      return `${startTime} - ${endTime}`;
    }
    return '09:00 - 22:00'; // Default range
  };

  const handleToggleNotifications = async (enabled: boolean) => {
    setNotificationsEnabled(enabled);
    
    if (enabled) {
      // Request permissions when enabling notifications
      try {
        const token = await getPushTokenAndPermissionsAsync();
        if (!token) {
          // Permission denied
          setNotificationsEnabled(false);
          return;
        }
      } catch (error) {
        console.error('Failed to get notification permissions:', error);
        Alert.alert(
          'Permission Error',
          'Unable to get notification permissions. Please check your device settings.',
          [{ text: 'OK' }]
        );
        setNotificationsEnabled(false);
        return;
      }
    } else {
      // Cancel all notifications when disabling
      try {
        await cancelAllScheduledAffirmationReminders();
        console.log('All notifications cancelled');
      } catch (error) {
        console.error('Failed to cancel notifications:', error);
      }
    }
    
    // Update user store
    setNotificationSettings({
      enabled,
      frequency: `${selectedFrequency}x` as any,
    });
  };

  const handleAllowAndSave = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    if (!notificationsEnabled) {
      // If notifications are disabled, just save the preference and close
      setNotificationSettings({
        enabled: false,
        frequency: `${selectedFrequency}x` as any,
        selectedCategories: selectedCategories, // Save selected categories even when disabled
      });
      handleClose();
      return;
    }

    if (selectedCategories.length === 0) {
      Alert.alert(
        'No Categories Selected',
        'Please select at least one category for your reminders.',
        [{ text: 'OK' }]
      );
      return;
    }

    setIsSchedulingNotifications(true);

    try {
      // Use custom time range if premium user has set one
      const customTimeRange = subscriptionTier === 'premium' ? notificationSettings?.customTimeRange : undefined;
      
      if (customTimeRange) {
        // Schedule with custom time range
        await scheduleDailyAffirmationReminders(
          `${selectedFrequency}x` as any,
          undefined,
          selectedCategories,
          customTimeRange
        );
      } else {
      // Generate custom notification times based on frequency (9 AM to 10 PM)
      const customTimes = generateCustomNotificationTimes(selectedFrequency);
      
      // Schedule notifications with custom times and selected categories
      await scheduleDailyAffirmationReminders(
        'custom',
        customTimes,
        selectedCategories
      );
      }

      // Update user store with settings
      setNotificationSettings({
        enabled: notificationsEnabled,
        frequency: `${selectedFrequency}x` as any,
        selectedCategories: selectedCategories, // Save selected categories
        customTimeRange: notificationSettings?.customTimeRange,
      });

      const timeRangeText = customTimeRange 
        ? `${String(customTimeRange.startHour).padStart(2, '0')}:${String(customTimeRange.startMinute).padStart(2, '0')} to ${String(customTimeRange.endHour).padStart(2, '0')}:${String(customTimeRange.endMinute).padStart(2, '0')}`
        : '9:00 AM to 10:00 PM';

      Alert.alert(
        'Reminders Set!',
        `Your ${selectedFrequency}x daily reminders have been scheduled from ${timeRangeText}.`,
        [{ text: 'OK', onPress: handleClose }]
      );
    } catch (error) {
      console.error('Failed to schedule notifications:', error);
      Alert.alert(
        'Error',
        'Failed to schedule notifications. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsSchedulingNotifications(false);
    }
  };



  const renderCategoriesList = () => {
    if (!showCategoriesList) return null;

    return (
      <View style={styles.categoriesListOverlay}>
        <Pressable 
          style={styles.categoriesOverlayTouchable} 
          onPress={handleCloseCategoriesList} 
        />
        <Animated.View style={[
          styles.categoriesListContainer,
          { transform: [{ translateY: categoriesSlideAnim }] }
        ]}>
          <View style={styles.categoriesListHeader}>
            <Text style={styles.categoriesListTitle}>Select Categories</Text>
            <Pressable onPress={handleCloseCategoriesList}>
              <Ionicons name="close" size={24} color={theme.colors.text} />
            </Pressable>
          </View>
          
          <ScrollView style={styles.categoriesList}>
            {breakupInterestCategories.map((category) => {
              const isSelected = selectedCategories.includes(category.id);
              const isLocked = category.premium && subscriptionTier !== 'premium';
              
              return (
                <Pressable
                  key={category.id}
                  style={[
                    styles.categoryItem,
                    isSelected && styles.categoryItemSelected,
                    isLocked && styles.categoryItemLocked
                  ]}
                  onPress={() => handleCategoryToggle(category.id)}
                >
                  <View style={styles.categoryItemLeft}>
                    <View style={[
                      styles.checkbox,
                      isSelected && styles.checkboxSelected
                    ]}>
                      {isSelected && (
                        <Ionicons name="checkmark" size={16} color="white" />
                      )}
                    </View>
                    <Text style={[
                      styles.categoryItemText,
                      isLocked && styles.categoryItemTextLocked
                    ]}>
                      {category.label}
                    </Text>
                  </View>
                  {isLocked && (
                    <Ionicons name="lock-closed" size={16} color={theme.colors.textSecondary} />
                  )}
                </Pressable>
              );
            })}
          </ScrollView>
          
          <Pressable
            style={styles.categoriesDoneButton}
            onPress={handleCloseCategoriesList}
          >
            <Text style={styles.categoriesDoneButtonText}>Done</Text>
          </Pressable>
        </Animated.View>
      </View>
    );
  };

  if (!visible) {
    return null;
  }

  const getCategoriesDisplayText = () => {
    if (selectedCategories.length === 0) return 'Select Categories';
    if (selectedCategories.length === 1) {
      const category = breakupInterestCategories.find(cat => cat.id === selectedCategories[0]);
      return category?.label || 'Select Categories';
    }
    return `${selectedCategories.length} Categories Selected`;
  };

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
              <Pressable style={styles.backButton} onPress={handleClose}>
                <Ionicons name="chevron-back" size={24} color={theme.colors.text} />
              </Pressable>
              <View style={styles.titleContainer}>
                <Text style={styles.headerTitle}>Reminders</Text>
              </View>
            </View>

            {/* Content */}
            <ScrollView 
              style={styles.content}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.scrollContent}
            >
              {/* Header Text */}
              <View style={styles.headerTextSection}>
                <Text style={styles.mainTitle}>Stay Inspired{'\n'}Throughout the Day</Text>
                <Text style={styles.subtitle}>A few powerful words at the right time{'\n'}can change your mindset.</Text>
                <Text style={styles.settingsNote}>
                  You can always change notification frequency, categories, and other settings in the app later.
                </Text>
              </View>

              {/* Quote Card */}
              <View style={styles.quoteCard}>
                <View style={styles.quoteCardHeader}>
                  <View style={styles.quoteIcon}>
                    <Text style={styles.quoteIconText}>💬</Text>
                  </View>
                  <Text style={styles.quoteCardTitle}>Solace Daily Quotes</Text>
                </View>
                <Text style={styles.quoteText}>
                  One day, you'll arrive exactly where you've{'\n'}always dreamed of being.
                </Text>
              </View>

              {/* Enable Notifications Toggle */}
              <View style={styles.sectionContainer}>
                <Text style={styles.sectionLabel}>Enable Notifications</Text>
                <View style={styles.toggleContainer}>
                  <Text style={styles.toggleLabel}>
                    {notificationsEnabled ? 'Notifications enabled' : 'Notifications disabled'}
                  </Text>
                  <Switch
                    value={notificationsEnabled}
                    onValueChange={handleToggleNotifications}
                    trackColor={{ false: '#767577', true: theme.colors.primary }}
                    thumbColor={notificationsEnabled ? '#f4f3f4' : '#f4f3f4'}
                  />
                </View>
              </View>

              {/* How Many Section */}
              <View style={[styles.sectionContainer, { opacity: notificationsEnabled ? 1 : 0.5 }]}>
                <Text style={styles.sectionLabel}>How Many</Text>
                <View style={styles.frequencyContainer}>
                  <Pressable
                    style={[styles.frequencyButton, { opacity: notificationsEnabled ? 1 : 0.5 }]}
                    onPress={() => notificationsEnabled && handleFrequencyChange('decrease')}
                    disabled={!notificationsEnabled}
                  >
                    <Ionicons name="remove" size={20} color="white" />
                  </Pressable>
                  <Text style={styles.frequencyText}>{selectedFrequency}x</Text>
                  <Pressable
                    style={[styles.frequencyButton, { opacity: notificationsEnabled ? 1 : 0.5 }]}
                    onPress={() => notificationsEnabled && handleFrequencyChange('increase')}
                    disabled={!notificationsEnabled}
                  >
                    <Ionicons name="add" size={20} color="white" />
                  </Pressable>
                </View>
              </View>

              {/* Time Range Section - Premium Feature */}
              <View style={[styles.sectionContainer, { opacity: notificationsEnabled ? 1 : 0.5 }]}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionLabel}>Time Range</Text>
                  {subscriptionTier !== 'premium' && (
                    <View style={styles.premiumBadge}>
                      <Ionicons name="diamond" size={14} color={theme.colors.primary} />
                      <Text style={styles.premiumBadgeText}>Premium</Text>
                    </View>
                  )}
                </View>
                <Pressable
                  style={[
                    styles.timeRangeButton,
                    { opacity: notificationsEnabled ? 1 : 0.5 },
                    subscriptionTier !== 'premium' && styles.lockedButton
                  ]}
                  onPress={() => notificationsEnabled && handleCustomTimeRangePress()}
                  disabled={!notificationsEnabled}
                >
                  <View style={styles.timeRangeContent}>
                    <Text style={[
                      styles.timeRangeText,
                      subscriptionTier !== 'premium' && styles.lockedText
                    ]}>
                      {formatTimeRange()}
                    </Text>
                    <Text style={[
                      styles.timeRangeSubtext,
                      subscriptionTier !== 'premium' && styles.lockedSubtext
                    ]}>
                      {subscriptionTier === 'premium' ? 'Tap to customize' : 'Upgrade to customize'}
                    </Text>
                  </View>
                  <Ionicons 
                    name={subscriptionTier === 'premium' ? "chevron-forward" : "lock-closed"} 
                    size={20} 
                    color={subscriptionTier === 'premium' ? theme.colors.text : theme.colors.textSecondary} 
                  />
                </Pressable>
              </View>

              {/* Categories Section */}
              <View style={[styles.sectionContainer, { opacity: notificationsEnabled ? 1 : 0.5 }]}>
                <Text style={styles.sectionLabel}>Categories</Text>
                <Pressable 
                  style={styles.timeContainer} 
                  onPress={() => notificationsEnabled && handleCategoriesPress()}
                  disabled={!notificationsEnabled}
                >
                  <Text style={styles.timeLabel}>{getCategoriesDisplayText()}</Text>
                  <Ionicons name="chevron-forward" size={20} color={theme.colors.textSecondary} />
                </Pressable>
              </View>


            </ScrollView>

            {/* Allow and Save Button */}
            <View style={styles.bottomSection}>
              <Pressable 
                style={styles.allowButton} 
                onPress={handleAllowAndSave}
                disabled={isSchedulingNotifications}
              >
                <Text style={styles.allowButtonText}>
                  {isSchedulingNotifications ? 'Scheduling...' : 'Continue'}
                </Text>
              </Pressable>
            </View>
          </LinearGradient>
        </Animated.View>
      </PanGestureHandler>



      {/* Categories List Modal */}
      {renderCategoriesList()}
      
      {/* Time Range Modal */}
      <TimeRangeScreen
        visible={showTimeRangeModal}
        onClose={() => setShowTimeRangeModal(false)}
        onSave={handleTimeRangeSave}
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
    top: 50,
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
  backButton: {
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
  headerTextSection: {
    alignItems: 'center',
    marginBottom: theme.spacing.l,
    paddingTop: theme.spacing.m,
  },
  mainTitle: {
    fontSize: 28,
    fontFamily: theme.typography.fontFamily.semiBold,
    color: theme.colors.text,
    textAlign: 'center',
    marginBottom: theme.spacing.s,
    lineHeight: 34,
  },
  subtitle: {
    fontSize: theme.typography.fontSizes.m,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  quoteCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: theme.radii.m,
    padding: theme.spacing.m,
    marginBottom: theme.spacing.l,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
  },
  quoteCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.s,
  },
  quoteIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.lightPink.medium,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.s,
  },
  quoteIconText: {
    fontSize: 16,
  },
  quoteCardTitle: {
    fontSize: theme.typography.fontSizes.m,
    fontFamily: theme.typography.fontFamily.semiBold,
    color: theme.colors.text,
  },
  quoteText: {
    fontSize: theme.typography.fontSizes.m,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.textSecondary,
    lineHeight: 22,
  },
  sectionContainer: {
    marginBottom: theme.spacing.l,
  },
  sectionLabel: {
    fontSize: theme.typography.fontSizes.m,
    fontFamily: theme.typography.fontFamily.semiBold,
    color: theme.colors.text,
    marginBottom: theme.spacing.s,
  },
  frequencyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: theme.radii.m,
    padding: theme.spacing.m,
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
  },
  frequencyButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.colors.text,
    alignItems: 'center',
    justifyContent: 'center',
  },
  frequencyText: {
    fontSize: 20,
    fontFamily: theme.typography.fontFamily.semiBold,
    color: theme.colors.text,
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: theme.radii.m,
    paddingHorizontal: theme.spacing.m,
    paddingVertical: 18,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
  },
  timeLabel: {
    fontSize: theme.typography.fontSizes.m,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.text,
  },
  timeText: {
    fontSize: 20,
    fontFamily: theme.typography.fontFamily.semiBold,
    color: theme.colors.text,
  },
  bottomSection: {
    paddingHorizontal: theme.spacing.m,
    paddingVertical: theme.spacing.l,
    paddingBottom: 40,
  },
  allowButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radii.m,
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  allowButtonText: {
    fontSize: theme.typography.fontSizes.m,
    fontFamily: theme.typography.fontFamily.semiBold,
    color: 'white',
  },
  // Categories List Modal Styles
  categoriesListOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 2000,
    justifyContent: 'flex-end',
  },
  categoriesOverlayTouchable: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  categoriesListContainer: {
    backgroundColor: 'white',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: screenHeight * 0.8,
  },
  categoriesListHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.m,
    paddingVertical: theme.spacing.m,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
  },
  categoriesListTitle: {
    fontSize: theme.typography.fontSizes.l,
    fontFamily: theme.typography.fontFamily.semiBold,
    color: theme.colors.text,
  },
  categoriesList: {
    maxHeight: screenHeight * 0.5,
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.m,
    paddingVertical: theme.spacing.m,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
  },
  categoryItemSelected: {
    backgroundColor: 'rgba(128, 106, 97, 0.1)',
  },
  categoryItemLocked: {
    opacity: 0.6,
  },
  categoryItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: theme.colors.textSecondary,
    marginRight: theme.spacing.m,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxSelected: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  categoryItemText: {
    fontSize: theme.typography.fontSizes.m,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.text,
    flex: 1,
  },
  categoryItemTextLocked: {
    color: theme.colors.textSecondary,
  },
  categoriesDoneButton: {
    backgroundColor: theme.colors.primary,
    marginHorizontal: theme.spacing.m,
    marginVertical: theme.spacing.m,
    borderRadius: theme.radii.m,
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoriesDoneButtonText: {
    fontSize: theme.typography.fontSizes.m,
    fontFamily: theme.typography.fontFamily.semiBold,
    color: 'white',
  },
  // Toggle styles
  toggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: theme.radii.m,
    paddingHorizontal: theme.spacing.m,
    paddingVertical: 18,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
  },
  toggleLabel: {
    fontSize: theme.typography.fontSizes.m,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.text,
    flex: 1,
  },
  settingsNote: {
    fontSize: theme.typography.fontSizes.s,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginTop: theme.spacing.m,
    lineHeight: 20,
  },
  // Time Range Section Styles
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.s,
  },
  premiumBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.lightPink.lightest,
    borderRadius: theme.radii.s,
    paddingHorizontal: theme.spacing.s,
    paddingVertical: theme.spacing.xs,
    borderWidth: 1,
    borderColor: theme.colors.lightPink.medium,
  },
  premiumBadgeText: {
    fontSize: theme.typography.fontSizes.xs,
    fontFamily: theme.typography.fontFamily.semiBold,
    color: theme.colors.primary,
    marginLeft: theme.spacing.xs,
  },
  timeRangeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: theme.radii.m,
    paddingHorizontal: theme.spacing.m,
    paddingVertical: 18,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
  },
  timeRangeContent: {
    flex: 1,
  },
  timeRangeText: {
    fontSize: theme.typography.fontSizes.m,
    fontFamily: theme.typography.fontFamily.semiBold,
    color: theme.colors.text,
  },
  timeRangeSubtext: {
    fontSize: theme.typography.fontSizes.s,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.xs,
  },
  lockedButton: {
    opacity: 0.6,
  },
  lockedText: {
    color: theme.colors.textSecondary,
  },
  lockedSubtext: {
    color: theme.colors.textSecondary,
  },

}); 