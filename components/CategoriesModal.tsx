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
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { PanGestureHandler, State } from 'react-native-gesture-handler';
import { theme } from '../constants/theme';
import { getModalDimensions, getResponsiveFontSize } from '../utils/responsive';
import * as Haptics from 'expo-haptics';
import { BreakupCategory, breakupInterestCategories, useUserStore } from '@/store/userStore';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Preload images at module level
const CATEGORY_IMAGES = {
  'general_healing': require('../categoryImages/6425304.jpg'),
  'moving_on': require('../categoryImages/image copy.png'), 
  'moving_forward': require('../categoryImages/image.png'),
  'self_love': require('../categoryImages/4038942.jpg'),
  'self_love_discovery': require('../categoryImages/Happy smiling woman admiring beautiful reflection in mirror.jpg'),
  'coping_loneliness': require('../categoryImages/image copy 3.png'),
  'overcoming_loneliness': require('../categoryImages/7853915.jpg'),
  'rebuilding_confidence': require('../categoryImages/image copy 4.png'),
  'managing_anger_resentment': require('../categoryImages/image copy 5.png'),
  'finding_closure': require('../categoryImages/image copy 6.png'),
  'finding_peace': require('../categoryImages/39093.jpg'),
  'hope_for_future': require('../categoryImages/image copy 7.png'),
  'hope_future': require('../categoryImages/4365672.jpg'),
  'healing_from_betrayal': require('../categoryImages/image copy 8.png'),
  'loss_of_partner_widow': require('../categoryImages/4590471.jpg'),
  'navigating_divorce': require('../categoryImages/3349694.jpg'),
  'heartbreak_recovery': require('../categoryImages/te07_qq4a_141122.jpg'),
  'letting_go_of_ex': require('../categoryImages/8107017.jpg'),
  'letting_go': require('../categoryImages/4582464.jpg'),
  'letting_go_acceptance': require('../categoryImages/8593071.jpg'),
  'embracing_single_life': require('../categoryImages/4098100.jpg'),
  'overcoming_codependency': require('../categoryImages/image copy 2.png'),
  'gratitude_reflection': require('../categoryImages/8620602.jpg')
};

const CATEGORY_COLORS = {
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

interface Category {
  id: string;
  title: string;
  icon: string;
  color: string;
  locked?: boolean;
  isSelected?: boolean;
}

// Map breakup categories to UI categories with icons and colors
const mapBreakupCategoriesToUI = (breakupCategories: BreakupCategory[], subscriptionTier: string, activeQuoteCategory: string | null): Category[] => {
  return breakupCategories.map(category => ({
    id: category.id,
    title: category.label,
    icon: CATEGORY_IMAGES[category.id] || '💭',
    color: CATEGORY_COLORS[category.id] || theme.colors.categoryColors.pink,
    locked: category.premium && subscriptionTier !== 'premium',
    isSelected: activeQuoteCategory === category.id
  }));
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
  const activeQuoteCategory = useUserStore((state) => state.activeQuoteCategory);

  useEffect(() => {
    if (visible) {
      // Reset pan gesture and slide up animation with a small delay to ensure layout is complete
      panY.setValue(0);
      slideAnim.setValue(screenHeight); // Ensure starting position is set
      backgroundOpacity.setValue(0);
      
      // Use requestAnimationFrame to ensure the component is fully mounted before animating
      requestAnimationFrame(() => {
        Animated.parallel([
          Animated.timing(slideAnim, {
            toValue: 0,
            duration: 280,
            useNativeDriver: true,
          }),
          Animated.timing(backgroundOpacity, {
            toValue: 0.5,
            duration: 280,
            useNativeDriver: true,
          }),
        ]).start();
      });
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

  const handleFavoritesPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    // Trigger slide down animation, then call onCategorySelect with 'favorites'
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
      // We need to create a special breakup category for favorites
      const favoritesCategory: BreakupCategory = {
        id: 'favorites',
        label: 'My Favourites',
        premium: false
      };
      onCategorySelect(favoritesCategory);
    });
  };

  const categories = mapBreakupCategoriesToUI(breakupInterestCategories, subscriptionTier, activeQuoteCategory);

  return (
    <View style={[styles.overlay, !visible && { pointerEvents: 'none' }]}>
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

            {/* Categories content */}
            <ScrollView 
              style={styles.content}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.scrollContent}
            >
              {/* My Favourites Option */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>My Favourites</Text>
                <View style={styles.categoryGrid}>
                  <Pressable
                    style={({ pressed }) => [
                      styles.categoryCard,
                      { opacity: pressed ? 0.8 : 1 },
                      { transform: [{ scale: pressed ? 0.95 : 1 }] },
                      activeQuoteCategory === 'favorites' && styles.selectedCard
                    ]}
                    onPress={handleFavoritesPress}
                  >
                    <View style={styles.categoryImageBackground}>
                      <Image 
                        source={require('../categoryImages/8271477.jpg')} 
                        style={styles.categoryBackgroundImage}
                        resizeMode="cover"
                      />
                      <View style={styles.categoryOverlay} />
                    </View>
                    
                    <View style={styles.categoryContentOverlay}>
                      <View style={styles.categoryTopRow}>
                        <View style={styles.iconContainer}>
                          {activeQuoteCategory === 'favorites' && (
                            <View style={styles.checkmarkIcon}>
                              <Ionicons name="checkmark-circle" size={20} color="white" />
                            </View>
                          )}
                        </View>
                      </View>
                      
                      <Text style={styles.categoryTitle}>My Favourites</Text>
                    </View>
                  </Pressable>
                </View>
              </View>

              {/* Individual Categories */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Choose Category</Text>
                <View style={styles.categoryGrid}>
                  {categories.map((category) => (
                    <Pressable
                      key={category.id}
                      style={({ pressed }) => [
                        styles.categoryCard,
                        { opacity: pressed ? 0.8 : (category.locked ? 0.6 : 1) },
                        { transform: [{ scale: pressed ? 0.95 : 1 }] },
                        category.isSelected && styles.selectedCard
                      ]}
                      onPress={() => handleCategoryPress(category)}
                    >
                      {typeof category.icon === 'string' ? (
                        // Fallback for emoji - use solid background color
                        <View style={[styles.categoryBackground, { backgroundColor: category.color }]}>
                          <View style={styles.categoryOverlay}>
                            <Text style={[styles.categoryIcon, category.locked && styles.lockedIcon]}>
                              {category.icon}
                            </Text>
                          </View>
                        </View>
                      ) : (
                        // Use image as full background
                        <View style={styles.categoryImageBackground}>
                          <Image 
                            source={category.icon} 
                            style={[styles.categoryBackgroundImage, category.locked && styles.lockedIcon]}
                            resizeMode="cover"
                          />
                          <View style={styles.categoryOverlay} />
                        </View>
                      )}
                      
                      {/* Content overlay with icons and title */}
                      <View style={styles.categoryContentOverlay}>
                        <View style={styles.categoryTopRow}>
                          <View style={styles.iconContainer}>
                            {category.locked && (
                              <View style={styles.lockIcon}>
                                <Ionicons name="lock-closed" size={16} color="white" />
                              </View>
                            )}
                            {category.isSelected && !category.locked && (
                              <View style={styles.checkmarkIcon}>
                                <Ionicons name="checkmark-circle" size={20} color="white" />
                              </View>
                            )}
                          </View>
                        </View>
                        
                        <Text style={[styles.categoryTitle, category.locked && styles.lockedTitle]}>
                          {category.title}
                        </Text>
                      </View>
                    </Pressable>
                  ))}
                </View>
              </View>
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
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    overflow: 'hidden',
  },
  modalContent: {
    flex: 1,
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
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
    gap: theme.spacing.s,
  },
  categoryCard: {
    width: Math.min((screenWidth - theme.spacing.m * 2 - theme.spacing.s) / 2, 180),
    height: 180,
    borderRadius: theme.radii.m,
    padding: 0,
    justifyContent: 'space-between',
    borderWidth: 2,
    borderColor: 'transparent',
    overflow: 'hidden',
  },

  selectedCard: {
    borderColor: theme.colors.primary,
    borderWidth: 3,
    shadowColor: theme.colors.primary,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  categoryContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  categoryIconContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 4,
  },
  categoryIcon: {
    fontSize: 32,
  },
  lockedIcon: {
    opacity: 0.5,
  },
  iconContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 4,
  },
  lockIcon: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 12,
    padding: 4,
  },
  checkmarkIcon: {
    backgroundColor: 'transparent',
    borderRadius: 12,
    padding: 2,
  },
  categoryTitle: {
    fontSize: theme.typography.fontSizes.s,
    fontFamily: theme.typography.fontFamily.semiBold,
    color: 'white',
    textAlign: 'left',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  lockedTitle: {
    opacity: 0.7,
  },
  categoryImage: {
    width: 40,
    height: 40,
    borderRadius: 8,
  },
  categoryBackground: {
    flex: 1,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  categoryImageBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 8,
    overflow: 'hidden',
  },
  categoryBackgroundImage: {
    width: '100%',
    height: '100%',
  },
  categoryContentOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    padding: theme.spacing.m,
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  categoryTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
}); 