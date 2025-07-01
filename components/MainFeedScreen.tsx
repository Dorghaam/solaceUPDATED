import React, { useRef, useState, useCallback, useMemo } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Pressable,
  Dimensions,
  StatusBar,
  Animated,
  ActivityIndicator,
} from 'react-native';
import { PanGestureHandler, GestureHandlerRootView, State } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { CategoriesModal } from './CategoriesModal';
import { SettingsModal } from './SettingsModal';
import { theme } from '../constants/theme';
import { SubscriptionTier } from '../store/userStore';
import { getResponsiveDimensions, getResponsiveFontSize } from '../utils/responsive';
import { useUserStore } from '../store/userStore';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const SWIPE_THRESHOLD = 120; // Minimum swipe distance to trigger quote change

// Define the shape of a single quote
interface Quote {
  id: string;
  text: string;
  category?: string;
}

// Define the props this component expects to receive
interface MainFeedScreenProps {
  quotes: Quote[];
  isLoading: boolean;
  isFavorite: (id: string) => boolean;
  onToggleFavorite: (quote: Quote) => void;
  onShare: (quote: Quote) => void;
  onNextQuote: () => void;
  onPreviousQuote: () => void;
  onGoToFavorites: () => void;
  onGoToSettings: () => void;
  likeCount: number;
  currentQuoteIndex: number;
  // Modal state props
  showCategories: boolean;
  showSettings: boolean;
  onShowCategories: () => void;
  onShowSettings: () => void;
  onCloseCategories: () => void;
  onCloseSettings: () => void;
  onCategorySelect: (category: any) => void;
  onSettingSelect: (setting: any) => void;
  // Additional button handlers
  onPremiumPress: () => void;
  onBrushPress: () => void;
  // Subscription state
  subscriptionTier: SubscriptionTier;
}

export const MainFeedScreen: React.FC<MainFeedScreenProps> = ({
  quotes,
  isLoading,
  isFavorite,
  onToggleFavorite,
  onShare,
  onNextQuote,
  onPreviousQuote,
  onGoToFavorites,
  onGoToSettings,
  likeCount,
  currentQuoteIndex,
  showCategories,
  showSettings,
  onShowCategories,
  onShowSettings,
  onCloseCategories,
  onCloseSettings,
  onCategorySelect,
  onSettingSelect,
  onPremiumPress,
  onBrushPress,
  subscriptionTier,
}) => {
  const translateY = useRef(new Animated.Value(0)).current;
  const isAnimating = useRef(false);
  const responsiveDimensions = getResponsiveDimensions();
  const [refreshing, setRefreshing] = useState(false);
  const { fetchQuotes } = useUserStore();

  // ✅ Memoize current quote to prevent unnecessary re-renders
  const currentQuote = useMemo(() => {
    return quotes[currentQuoteIndex] || quotes[0];
  }, [quotes, currentQuoteIndex]);



  // Helper function to check if a quote is a placeholder
  const isPlaceholderQuote = useCallback((quoteId: string) => {
    return ['no-favorites', 'no-quotes', 'error'].includes(quoteId);
  }, []);

  // Enhanced gesture handler for peek behavior
  const handleGestureEvent = Animated.event(
    [{ nativeEvent: { translationY: translateY } }],
    { 
      useNativeDriver: true,
      listener: (event: any) => {
        // Optional: Add haptic feedback during swipe
        // hapticService.light();
      }
    }
  );

  const handleGestureStateChange = (event: any) => {
    if (event.nativeEvent.state === State.END) {
      const { translationY, velocityY } = event.nativeEvent;
      
      if (isAnimating.current) return;
      
      // Determine if swipe is significant enough to change quotes
      const shouldChangeQuote = Math.abs(translationY) > SWIPE_THRESHOLD || Math.abs(velocityY) > 800;
      
      if (shouldChangeQuote) {
        if (translationY < 0) {
          // Swipe up - next quote
          handleNextQuote();
        } else {
          // Swipe down - previous quote
          handlePreviousQuote();
        }
      } else {
        // Return to original position with smooth animation
        Animated.spring(translateY, {
          toValue: 0,
          tension: 300,
          friction: 30,
          useNativeDriver: true,
        }).start();
      }
    }
  };

  const handleNextQuote = () => {
    if (isAnimating.current) return;
    isAnimating.current = true;
    
    // Smooth transition to next quote
    Animated.timing(translateY, {
      toValue: -screenHeight * 0.6, // Don't go all the way off screen
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      onNextQuote();
      
      // Bring new quote from bottom with smooth animation
      translateY.setValue(screenHeight * 0.6);
      Animated.spring(translateY, {
        toValue: 0,
        tension: 300,
        friction: 30,
        useNativeDriver: true,
      }).start(() => {
        isAnimating.current = false;
      });
    });
  };

  const handlePreviousQuote = () => {
    if (isAnimating.current) return;
    isAnimating.current = true;
    
    // Smooth transition to previous quote
    Animated.timing(translateY, {
      toValue: screenHeight * 0.6, // Don't go all the way off screen
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      onPreviousQuote();
      
      // Bring new quote from top with smooth animation
      translateY.setValue(-screenHeight * 0.6);
      Animated.spring(translateY, {
        toValue: 0,
        tension: 300,
        friction: 30,
        useNativeDriver: true,
      }).start(() => {
        isAnimating.current = false;
      });
    });
  };



  // ✅ HANDLE THREE SUBSCRIPTION STATES PROPERLY
  if (subscriptionTier === 'unknown') {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Checking subscription status...</Text>
      </View>
    );
  }

  const isPremium = subscriptionTier === 'premium';

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await fetchQuotes();
    } catch (error) {
      console.error('Error refreshing quotes:', error);
    } finally {
      setRefreshing(false);
    }
  }, [fetchQuotes]);

  // Loading state
  if (isLoading && quotes.length === 0) {
    return (
      <GestureHandlerRootView style={styles.fullScreenContainer}>
        <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
        <LinearGradient
          colors={[theme.colors.lightPink.lightest, theme.colors.lightPink.light, theme.colors.lightPink.medium, theme.colors.lightPink.dark]}
          style={styles.fullScreenBackground}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
        >
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={theme.colors.text} />
            <Text style={styles.loadingText}>Loading quotes...</Text>
          </View>
        </LinearGradient>
      </GestureHandlerRootView>
    );
  }

  // No quotes state
  if (quotes.length === 0) {
    return (
      <GestureHandlerRootView style={styles.fullScreenContainer}>
        <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
        <LinearGradient
          colors={[theme.colors.lightPink.lightest, theme.colors.lightPink.light, theme.colors.lightPink.medium, theme.colors.lightPink.dark]}
          style={styles.fullScreenBackground}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
        >
          <View style={styles.centerContainer}>
            <Text style={styles.quoteText}>No quotes found.</Text>
          </View>
        </LinearGradient>
      </GestureHandlerRootView>
    );
  }

  return (
    <GestureHandlerRootView style={styles.fullScreenContainer}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
      
      <LinearGradient
        colors={[theme.colors.lightPink.lightest, theme.colors.lightPink.light, theme.colors.lightPink.medium, theme.colors.lightPink.dark]}
        style={styles.fullScreenBackground}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
      >
        {/* Top Bar - Static */}
        <View style={styles.topBar}>
          <View style={styles.topLeftSpacer} />
          

          
          <View style={styles.topRightButtons}>
            <Pressable 
              style={({ pressed }) => [
                styles.topButton,
                subscriptionTier === 'premium' && styles.premiumButton,
                { opacity: pressed ? 0.7 : 1 }
              ]} 
              onPress={onPremiumPress}
            >
              {subscriptionTier === 'premium' && (
                <Text style={styles.premiumButtonText}>Premium</Text>
              )}
              <Ionicons 
                name={subscriptionTier === 'premium' ? "diamond" : "diamond-outline"} 
                size={20} 
                color={subscriptionTier === 'premium' ? theme.colors.white : theme.colors.text} 
              />
            </Pressable>
          </View>
        </View>

        {/* Enhanced Swipeable Quote Section */}
        <View style={styles.quoteContainer}>
          <PanGestureHandler 
            onGestureEvent={handleGestureEvent}
            onHandlerStateChange={handleGestureStateChange}
          >
            <Animated.View 
              style={[
                styles.quoteSection,
                { transform: [{ translateY }] }
              ]}
            >
              <Text style={styles.quoteText}>{currentQuote.text}</Text>
              
              {/* Action Buttons - Move with the quote */}
              <View style={styles.actionButtons}>
                <Pressable 
                  style={({ pressed }) => {
                    const isPlaceholder = isPlaceholderQuote(currentQuote.id);
                    return [
                      styles.actionButton,
                      { 
                        opacity: isPlaceholder ? 0.3 : (pressed ? 0.6 : 1), 
                        transform: [{ scale: pressed && !isPlaceholder ? 0.95 : 1 }] 
                      }
                    ];
                  }}
                  onPress={() => {
                    if (!isPlaceholderQuote(currentQuote.id)) {
                      onShare(currentQuote);
                    }
                  }}
                  disabled={isPlaceholderQuote(currentQuote.id)}
                >
                  <Ionicons name="share-outline" size={32} color="#333" />
                </Pressable>
                <Pressable 
                  style={({ pressed }) => {
                    const isPlaceholder = isPlaceholderQuote(currentQuote.id);
                    return [
                      styles.actionButton,
                      { 
                        opacity: isPlaceholder ? 0.3 : (pressed ? 0.6 : 1), 
                        transform: [{ scale: pressed && !isPlaceholder ? 0.95 : 1 }] 
                      }
                    ];
                  }}
                  onPress={() => {
                    if (!isPlaceholderQuote(currentQuote.id)) {
                      onToggleFavorite(currentQuote);
                    }
                  }}
                  disabled={isPlaceholderQuote(currentQuote.id)}
                >
                  <Ionicons 
                    name={isFavorite(currentQuote.id) ? "heart" : "heart-outline"} 
                    size={32} 
                    color="#333" 
                  />
                </Pressable>
              </View>
            </Animated.View>
          </PanGestureHandler>
        </View>

        {/* Bottom Navigation - Static - Hide when categories or settings modal is open */}
        <View style={[
          styles.bottomNav,
          { opacity: (showCategories || showSettings) ? 0 : 1 }
        ]}>
          <Pressable 
            style={({ pressed }) => [
              styles.bottomButton,
              { opacity: pressed ? 0.7 : 1, transform: [{ scale: pressed ? 0.95 : 1 }] }
            ]} 
            onPress={onShowCategories}
            disabled={showCategories || showSettings}
          >
            <Ionicons name="grid-outline" size={24} color={theme.colors.text} />
          </Pressable>
          <View style={styles.invisibleButton} />
          <Pressable 
            style={({ pressed }) => [
              styles.bottomButton,
              { opacity: pressed ? 0.7 : 1, transform: [{ scale: pressed ? 0.95 : 1 }] }
            ]} 
            onPress={onShowSettings}
            disabled={showCategories || showSettings}
          >
            <Ionicons name="person-outline" size={24} color={theme.colors.text} />
          </Pressable>
        </View>
      </LinearGradient>

      {/* Categories Modal */}
      <CategoriesModal
        visible={showCategories}
        onClose={onCloseCategories}
        onCategorySelect={onCategorySelect}
      />

      {/* Settings Modal */}
      <SettingsModal
        visible={showSettings}
        onClose={onCloseSettings}
        onSettingSelect={onSettingSelect}
      />
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  fullScreenContainer: {
    flex: 1,
    backgroundColor: '#FFF5F7', // Fallback background color
  },
  fullScreenBackground: {
    flex: 1,
    width: screenWidth,
    height: screenHeight,
    paddingTop: StatusBar.currentHeight || 0, // Android padding
  },
  container: {
    flex: 1,
  },
  background: {
    flex: 1,
    width: screenWidth,
    height: screenHeight,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },

  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  heartCounter: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 8,
  },
  counterText: {
    fontSize: getResponsiveFontSize(16),
    fontWeight: '600',
    color: theme.colors.text,
  },
  topRightButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  topButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  premiumButton: {
    backgroundColor: theme.colors.primary,
    borderWidth: 0,
    flexDirection: 'row',
    paddingHorizontal: 16,
    width: 'auto',
    minWidth: 100,
  },
  quoteContainer: {
    flex: 1,
    position: 'relative',
    overflow: 'hidden',
    marginTop: 20, // Create invisible wall below premium button
    marginBottom: 20, // Create invisible wall above bottom nav buttons
  },
  quoteSection: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    maxWidth: 800, // Constrain width on larger screens
    alignSelf: 'center',
  },

  quoteText: {
    fontSize: getResponsiveFontSize(32),
    fontWeight: '400',
    color: theme.colors.text,
    textAlign: 'center',
    lineHeight: getResponsiveFontSize(42),
    marginBottom: 60,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 60,
    marginTop: 40,
  },
  actionButton: {
    padding: 16,
  },
  bottomNav: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingBottom: 40,
  },
  bottomButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  topLeftSpacer: {
    width: 44,
    height: 44,
  },
  invisibleButton: {
    width: 50,
    height: 50,
    backgroundColor: 'transparent',
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: getResponsiveFontSize(16),
    color: theme.colors.text,
    textAlign: 'center',
  },
  premiumButtonText: {
    fontSize: getResponsiveFontSize(14),
    fontWeight: '500',
    color: theme.colors.white,
    marginRight: 8,
  },
}); 