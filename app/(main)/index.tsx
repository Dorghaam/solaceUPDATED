import React, { useCallback, useEffect, useState } from 'react';
import { Share } from 'react-native';
import { router } from 'expo-router';
import { useUserStore } from '../../store/userStore';
import { hapticService } from '../../services/hapticService';
import { reviewService } from '../../services/reviewService';
import { MainFeedScreen } from '../../components/MainFeedScreen';

// This screen now acts as a simple wrapper that renders our main UI component.
// All the UI logic is contained within MainFeedScreen.
export default function FeedPage() {
  // Connect to the Zustand store to get state and actions
  const {
    quotes,
    isLoading,
    favoriteQuoteIds,
    fetchQuotes,
    addFavorite,
    removeFavorite,
  } = useUserStore();

  // Local state for UI interactions
  const [currentQuoteIndex, setCurrentQuoteIndex] = useState(0);
  const [likeCount, setLikeCount] = useState(favoriteQuoteIds.length);
  const [showCategories, setShowCategories] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  // Load quotes when the component mounts
  useEffect(() => {
    fetchQuotes();
  }, [fetchQuotes]);

  // Update like count when favorites change
  useEffect(() => {
    setLikeCount(favoriteQuoteIds.length);
  }, [favoriteQuoteIds]);

  const isFavorite = useCallback((id: string) => favoriteQuoteIds.includes(id), [favoriteQuoteIds]);

  const handleToggleFavorite = useCallback((quote: { id: string; text: string }) => {
    hapticService.selection();
    if (isFavorite(quote.id)) {
      removeFavorite(quote.id);
    } else {
      addFavorite(quote.id);
      reviewService.trackFavoriteAdded();
    }
  }, [isFavorite, addFavorite, removeFavorite]);

  const handleShare = useCallback(async (quote: { id: string; text: string }) => {
    hapticService.light();
    try {
      await Share.share({ message: `"${quote.text}" - via Solace App` });
    } catch (error) {
      console.error('Share error:', error);
    }
  }, []);

  const handleNextQuote = useCallback(() => {
    hapticService.light();
    if (quotes.length > 0) {
      setCurrentQuoteIndex((prevIndex) => (prevIndex + 1) % quotes.length);
    }
    reviewService.trackQuoteViewed();
  }, [quotes.length]);

  const handlePreviousQuote = useCallback(() => {
    hapticService.light();
    if (quotes.length > 0) {
      setCurrentQuoteIndex((prevIndex) => (prevIndex - 1 + quotes.length) % quotes.length);
    }
    reviewService.trackQuoteViewed();
  }, [quotes.length]);

  const handleGoToFavorites = useCallback(() => {
    hapticService.light();
    router.push('/(main)/favorites');
  }, []);

  const handleGoToSettings = useCallback(() => {
    hapticService.light();  
    router.push('/(main)/settings');
  }, []);

  // Modal handlers
  const handleShowCategories = useCallback(() => {
    hapticService.light();
    setShowCategories(true);
  }, []);

  const handleShowSettings = useCallback(() => {
    hapticService.light();
    setShowSettings(true);
  }, []);

  const handleCloseCategories = useCallback(() => {
    hapticService.light();
    setShowCategories(false);
  }, []);

  const handleCloseSettings = useCallback(() => {
    hapticService.light();
    setShowSettings(false);
  }, []);

  const handleCategorySelect = useCallback((category: any) => {
    console.log('Selected category:', category.title);
    hapticService.selection();
    setShowCategories(false);
    // Handle category selection logic here - could update activeQuoteCategory in store
  }, []);

  const handleSettingSelect = useCallback((setting: any) => {
    console.log('Selected setting:', setting.title);
    hapticService.selection();
    setShowSettings(false);
    // Handle setting selection logic here
  }, []);

  const handlePremiumPress = useCallback(() => {
    hapticService.light();
    console.log('Premium button pressed');
    // Handle premium upgrade logic here
  }, []);

  const handleBrushPress = useCallback(() => {
    hapticService.light();
    console.log('Brush button pressed');
    // Handle brush/theme functionality here
  }, []);

  return (
    <MainFeedScreen
      quotes={quotes}
      isLoading={isLoading}
      isFavorite={isFavorite}
      onToggleFavorite={handleToggleFavorite}
      onShare={handleShare}
      onNextQuote={handleNextQuote}
      onPreviousQuote={handlePreviousQuote}
      onGoToFavorites={handleGoToFavorites}
      onGoToSettings={handleGoToSettings}
      likeCount={likeCount}
      currentQuoteIndex={currentQuoteIndex}
      showCategories={showCategories}
      showSettings={showSettings}
      onShowCategories={handleShowCategories}
      onShowSettings={handleShowSettings}
      onCloseCategories={handleCloseCategories}
      onCloseSettings={handleCloseSettings}
      onCategorySelect={handleCategorySelect}
      onSettingSelect={handleSettingSelect}
      onPremiumPress={handlePremiumPress}
      onBrushPress={handleBrushPress}
    />
  );
} 