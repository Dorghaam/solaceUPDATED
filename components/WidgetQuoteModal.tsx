import React, { useRef, useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Pressable,
  Dimensions,
  Animated,
  Share,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { LikeAnimation } from './LikeAnimation';
import { theme } from '../constants/theme';
import { hapticService } from '../services/hapticService';
import { useUserStore } from '../store/userStore';
import { lookupQuoteIdByText } from '../services/favoritesService';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface WidgetQuoteModalProps {
  visible: boolean;
  onClose: () => void;
}

export const WidgetQuoteModal: React.FC<WidgetQuoteModalProps> = ({
  visible,
  onClose,
}) => {
  const slideAnim = useRef(new Animated.Value(screenHeight)).current;
  const backgroundOpacity = useRef(new Animated.Value(0)).current;
  const [isLookingUpId, setIsLookingUpId] = useState(false);
  const [actualQuoteId, setActualQuoteId] = useState<string | null>(null);
  const [showLikeAnimation, setShowLikeAnimation] = useState(false);

  const { 
    targetQuote, 
    clearTargetQuote, 
    favoriteQuoteIds, 
    addFavorite, 
    removeFavorite
  } = useUserStore();

  // DEBUG: Log modal state changes
  useEffect(() => {
    console.log('[WidgetQuoteModal] Modal state - visible:', visible, 'targetQuote:', targetQuote);
  }, [visible, targetQuote]);

  // Look up the actual quote ID if we have a generated one
  useEffect(() => {
    if (targetQuote && visible) {
      const isGeneratedId = targetQuote.id.startsWith('widget-') || 
                           targetQuote.id.startsWith('legacy-') || 
                           targetQuote.id.startsWith('welcome-') || 
                           targetQuote.id.startsWith('empty-') ||
                           targetQuote.id.startsWith('notification-');
      
      if (isGeneratedId) {
        console.log('[WidgetQuoteModal] Looking up actual ID for generated ID:', targetQuote.id);
        setIsLookingUpId(true);
        
        lookupQuoteIdByText(targetQuote.text)
          .then(id => {
            if (id) {
              console.log('[WidgetQuoteModal] Found actual quote ID:', id);
              setActualQuoteId(id);
            } else {
              console.log('[WidgetQuoteModal] Could not find actual quote ID');
              setActualQuoteId(null);
            }
          })
          .catch(error => {
            console.error('[WidgetQuoteModal] Error looking up quote ID:', error);
            setActualQuoteId(null);
          })
          .finally(() => {
            setIsLookingUpId(false);
          });
      } else {
        // We already have the actual ID
        setActualQuoteId(targetQuote.id);
      }
    }
  }, [targetQuote, visible]);

  // Reset state when modal closes
  useEffect(() => {
    if (!visible) {
      setActualQuoteId(null);
      setIsLookingUpId(false);
    }
  }, [visible]);

  useEffect(() => {
    if (visible) {
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
    hapticService.light();
    
    // Start the slide-down animation first
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: screenHeight,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(backgroundOpacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // After animation completes, clean up and close
      clearTargetQuote();
      onClose();
    });
  };

  const handleShare = async () => {
    if (!targetQuote) return;
    
    hapticService.light();
    try {
      await Share.share({ 
        message: `"${targetQuote.text}" - via Solace App` 
      });
    } catch (error) {
      console.error('Share error:', error);
    }
  };

  const handleToggleFavorite = async () => {
    if (!targetQuote) return;
    
    hapticService.selection();
    const quoteId = actualQuoteId || targetQuote.id;
    
    if (!actualQuoteId) {
      console.log('[WidgetQuoteModal] No actual quote ID available, cannot favorite');
      return;
    }
    
    const isFavorite = favoriteQuoteIds.includes(quoteId);
    
    if (isFavorite) {
      removeFavorite(quoteId);
    } else {
      // Show animation when liking
      setShowLikeAnimation(true);
      addFavorite(quoteId);
    }
  };

  // Handle animation completion
  const handleAnimationComplete = () => {
    setShowLikeAnimation(false);
  };

  if (!visible) {
    return null;
  }

  if (!targetQuote) {
    return null;
  }

  // Determine if the quote is favorited
  const effectiveQuoteId = actualQuoteId || targetQuote.id;
  const isFavorite = actualQuoteId ? favoriteQuoteIds.includes(effectiveQuoteId) : false;
  const isLoading = targetQuote.text === 'Loading your widget quote...';
  const canFavorite = actualQuoteId !== null && !isLookingUpId;

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
      <Animated.View
        style={[
          styles.modal,
          { transform: [{ translateY: slideAnim }] }
        ]}
      >
        <LinearGradient
          colors={[theme.colors.lightPink.lightest, theme.colors.lightPink.light]}
          style={styles.modalContent}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.titleContainer}>
              <Ionicons name="heart" size={20} color={theme.colors.primary} />
              <Text style={styles.headerTitle}>
                {targetQuote.category === 'notification' ? 'From Your Reminder' : 'From Your Widget'}
              </Text>
            </View>
            <Pressable style={styles.closeButton} onPress={handleClose}>
              <Ionicons name="close" size={24} color={theme.colors.text} />
            </Pressable>
          </View>

          {/* Quote Display */}
          <View style={styles.quoteContainer}>
            {isLoading ? (
              <View style={styles.loadingContainer}>
                <Text style={styles.loadingText}>Loading your widget quote...</Text>
              </View>
            ) : (
              <Text style={styles.quoteText}>{targetQuote.text}</Text>
            )}
          </View>

          {/* Action Buttons */}
          {!isLoading && (
            <View style={styles.buttonContainer}>
              <Pressable
                style={({ pressed }) => [
                  styles.actionButton,
                  { opacity: (pressed || !canFavorite) ? 0.8 : 1 }
                ]}
                onPress={handleToggleFavorite}
                disabled={!canFavorite}
              >
                <Ionicons 
                  name={isFavorite ? "heart" : "heart-outline"} 
                  size={24} 
                  color="#000000" 
                />
                <Text style={[
                  styles.buttonText,
                  { color: isFavorite ? theme.colors.primary : theme.colors.textSecondary }
                ]}>
                  {isLookingUpId ? 'Loading...' : (isFavorite ? 'Favorited' : 'Favorite')}
                </Text>
              </Pressable>

              <Pressable
                style={({ pressed }) => [
                  styles.actionButton,
                  { opacity: pressed ? 0.8 : 1 }
                ]}
                onPress={handleShare}
              >
                <Ionicons name="share-outline" size={24} color="#000000" />
                <Text style={styles.buttonText}>Share</Text>
              </Pressable>
            </View>
          )}

          {/* Continue to App Button */}
          <Pressable
            style={({ pressed }) => [
              styles.continueButton,
              { opacity: pressed ? 0.9 : 1 }
            ]}
            onPress={handleClose}
          >
            <Text style={styles.continueButtonText}>Continue to App</Text>
          </Pressable>
        </LinearGradient>
      </Animated.View>

      {/* Like Animation */}
      <LikeAnimation
        visible={showLikeAnimation}
        onAnimationComplete={handleAnimationComplete}
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
    ...StyleSheet.absoluteFillObject,
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
    maxHeight: screenHeight * 0.8,
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 8,
    paddingBottom: 40,
    paddingHorizontal: 20,
    minHeight: 400,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
    marginBottom: 24,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
  },
  closeButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
  quoteContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 16,
    padding: 24,
    marginBottom: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  quoteText: {
    fontSize: 18,
    fontWeight: '500',
    color: theme.colors.text,
    textAlign: 'center',
    lineHeight: 26,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '400',
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 32,
  },
  actionButton: {
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    minWidth: 100,
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.textSecondary,
  },
  continueButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
}); 