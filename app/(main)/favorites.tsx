import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  FlatList,
  ActivityIndicator,
  Dimensions,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { theme } from '../../constants/theme';
import { useAuthGuard } from '../../utils';
import { useUserStore } from '../../store/userStore';
import { supabase } from '../../services/supabaseClient';
import { hapticService } from '../../services/hapticService';

const { height: screenHeight } = Dimensions.get('window');

interface FavoriteQuote {
  id: string;
  text: string;
  category?: string;
  created_at?: string;
}

export default function FavoritesScreen() {
  // Authentication guard - redirects to onboarding if not authenticated
  const { shouldRender } = useAuthGuard();

  const { favoriteQuoteIds, removeFavorite } = useUserStore();
  const [favoriteQuotes, setFavoriteQuotes] = useState<FavoriteQuote[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch favorite quotes from Supabase (both regular quotes and user affirmations)
  const fetchFavoriteQuotes = useCallback(async () => {
    if (!favoriteQuoteIds.length) {
      setFavoriteQuotes([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      
      // Fetch regular quotes
      const { data: quotesData, error: quotesError } = await supabase
        .from('quotes')
        .select('id, text, category, created_at')
        .in('id', favoriteQuoteIds);

      if (quotesError) {
        console.error('Error fetching favorite quotes:', quotesError);
      }

      // Fetch user affirmations  
      const { data: affirmationsData, error: affirmationsError } = await supabase
        .from('user_affirmations')
        .select('id, text, created_at')
        .in('id', favoriteQuoteIds);

      if (affirmationsError) {
        console.error('Error fetching favorite user affirmations:', affirmationsError);
      }

      // Combine results  
      const mappedAffirmations = (affirmationsData || []).map(item => ({
        id: item.id,
        text: item.text,
        category: 'My Affirmations',
        created_at: item.created_at
      }));
      
      const allFavorites = (quotesData || []).concat(mappedAffirmations);

      // Sort to maintain consistent order (most recently added first)
      const sortedFavorites = allFavorites.sort((a, b) => {
        const aIndex = favoriteQuoteIds.indexOf(a.id);
        const bIndex = favoriteQuoteIds.indexOf(b.id);
        return aIndex - bIndex;
      });

      setFavoriteQuotes(sortedFavorites);
    } catch (error) {
      console.error('Failed to fetch favorite quotes:', error);
      setFavoriteQuotes([]);
    } finally {
      setIsLoading(false);
    }
  }, [favoriteQuoteIds]);

  useEffect(() => {
    fetchFavoriteQuotes();
  }, [fetchFavoriteQuotes]);

  const handleGoBack = () => {
    hapticService.light();
    router.back();
  };

  const handleRemoveFavorite = (quoteId: string) => {
    hapticService.selection();
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
          <Ionicons name="heart" size={24} color="#000000" />
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
          <Ionicons name="heart" size={40} color="#000000" />
        </View>
      </View>
      
      <Text style={styles.emptyTitle}>Your Favorites List Is{'\n'}Empty</Text>
      <Text style={styles.emptySubtitle}>
        Mark the quotes that inspire you{'\n'}most they'll show up here for quick{'\n'}access anytime.
      </Text>
    </View>
  );

  // If user is not authenticated, don't render anything (useAuthGuard handles redirect)
  if (!shouldRender) {
    return null;
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
      <LinearGradient
        colors={[
          theme.colors.lightPink.lightest,
          theme.colors.lightPink.light,
          theme.colors.lightPink.medium,
          theme.colors.lightPink.dark
        ]}
        style={styles.background}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
      >
        {/* Header */}
        <View style={styles.header}>
          <Pressable
            style={({ pressed }) => [
              styles.backButton,
              { opacity: pressed ? 0.6 : 1, transform: [{ scale: pressed ? 0.95 : 1 }] }
            ]}
            onPress={handleGoBack}
          >
            <Ionicons name="chevron-back" size={24} color={theme.colors.text} />
          </Pressable>
          <Text style={styles.headerTitle}>My Favorites</Text>
          <View style={styles.headerPlaceholder} />
        </View>

        {/* Content */}
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
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.lightPink.lightest,
  },
  background: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 22,
    fontFamily: theme.typography.fontFamily.semiBold,
    color: theme.colors.text,
  },
  headerPlaceholder: {
    width: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: theme.colors.text,
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
    backgroundColor: theme.colors.text,
    width: '80%',
    alignSelf: 'center',
    opacity: 0.6,
  },
  emptyTitle: {
    fontSize: 26,
    fontFamily: theme.typography.fontFamily.semiBold,
    color: theme.colors.text,
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
    paddingHorizontal: 20,
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
    color: theme.colors.text,
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