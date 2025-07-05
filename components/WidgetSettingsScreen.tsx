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
  Platform,
  NativeModules,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { PanGestureHandler, State } from 'react-native-gesture-handler';
import { theme } from '../constants/theme';
import { useUserStore, breakupInterestCategories } from '../store/userStore';
import { supabase } from '../services/supabaseClient';
import * as Haptics from 'expo-haptics';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface WidgetSettingsScreenProps {
  visible: boolean;
  onClose: () => void;
}

export const WidgetSettingsScreen: React.FC<WidgetSettingsScreenProps> = ({
  visible,
  onClose,
}) => {
  const slideAnim = useRef(new Animated.Value(screenHeight)).current;
  const backgroundOpacity = useRef(new Animated.Value(0)).current;
  const panY = useRef(new Animated.Value(0)).current;

  const { 
    widgetSettings, 
    setWidgetSettings, 
    subscriptionTier, 
    favoriteQuoteIds,
    userName
  } = useUserStore();

  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    // Initialize with default settings if none exist
    if (!widgetSettings) {
      setWidgetSettings({ category: 'all', theme: 'light' });
    }
  }, [widgetSettings, setWidgetSettings]);

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

  const handleCategoryChange = (value: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const selectedCategoryInfo = breakupInterestCategories.find(cat => cat.id === value);

    if (selectedCategoryInfo?.premium && subscriptionTier === 'free') {
      Alert.alert(
        "Premium Feature",
        `"${selectedCategoryInfo.label}" is a premium category. Please upgrade to use this topic on your widget.`
      );
      return;
    }
    
    setWidgetSettings({ category: value as any });
  };

  const updateWidgetData = async () => {
    if (!widgetSettings || Platform.OS !== 'ios') {
      if (Platform.OS !== 'ios') {
        Alert.alert("iOS Only", "Widgets are only available on iOS devices.");
      }
      return;
    }

    setIsUpdating(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      let quotesToSend: string[] = [`Hello ${userName || 'User'}! Open Solace to get inspired.`];
      let queryCategory = widgetSettings.category;

      if (queryCategory === 'favorites') {
        // Handle favorites
        if (favoriteQuoteIds.length === 0) {
          quotesToSend = [`Hi ${userName || 'User'}! Add some favorites first to see them in your widget.`];
        } else {
          const { data, error } = await supabase
            .from('quotes')
            .select('text')
            .in('id', favoriteQuoteIds)
            .limit(150);
          
          if (error) throw error;
          if (data && data.length > 0) {
            quotesToSend = data.map(q => q.text);
          }
        }
      } else {
        // Handle category-based quotes - single category only
        const categoriesToFetch = [queryCategory];

        const { data, error } = await supabase
          .from('quotes')
          .select('text')
          .in('category', categoriesToFetch)
          .limit(150);
        
        if (error) throw error;
        if (data && data.length > 0) {
          // Shuffle the quotes
          const shuffledQuotes = [...data].sort(() => Math.random() - 0.5);
          quotesToSend = shuffledQuotes.map(q => q.text);
        }
      }

      // Update widget with quotes and user name
      const { WidgetUpdateModule } = NativeModules;
      if (WidgetUpdateModule) {
        await WidgetUpdateModule.updateQuotes(quotesToSend);
        if (userName) {
          await WidgetUpdateModule.updateUserName(userName);
        }
        Alert.alert("Widget Updated!", "Your widget will update with new affirmations.");
      } else {
        throw new Error("Widget module not found");
      }

    } catch (e: any) {
      console.error('Widget update error:', e);
      Alert.alert("Error Updating Widget", e.message || "Something went wrong");
    } finally {
      setIsUpdating(false);
    }
  };

  if (!visible) {
    return null;
  }

  if (!widgetSettings) return null; // Wait for initialization

  const selectedCategory = breakupInterestCategories.find(c => c.id === widgetSettings.category);

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

      {/* Widget Settings Modal content */}
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
                <Text style={styles.headerTitle}>Widget Settings</Text>
              </View>
            </View>

            {/* Content */}
            <View style={styles.content}>
              <ScrollView 
                style={styles.scrollView}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
              >
                {/* Preview Box */}
                <View style={styles.previewSection}>
                  <View style={styles.previewBox}>
                    <View style={styles.previewWidget}>
                      <View style={styles.previewHeader}>
                        <Ionicons name="heart" size={16} color="#FF69B4" />
                        <Text style={styles.previewAppName}>Solace</Text>
                      </View>
                      <Text style={styles.previewQuote}>
                        {selectedCategory ? `${selectedCategory.label} affirmations` : 'Select a category'}
                      </Text>
                      <Text style={styles.previewUser}>Hello, {userName || 'User'}</Text>
                    </View>
                  </View>
                  <Text style={styles.previewLabel}>Widget Preview</Text>
                </View>

                {/* Category Selection */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Affirmation Topic</Text>
                  <Text style={styles.sectionSubtitle}>Choose what type of affirmations to show</Text>
                  
                  <View style={styles.optionsList}>
                    {/* Favorites Option */}
                    <Pressable 
                      style={[styles.option, widgetSettings.category === 'favorites' && styles.selectedOption]}
                      onPress={() => handleCategoryChange('favorites')}
                    >
                      <View style={styles.optionContent}>
                        <Text style={[styles.optionText, widgetSettings.category === 'favorites' && styles.selectedOptionText]}>
                          My Favorites
                        </Text>
                        <Text style={styles.optionDescription}>
                          Your saved affirmations ({favoriteQuoteIds.length} saved)
                        </Text>
                      </View>
                      {widgetSettings.category === 'favorites' && (
                        <Ionicons name="checkmark-circle" size={20} color="#FF69B4" />
                      )}
                    </Pressable>

                    {/* Category Options */}
                    {breakupInterestCategories.map(category => {
                      const isLocked = category.premium && subscriptionTier === 'free';
                      const isSelected = widgetSettings.category === category.id;
                      
                      return (
                        <Pressable 
                          key={category.id}
                          style={[
                            styles.option, 
                            isSelected && styles.selectedOption,
                            isLocked && styles.lockedOption
                          ]}
                          onPress={() => handleCategoryChange(category.id)}
                          disabled={isLocked}
                        >
                          <View style={styles.optionContent}>
                            <View style={styles.optionTitleRow}>
                              <Text style={[
                                styles.optionText, 
                                isSelected && styles.selectedOptionText,
                                isLocked && styles.lockedOptionText
                              ]}>
                                {category.label}
                              </Text>
                              {isLocked && <Ionicons name="lock-closed" size={16} color="#999" />}
                            </View>
                            {category.premium && (
                              <Text style={styles.premiumBadge}>Premium</Text>
                            )}
                          </View>
                          {isSelected && (
                            <Ionicons name="checkmark-circle" size={20} color="#FF69B4" />
                          )}
                        </Pressable>
                      );
                    })}
                  </View>
                </View>
              </ScrollView>

              {/* Sticky Update Button */}
              <View style={styles.stickyButtonContainer}>
                <Pressable 
                  style={[styles.updateButton, isUpdating && styles.updatingButton]}
                  onPress={updateWidgetData}
                  disabled={isUpdating}
                >
                  <Text style={styles.updateButtonText}>
                    {isUpdating ? 'Updating Widget...' : 'Apply to Widget & Refresh'}
                  </Text>
                </Pressable>
              </View>
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: theme.spacing.m,
    paddingBottom: theme.spacing.m,
  },
  stickyButtonContainer: {
    paddingHorizontal: theme.spacing.m,
    paddingBottom: theme.spacing.xl,
    paddingTop: theme.spacing.m,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
  },
  previewSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  previewBox: {
    width: 200,
    height: 120,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  previewWidget: {
    flex: 1,
    justifyContent: 'space-between',
  },
  previewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  previewAppName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
  },
  previewQuote: {
    fontSize: 11,
    color: '#666',
    lineHeight: 14,
  },
  previewUser: {
    fontSize: 10,
    color: '#999',
  },
  previewLabel: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginTop: 8,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: theme.typography.fontSizes.l,
    fontFamily: theme.typography.fontFamily.semiBold,
    color: theme.colors.text,
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: theme.typography.fontSizes.s,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.textSecondary,
    marginBottom: 16,
  },
  optionsList: {
    gap: 12,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    padding: 16,
    borderRadius: theme.radii.m,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  selectedOption: {
    borderColor: theme.colors.primary,
    backgroundColor: 'rgba(255, 105, 180, 0.1)',
  },
  lockedOption: {
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
  optionContent: {
    flex: 1,
  },
  optionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  optionText: {
    fontSize: theme.typography.fontSizes.m,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.text,
  },
  selectedOptionText: {
    color: theme.colors.primary,
    fontFamily: theme.typography.fontFamily.semiBold,
  },
  lockedOptionText: {
    color: theme.colors.textSecondary,
  },
  optionDescription: {
    fontSize: theme.typography.fontSizes.s,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  premiumBadge: {
    fontSize: theme.typography.fontSizes.xs,
    color: theme.colors.primary,
    fontFamily: theme.typography.fontFamily.regular,
    marginTop: 4,
  },
  updateButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 16,
    borderRadius: theme.radii.m,
    alignItems: 'center',
    marginTop: 20,
  },
  updatingButton: {
    backgroundColor: 'rgba(255, 105, 180, 0.7)',
  },
  updateButtonText: {
    color: '#fff',
    fontSize: theme.typography.fontSizes.m,
    fontFamily: theme.typography.fontFamily.semiBold,
  },
}); 