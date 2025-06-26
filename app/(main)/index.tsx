import React, { useCallback, useEffect, useState } from 'react';
import { Share } from 'react-native';
import { router } from 'expo-router';
import { useUserStore, BreakupCategory } from '../../store/userStore';
import { hapticService } from '../../services/hapticService';
import { reviewService } from '../../services/reviewService';
import { MainFeedScreen } from '../../components/MainFeedScreen';
import { useAuthGuard } from '../../utils';

// This screen now acts as a simple wrapper that renders our main UI component.
// All the UI logic is contained within MainFeedScreen.
export default function FeedPage() {
  // Authentication guard - redirects to onboarding if not authenticated
  const { shouldRender } = useAuthGuard();

  // Connect to the Zustand store to get state and actions
  const {
    quotes,
    isLoading,
    favoriteQuoteIds,
    fetchQuotes,
    addFavorite,
    removeFavorite,
    setActiveQuoteCategory,
    supabaseUser,
    hasCompletedOnboarding,
    subscriptionTier,
    updateStreakData,
  } = useUserStore();

  // Local state for UI interactions
  const [currentQuoteIndex, setCurrentQuoteIndex] = useState(0);
  const [likeCount, setLikeCount] = useState(favoriteQuoteIds.length);
  const [showCategories, setShowCategories] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  // Load quotes when the component mounts and track app usage
  useEffect(() => {
    fetchQuotes();
    // Track that user opened the main app for streak
    updateStreakData();
  }, [fetchQuotes, updateStreakData]);



  // Auto-refetch quotes when subscription tier changes to ensure premium content is unlocked
  useEffect(() => {
    if (subscriptionTier !== 'unknown') {
      console.log('[FeedPage] Subscription tier changed:', subscriptionTier);
      fetchQuotes();
    }
  }, [subscriptionTier, fetchQuotes]);

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

  const handleCategorySelect = useCallback((category: BreakupCategory | null) => {
    console.log('Category selected:', category ? category.label : 'View All');
    hapticService.selection();

    // 1. Update the active category in the store.
    setActiveQuoteCategory(category ? category.id : null);
    
    // 2. Close the categories modal.
    setShowCategories(false);

    // 3. Fetch quotes for the new category.
    setTimeout(() => {
      fetchQuotes();
    }, 250); // Delay allows modal to animate out smoothly

  }, [setActiveQuoteCategory, fetchQuotes]);

  const handleSettingSelect = useCallback((setting: any) => {
    console.log('Selected setting:', setting.title);
    hapticService.selection();
    
    // Handle specific setting selections
    if (setting.title === 'My Favorites') {
      setShowSettings(false);
      router.push('/(main)/favorites');
    } else {
      setShowSettings(false);
    }
    // Add other setting handlers here as needed
  }, []);

  const handlePremiumPress = useCallback(() => {
    hapticService.light();
    console.log('Premium button pressed');
    
    // If user is already premium, do nothing
    if (subscriptionTier === 'premium') {
      console.log('User is already premium, no action needed');
      return;
    }
    
    // Navigate to paywall for free users or unknown subscription status
    if (subscriptionTier === 'free') {
      console.log('User is free tier, showing paywall...');
      router.push('/(onboarding)/paywall');
    } else {
      console.log('Subscription status unknown, showing paywall...');
      router.push('/(onboarding)/paywall');
    }
  }, [subscriptionTier]);

  const handleBrushPress = useCallback(() => {
    hapticService.light();
    console.log('Brush button pressed');
    // Handle brush/theme functionality here
  }, []);

  // If user is not authenticated, don't render anything (useAuthGuard handles redirect)
  if (!shouldRender) {
    return null;
  }

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
      subscriptionTier={subscriptionTier}
    />
  );
} 