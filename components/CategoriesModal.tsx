import React, { useRef, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Pressable,
  Dimensions,
  Animated,
  ScrollView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { PanGestureHandler, State } from 'react-native-gesture-handler';
import { theme } from '../constants/theme';
import * as Haptics from 'expo-haptics';
import { BreakupCategory, breakupInterestCategories, useUserStore } from '@/store/userStore';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface Category {
  id: string;
  title: string;
  icon: string;
  color: string;
  locked?: boolean;
}

// Map breakup categories to UI categories with icons and colors
const mapBreakupCategoriesToUI = (breakupCategories: BreakupCategory[], subscriptionTier: string): Category[] => {
  const iconMap: { [key: string]: string } = {
    'general_healing': '🌸',
    'moving_on': '🚀', 
    'self_love_discovery': '💝',
    'coping_loneliness': '🤗',
    'rebuilding_confidence': '💪',
    'managing_anger_resentment': '🧘',
    'finding_closure': '🔒',
    'hope_for_future': '✨',
    'healing_from_betrayal': '💔',
    'loss_of_partner_widow': '🕊️',
    'navigating_divorce': '📋',
    'heartbreak_recovery': '💖',
    'letting_go_of_ex': '🎈',
    'embracing_single_life': '🌟',
    'overcoming_codependency': '🔗'
  };

  const colorMap: { [key: string]: string } = {
    'general_healing': theme.colors.categoryColors.pink,
    'moving_on': theme.colors.categoryColors.blue,
    'self_love_discovery': theme.colors.categoryColors.lavender,
    'coping_loneliness': theme.colors.categoryColors.coral,
    'rebuilding_confidence': theme.colors.categoryColors.orange,
    'managing_anger_resentment': theme.colors.categoryColors.teal,
    'finding_closure': theme.colors.categoryColors.purple,
    'hope_for_future': theme.colors.categoryColors.green,
    'healing_from_betrayal': theme.colors.categoryColors.coral,
    'loss_of_partner_widow': theme.colors.categoryColors.blue,
    'navigating_divorce': theme.colors.categoryColors.orange,
    'heartbreak_recovery': theme.colors.categoryColors.pink,
    'letting_go_of_ex': theme.colors.categoryColors.lavender,
    'embracing_single_life': theme.colors.categoryColors.green,
    'overcoming_codependency': theme.colors.categoryColors.teal
  };

  return breakupCategories.map(category => ({
    id: category.id,
    title: category.label,
    icon: iconMap[category.id] || '💭',
    color: colorMap[category.id] || theme.colors.categoryColors.pink,
    locked: category.premium && subscriptionTier !== 'premium'
  }));
};

// Group categories into sections with unified design
const createCategorySections = (categories: Category[]) => {
  // Show all categories in a unified grid, organized by availability
  const freeCategories = categories.filter(c => !c.locked);
  const premiumCategories = categories.filter(c => c.locked);
  
  const sections = [];
  
  // Always show free categories first
  if (freeCategories.length > 0) {
    sections.push({ 
      title: 'Available Categories', 
      categories: freeCategories 
    });
  }
  
  // Show premium categories if any exist
  if (premiumCategories.length > 0) {
    sections.push({ 
      title: 'Premium Categories', 
      categories: premiumCategories 
    });
  }
  
  return sections;
};

interface CategoriesModalProps {
  visible: boolean;
  onClose: () => void;
  onCategorySelect: (category: BreakupCategory | null) => void;
}

export const CategoriesModal: React.FC<CategoriesModalProps> = ({
  visible,
  onClose,
  onCategorySelect,
}) => {
  const slideAnim = useRef(new Animated.Value(screenHeight)).current;
  const backgroundOpacity = useRef(new Animated.Value(0)).current;
  const panY = useRef(new Animated.Value(0)).current;
  const subscriptionTier = useUserStore((state) => state.subscriptionTier);

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

  const handleCategoryPress = (category: Category) => {
    if (category.locked) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      Alert.alert(
        "Premium Category",
        "This category is available for premium subscribers. Upgrade to unlock all categories!",
        [{ text: "OK" }]
      );
      return;
    }
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // Find the original breakup category
    const breakupCategory = breakupInterestCategories.find(bc => bc.id === category.id);
    
    // Trigger slide down animation, then call onCategorySelect
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
      onCategorySelect(breakupCategory || null);
    });
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

  const categories = mapBreakupCategoriesToUI(breakupInterestCategories, subscriptionTier);
  const categorySections = createCategorySections(categories);

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
              <Pressable style={styles.cancelButton} onPress={handleClose}>
                <Text style={styles.cancelText}>Cancel</Text>
              </Pressable>
              <View style={styles.titleContainer}>
                <Text style={styles.headerTitle}>Categories</Text>
              </View>
            </View>

            {/* Search bar */}
            <View style={styles.searchContainer}>
              <Ionicons name="search" size={20} color={theme.colors.textSecondary} />
              <Text style={styles.searchPlaceholder}>Search categories...</Text>
            </View>

                         {/* Categories content */}
             <ScrollView 
               style={styles.content}
               showsVerticalScrollIndicator={false}
               contentContainerStyle={styles.scrollContent}
             >
               {categorySections.map((section, sectionIndex) => (
                <View key={section.title} style={styles.section}>
                  <Text style={styles.sectionTitle}>{section.title}</Text>
                  <View style={styles.categoryGrid}>
                    {section.categories.map((category) => (
                      <Pressable
                        key={category.id}
                        style={({ pressed }) => [
                          styles.categoryCard,
                          { backgroundColor: category.color },
                          { opacity: pressed ? 0.8 : 1 },
                          { transform: [{ scale: pressed ? 0.95 : 1 }] }
                        ]}
                        onPress={() => handleCategoryPress(category)}
                      >
                        <View style={styles.categoryContent}>
                          <Text style={styles.categoryIcon}>{category.icon}</Text>
                          {category.locked && (
                            <View style={styles.lockIcon}>
                              <Ionicons name="lock-closed" size={16} color="#666" />
                            </View>
                          )}
                        </View>
                        <Text style={styles.categoryTitle}>{category.title}</Text>
                      </Pressable>
                    ))}
                  </View>
                </View>
              ))}
            </ScrollView>
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
    top: 50, // Show some of the main screen at the top
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
  cancelButton: {
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
  cancelText: {
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
  placeholder: {
    width: 40,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    marginHorizontal: theme.spacing.m,
    marginBottom: theme.spacing.l,
    paddingHorizontal: theme.spacing.m,
    paddingVertical: 12,
    borderRadius: theme.radii.m,
    gap: theme.spacing.s,
  },
  searchPlaceholder: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.fontSizes.m,
    fontFamily: theme.typography.fontFamily.regular,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: theme.spacing.m,
    paddingBottom: theme.spacing.xl,
  },
  section: {
    marginBottom: theme.spacing.l,
  },
  sectionTitle: {
    fontSize: theme.typography.fontSizes.m,
    fontFamily: theme.typography.fontFamily.semiBold,
    color: theme.colors.text,
    marginBottom: theme.spacing.m,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.m,
  },
  categoryCard: {
    width: (screenWidth - theme.spacing.m * 3) / 2,
    height: 120,
    borderRadius: theme.radii.m,
    padding: theme.spacing.m,
    justifyContent: 'space-between',
  },
  categoryContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  categoryIcon: {
    fontSize: 32,
  },
  lockIcon: {
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 12,
    padding: 4,
  },
  categoryTitle: {
    fontSize: theme.typography.fontSizes.s,
    fontFamily: theme.typography.fontFamily.semiBold,
    color: theme.colors.text,
    textAlign: 'left',
  },
}); 