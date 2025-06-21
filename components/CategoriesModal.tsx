import React, { useRef, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Pressable,
  Dimensions,
  Animated,
  ScrollView,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { PanGestureHandler, State } from 'react-native-gesture-handler';
import { theme } from '../constants/theme';
import * as Haptics from 'expo-haptics';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface Category {
  id: string;
  title: string;
  icon: string;
  color: string;
  locked?: boolean;
}

const CATEGORIES: Category[] = [
  // Most Popular
  { id: '1', title: 'Feeling Blessed', icon: '🙏', color: theme.colors.categoryColors.orange },
  { id: '2', title: 'Improve Self-Talk', icon: '💭', color: theme.colors.categoryColors.teal },
  { id: '3', title: 'Morning Motivation', icon: '🌅', color: theme.colors.categoryColors.blue },
  
  // For You
  { id: '4', title: 'Calm', icon: '🧘', color: theme.colors.categoryColors.coral },
  { id: '5', title: 'Best Friend', icon: '👫', color: theme.colors.categoryColors.pink },
  { id: '6', title: 'Personal Growth', icon: '🌱', color: theme.colors.categoryColors.green },
  
  // Personal Growth
  { id: '7', title: 'Self Love', icon: '💝', color: theme.colors.categoryColors.lavender },
  { id: '8', title: 'Be Strong', icon: '💪', color: theme.colors.categoryColors.orange },
  { id: '9', title: 'Positivity', icon: '✨', color: theme.colors.categoryColors.purple },
  
  // Relationships
  { id: '10', title: 'Social Anxiety', icon: '🤗', color: theme.colors.categoryColors.purple },
  { id: '11', title: 'Marriage', icon: '💕', color: theme.colors.categoryColors.teal },
  { id: '12', title: 'Unconditional Love', icon: '💖', color: theme.colors.categoryColors.pink },
  
  // Hard Times
  { id: '13', title: 'Death', icon: '🕊️', color: theme.colors.categoryColors.coral, locked: true },
  { id: '14', title: 'Toxic Relationship', icon: '💔', color: theme.colors.categoryColors.teal },
  { id: '15', title: 'Depression', icon: '🌙', color: theme.colors.categoryColors.blue },
  
  // Work & Productivity
  { id: '16', title: 'Success', icon: '🎯', color: theme.colors.categoryColors.orange },
  { id: '17', title: 'Business', icon: '💼', color: theme.colors.categoryColors.blue, locked: true },
  { id: '18', title: 'Leadership', icon: '👑', color: theme.colors.categoryColors.purple },
  
  // Inspiration
  { id: '19', title: 'Enjoy the Moment', icon: '🎉', color: theme.colors.categoryColors.coral },
  { id: '20', title: 'Beauty', icon: '🌸', color: theme.colors.categoryColors.pink, locked: true },
  { id: '21', title: 'Adventure', icon: '🗺️', color: theme.colors.categoryColors.green },
];

const CATEGORY_SECTIONS = [
  { title: 'Most Popular', categories: CATEGORIES.slice(0, 3) },
  { title: 'For You', categories: CATEGORIES.slice(3, 6) },
  { title: 'Personal Growth', categories: CATEGORIES.slice(6, 9) },
  { title: 'Relationships', categories: CATEGORIES.slice(9, 12) },
  { title: 'Hard Times', categories: CATEGORIES.slice(12, 15) },
  { title: 'Work & Productivity', categories: CATEGORIES.slice(15, 18) },
  { title: 'Inspiration', categories: CATEGORIES.slice(18, 21) },
];

interface CategoriesModalProps {
  visible: boolean;
  onClose: () => void;
  onCategorySelect: (category: Category) => void;
}

export const CategoriesModal: React.FC<CategoriesModalProps> = ({
  visible,
  onClose,
  onCategorySelect,
}) => {
  const slideAnim = useRef(new Animated.Value(screenHeight)).current;
  const backgroundOpacity = useRef(new Animated.Value(0)).current;
  const panY = useRef(new Animated.Value(0)).current;

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
      return;
    }
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onCategorySelect(category);
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
            {CATEGORY_SECTIONS.map((section, sectionIndex) => (
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
                        { transform: [{ scale: pressed ? 0.95 : 1 }] },
                        category.locked && styles.lockedCard
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
  lockedCard: {
    opacity: 0.7,
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