import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Pressable,
  Dimensions,
  Animated,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { PanGestureHandler, State } from 'react-native-gesture-handler';
import { theme } from '../constants/theme';
import { useUserStore } from '../store/userStore';
import { supabase } from '../services/supabaseClient';
import * as Haptics from 'expo-haptics';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface FavoriteQuote {
  id: string;
  text: string;
  category?: string;
  created_at?: string;
}

interface FavoritesScreenProps {
  visible: boolean;
  onClose: () => void;
}

export const FavoritesScreen: React.FC<FavoritesScreenProps> = ({
  visible,
  onClose,
}) => {
  const slideAnim = useRef(new Animated.Value(screenHeight)).current;
  const backgroundOpacity = useRef(new Animated.Value(0)).current;
  const panY = useRef(new Animated.Value(0)).current;

  const { favoriteQuoteIds, removeFavorite } = useUserStore();
  const [favoriteQuotes, setFavoriteQuotes] = useState<FavoriteQuote[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch favorite quotes from Supabase
  const fetchFavoriteQuotes = useCallback(async () => {
    if (!favoriteQuoteIds.length) {
      setFavoriteQuotes([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('quotes')
        .select('id, text, category, created_at')
        .in('id', favoriteQuoteIds);

      if (error) {
        console.error('Error fetching favorite quotes:', error);
        setFavoriteQuotes([]);
      } else {
        // Sort quotes to maintain consistent order (most recently added first)
        const sortedQuotes = (data || []).sort((a, b) => {
          const aIndex = favoriteQuoteIds.indexOf(a.id);
          const bIndex = favoriteQuoteIds.indexOf(b.id);
          return aIndex - bIndex;
        });
        setFavoriteQuotes(sortedQuotes);
      }
    } catch (error) {
      console.error('Failed to fetch favorite quotes:', error);
      setFavoriteQuotes([]);
    } finally {
      setIsLoading(false);
    }
  }, [favoriteQuoteIds]);

  useEffect(() => {
    if (visible) {
      fetchFavoriteQuotes();
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
  }, [visible, fetchFavoriteQuotes]);

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

  const handleRemoveFavorite = (quoteId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    removeFavorite(quoteId);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Recently added';
    
    const date = new Date(dateString);
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    };
    
    return date.toLocaleDateString('en-US', options);
  };

  const renderFavoriteQuote = ({ item, index }: { item: FavoriteQuote; index: number }) => (
    <View style={styles.quoteCard}>
      <Text style={styles.quoteText}>{item.text}</Text>
      <View style={styles.quoteFooter}>
        <Pressable
          style={({ pressed }) => [
            styles.heartButton,
            { opacity: pressed ? 0.6 : 1, transform: [{ scale: pressed ? 0.95 : 1 }] }
          ]}
          onPress={() => handleRemoveFavorite(item.id)}
        >
          <Ionicons name="heart" size={24} color="#333" />
        </Pressable>
      </View>
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyStateContainer}>
      <View style={styles.emptyIconContainer}>
        <View style={styles.heartFrame}>
          <View style={styles.frameLines}>
            <View style={styles.frameLine} />
            <View style={styles.frameLine} />
            <View style={styles.frameLine} />
          </View>
          <Ionicons name="heart" size={40} color="#333" />
        </View>
      </View>
      
      <Text style={styles.emptyTitle}>Your Favorites List Is{'\n'}Empty</Text>
      <Text style={styles.emptySubtitle}>
        Mark the quotes that inspire you{'\n'}most they'll show up here for quick{'\n'}access anytime.
      </Text>
    </View>
  );

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
                <Text style={styles.headerTitle}>My Favorites</Text>
              </View>
            </View>

            {/* Content */}
            <View style={styles.content}>
              {isLoading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color="#333" />
                  <Text style={styles.loadingText}>Loading favorites...</Text>
                </View>
              ) : favoriteQuotes.length === 0 ? (
                renderEmptyState()
              ) : (
                <FlatList
                  data={favoriteQuotes}
                  renderItem={renderFavoriteQuote}
                  keyExtractor={(item) => item.id}
                  contentContainerStyle={styles.listContainer}
                  showsVerticalScrollIndicator={false}
                />
              )}
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
    paddingHorizontal: theme.spacing.m,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#333',
    marginTop: 16,
    fontWeight: '500',
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyIconContainer: {
    marginBottom: 40,
  },
  heartFrame: {
    width: 120,
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  frameLines: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    justifyContent: 'space-around',
    paddingVertical: 15,
  },
  frameLine: {
    height: 2,
    backgroundColor: '#333',
    width: '80%',
    alignSelf: 'center',
    opacity: 0.6,
  },
  emptyTitle: {
    fontSize: 26,
    fontFamily: theme.typography.fontFamily.semiBold,
    color: '#333',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 34,
  },
  emptySubtitle: {
    fontSize: 16,
    fontFamily: theme.typography.fontFamily.regular,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
  },
  listContainer: {
    paddingBottom: 100,
  },
  quoteCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
  },
  highlightedCard: {
    borderWidth: 2,
    borderColor: theme.colors.categoryColors.purple,
    backgroundColor: 'rgba(255, 255, 255, 1)',
  },
  quoteText: {
    fontSize: 16,
    fontFamily: theme.typography.fontFamily.regular,
    color: '#333',
    lineHeight: 24,
    marginBottom: 8,
  },
  quoteFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  quoteDate: {
    fontSize: 14,
    fontFamily: theme.typography.fontFamily.regular,
    color: '#999',
  },
  heartButton: {
    padding: 4,
  },
});
