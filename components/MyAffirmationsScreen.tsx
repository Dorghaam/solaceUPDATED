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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { PanGestureHandler, State } from 'react-native-gesture-handler';

import { theme } from '../constants/theme';
import { useUserStore } from '../store/userStore';
import { loadAffirmationsFromDatabase, deleteAffirmationFromDatabase, UserAffirmation } from '../services/affirmationsService';
import { AddAffirmationScreen } from './AddAffirmationScreen';
import * as Haptics from 'expo-haptics';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface MyAffirmationsScreenProps {
  visible: boolean;
  onClose: () => void;
}

export const MyAffirmationsScreen: React.FC<MyAffirmationsScreenProps> = ({
  visible,
  onClose,
}) => {
  const slideAnim = useRef(new Animated.Value(screenHeight)).current;
  const backgroundOpacity = useRef(new Animated.Value(0)).current;
  const panY = useRef(new Animated.Value(0)).current;

  const [affirmations, setAffirmations] = useState<UserAffirmation[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [showAddAffirmation, setShowAddAffirmation] = useState<boolean>(false);
  const [editingAffirmationId, setEditingAffirmationId] = useState<string | undefined>(undefined);
  
  const { supabaseUser, favoriteQuoteIds, addFavorite, removeFavorite } = useUserStore();

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

      // Load affirmations when screen becomes visible
      if (supabaseUser?.id) {
        loadAffirmations();
      }
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
  }, [visible, supabaseUser?.id]);

  const loadAffirmations = async () => {
    try {
      if (!supabaseUser?.id) return;
      
      setIsLoading(true);
      const userAffirmations = await loadAffirmationsFromDatabase(supabaseUser.id);
      setAffirmations(userAffirmations);
    } catch (error) {
      console.error('Error loading affirmations:', error);
    } finally {
      setIsLoading(false);
    }
  };

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

  const handleAddNew = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setEditingAffirmationId(undefined);
    setShowAddAffirmation(true);
  };

  const handleToggleFavorite = (affirmation: UserAffirmation) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    const isCurrentlyFavorited = favoriteQuoteIds.includes(affirmation.id);
    
    if (isCurrentlyFavorited) {
      // Remove from favorites
      removeFavorite(affirmation.id);
    } else {
      // Add to favorites
      addFavorite(affirmation.id);
    }
  };

  const handleCloseAddAffirmation = () => {
    setShowAddAffirmation(false);
    setEditingAffirmationId(undefined);
  };

  const handleSaveAffirmation = () => {
    // Refresh the list when an affirmation is saved
    loadAffirmations();
  };

  const handleDelete = (affirmation: UserAffirmation) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    Alert.alert(
      'Delete Affirmation',
      'Are you sure you want to delete this affirmation? This action cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => confirmDelete(affirmation),
        },
      ]
    );
  };

  const confirmDelete = async (affirmation: UserAffirmation) => {
    try {
      if (!supabaseUser?.id) return;
      
      setIsDeleting(affirmation.id);
      await deleteAffirmationFromDatabase(supabaseUser.id, affirmation.id);
      
      // Remove from local state
      setAffirmations(prev => prev.filter(a => a.id !== affirmation.id));
      
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch (error) {
      console.error('Error deleting affirmation:', error);
      Alert.alert('Error', 'Failed to delete affirmation. Please try again.');
    } finally {
      setIsDeleting(null);
    }
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="create-outline" size={64} color={theme.colors.textSecondary} />
      <Text style={styles.emptyTitle}>No Affirmations Yet</Text>
      <Text style={styles.emptySubtitle}>
        Create your first personal affirmation to get started on your healing journey.
      </Text>
      <Pressable
        style={({ pressed }) => [
          styles.addButton,
          { 
            opacity: pressed ? 0.9 : 1,
            transform: [{ scale: pressed ? 0.98 : 1 }]
          }
        ]}
        onPress={handleAddNew}
      >
        <Ionicons name="add" size={20} color={theme.colors.white} />
        <Text style={styles.addButtonText}>Add Your First Affirmation</Text>
      </Pressable>
    </View>
  );

  const renderAffirmationCard = (affirmation: UserAffirmation) => (
    <View key={affirmation.id} style={styles.affirmationCard}>
      <View style={styles.cardContent}>
        <Text style={styles.affirmationText}>{affirmation.text}</Text>
      </View>
      
      <View style={styles.cardActions}>
        <Pressable
          style={({ pressed }) => [
            styles.actionButton,
            { opacity: pressed ? 0.7 : 1 }
          ]}
          onPress={() => handleToggleFavorite(affirmation)}
        >
          <Ionicons 
            name={favoriteQuoteIds.includes(affirmation.id) ? "heart" : "heart-outline"} 
            size={18} 
            color={theme.colors.primary} 
          />
        </Pressable>
        
        <Pressable
          style={({ pressed }) => [
            styles.actionButton,
            { opacity: pressed ? 0.7 : (isDeleting === affirmation.id ? 0.5 : 1) }
          ]}
          onPress={() => handleDelete(affirmation)}
          disabled={isDeleting === affirmation.id}
        >
          <Ionicons 
            name="trash-outline" 
            size={18} 
            color={isDeleting === affirmation.id ? theme.colors.textSecondary : theme.colors.accent} 
          />
        </Pressable>
      </View>
    </View>
  );

  if (!visible) return null;

  return (
    <View style={styles.overlay}>
      <Animated.View
        style={[
          styles.background,
          { opacity: backgroundOpacity }
        ]}
      >
        <Pressable 
          style={styles.backgroundTouchable} 
          onPress={handleClose}
        />
      </Animated.View>
      
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
                <Text style={styles.headerTitle}>My Affirmations</Text>
              </View>
            </View>

            {/* Content */}
            <ScrollView 
              style={styles.content}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.scrollContent}
            >
              {isLoading ? (
                <View style={styles.loadingContainer}>
                  <Text style={styles.loadingText}>Loading your affirmations...</Text>
                </View>
              ) : affirmations.length === 0 ? (
                renderEmptyState()
              ) : (
                <View style={styles.affirmationsContainer}>
                  {affirmations.map(renderAffirmationCard)}
                </View>
              )}
            </ScrollView>
            
            {/* Sticky Add Affirmations Button - Only shown when there are affirmations */}
            {affirmations.length > 0 && (
              <View style={styles.stickyButtonContainer}>
                <Pressable
                  style={({ pressed }) => [
                    styles.bottomAddButton,
                    { 
                      opacity: pressed ? 0.9 : 1,
                      transform: [{ scale: pressed ? 0.98 : 1 }]
                    }
                  ]}
                  onPress={handleAddNew}
                >
                  <Text style={styles.bottomAddButtonText}>Add affirmations</Text>
                </Pressable>
              </View>
            )}
          </LinearGradient>
        </Animated.View>
      </PanGestureHandler>
      
      {/* Add Affirmation Modal */}
      <AddAffirmationScreen
        visible={showAddAffirmation}
        onClose={handleCloseAddAffirmation}
        editingId={editingAffirmationId}
        onSave={handleSaveAffirmation}
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
    zIndex: 2000, // Higher than SettingsModal
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
    alignItems: 'center',
  },
  headerTitle: {
    fontFamily: theme.typography.fontFamily.semiBold,
    fontSize: 20,
    color: theme.colors.text,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: theme.spacing.l,
    flexGrow: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 200,
  },
  loadingText: {
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: theme.typography.fontSizes.m,
    color: theme.colors.textSecondary,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 400,
    paddingHorizontal: theme.spacing.xl,
  },
  emptyTitle: {
    fontFamily: theme.typography.fontFamily.semiBold,
    fontSize: 24,
    color: theme.colors.text,
    textAlign: 'center',
    marginTop: theme.spacing.l,
    marginBottom: theme.spacing.m,
  },
  emptySubtitle: {
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: 16,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: theme.spacing.xl,
  },
  addButton: {
    backgroundColor: theme.colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.m,
    paddingHorizontal: theme.spacing.l,
    borderRadius: theme.radii.l,
    gap: theme.spacing.s,
  },
  addButtonText: {
    fontFamily: theme.typography.fontFamily.semiBold,
    fontSize: theme.typography.fontSizes.m,
    color: theme.colors.white,
  },
  affirmationsContainer: {
    gap: theme.spacing.m,
  },
  affirmationCard: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.radii.l,
    padding: theme.spacing.m,
    flexDirection: 'row',
    shadowColor: theme.colors.black,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardContent: {
    flex: 1,
    marginRight: theme.spacing.m,
  },
  affirmationText: {
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: theme.typography.fontSizes.m,
    color: theme.colors.text,
    lineHeight: 22,
  },
  cardActions: {
    flexDirection: 'row',
    gap: theme.spacing.s,
  },
  actionButton: {
    padding: theme.spacing.s,
    borderRadius: theme.radii.m,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stickyButtonContainer: {
    paddingHorizontal: theme.spacing.l,
    paddingVertical: theme.spacing.l,
    paddingBottom: theme.spacing.xl,
    backgroundColor: 'transparent',
  },
  bottomAddButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.m,
    paddingHorizontal: theme.spacing.xl,
    borderRadius: theme.radii.l,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  bottomAddButtonText: {
    fontFamily: theme.typography.fontFamily.semiBold,
    fontSize: theme.typography.fontSizes.m,
    color: theme.colors.white,
  },
}); 