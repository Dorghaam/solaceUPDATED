import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import * as StoreReview from 'react-native-store-review';

const REVIEW_STORAGE_KEYS = {
  APP_OPENS: 'solace_app_opens',
  LAST_REVIEW_PROMPT: 'solace_last_review_prompt',
  REVIEW_PROMPTED: 'solace_review_prompted',
  QUOTES_VIEWED: 'solace_quotes_viewed',
  FAVORITES_ADDED: 'solace_favorites_added',
};

// Configuration for when to show review prompt
const REVIEW_CONFIG = {
  MIN_APP_OPENS: 10,           // Minimum number of app opens
  MIN_QUOTES_VIEWED: 20,       // Minimum quotes viewed
  MIN_FAVORITES: 3,            // Minimum favorites added
  DAYS_BETWEEN_PROMPTS: 90,    // Days to wait between prompts
  MAX_PROMPTS: 3,              // Maximum number of times to prompt
};

interface ReviewMetrics {
  appOpens: number;
  quotesViewed: number;
  favoritesAdded: number;
  lastReviewPrompt: number | null;
  reviewPrompted: number;
}

class ReviewService {
  private async getMetrics(): Promise<ReviewMetrics> {
    try {
      const [appOpens, quotesViewed, favoritesAdded, lastReviewPrompt, reviewPrompted] = await Promise.all([
        AsyncStorage.getItem(REVIEW_STORAGE_KEYS.APP_OPENS),
        AsyncStorage.getItem(REVIEW_STORAGE_KEYS.QUOTES_VIEWED),
        AsyncStorage.getItem(REVIEW_STORAGE_KEYS.FAVORITES_ADDED),
        AsyncStorage.getItem(REVIEW_STORAGE_KEYS.LAST_REVIEW_PROMPT),
        AsyncStorage.getItem(REVIEW_STORAGE_KEYS.REVIEW_PROMPTED),
      ]);

      return {
        appOpens: parseInt(appOpens || '0', 10),
        quotesViewed: parseInt(quotesViewed || '0', 10),
        favoritesAdded: parseInt(favoritesAdded || '0', 10),
        lastReviewPrompt: lastReviewPrompt ? parseInt(lastReviewPrompt, 10) : null,
        reviewPrompted: parseInt(reviewPrompted || '0', 10),
      };
    } catch (error) {
      console.error('Error getting review metrics:', error);
      return {
        appOpens: 0,
        quotesViewed: 0,
        favoritesAdded: 0,
        lastReviewPrompt: null,
        reviewPrompted: 0,
      };
    }
  }

  private async updateMetric(key: string, value: number): Promise<void> {
    try {
      await AsyncStorage.setItem(key, value.toString());
    } catch (error) {
      console.error(`Error updating metric ${key}:`, error);
    }
  }

  private shouldShowReview(metrics: ReviewMetrics): boolean {
    // Don't show on Android (StoreReview is iOS only)
    if (Platform.OS !== 'ios') {
      return false;
    }

    // Check if we've already prompted too many times
    if (metrics.reviewPrompted >= REVIEW_CONFIG.MAX_PROMPTS) {
      return false;
    }

    // Check if enough time has passed since last prompt
    if (metrics.lastReviewPrompt) {
      const daysSinceLastPrompt = (Date.now() - metrics.lastReviewPrompt) / (1000 * 60 * 60 * 24);
      if (daysSinceLastPrompt < REVIEW_CONFIG.DAYS_BETWEEN_PROMPTS) {
        return false;
      }
    }

    // Check if user has engaged enough with the app
    const hasEnoughEngagement = 
      metrics.appOpens >= REVIEW_CONFIG.MIN_APP_OPENS &&
      metrics.quotesViewed >= REVIEW_CONFIG.MIN_QUOTES_VIEWED &&
      metrics.favoritesAdded >= REVIEW_CONFIG.MIN_FAVORITES;

    return hasEnoughEngagement;
  }

  // Call this when the app opens
  async trackAppOpen(): Promise<void> {
    try {
      const metrics = await this.getMetrics();
      const newAppOpens = metrics.appOpens + 1;
      await this.updateMetric(REVIEW_STORAGE_KEYS.APP_OPENS, newAppOpens);
      
      console.log(`📱 App opened ${newAppOpens} times`);
      
      // Check if we should show review prompt
      const updatedMetrics = { ...metrics, appOpens: newAppOpens };
      if (this.shouldShowReview(updatedMetrics)) {
        await this.showReviewPrompt();
      }
    } catch (error) {
      console.error('Error tracking app open:', error);
    }
  }

  // Call this when user views a quote
  async trackQuoteViewed(): Promise<void> {
    try {
      const metrics = await this.getMetrics();
      const newQuotesViewed = metrics.quotesViewed + 1;
      await this.updateMetric(REVIEW_STORAGE_KEYS.QUOTES_VIEWED, newQuotesViewed);
      
      // Check if we should show review prompt (but not too frequently)
      if (newQuotesViewed % 10 === 0) { // Check every 10 quotes
        const updatedMetrics = { ...metrics, quotesViewed: newQuotesViewed };
        if (this.shouldShowReview(updatedMetrics)) {
          await this.showReviewPrompt();
        }
      }
    } catch (error) {
      console.error('Error tracking quote viewed:', error);
    }
  }

  // Call this when user adds a favorite
  async trackFavoriteAdded(): Promise<void> {
    try {
      const metrics = await this.getMetrics();
      const newFavoritesAdded = metrics.favoritesAdded + 1;
      await this.updateMetric(REVIEW_STORAGE_KEYS.FAVORITES_ADDED, newFavoritesAdded);
      
      console.log(`❤️ User has ${newFavoritesAdded} favorites`);
      
      // Check if we should show review prompt
      const updatedMetrics = { ...metrics, favoritesAdded: newFavoritesAdded };
      if (this.shouldShowReview(updatedMetrics)) {
        await this.showReviewPrompt();
      }
    } catch (error) {
      console.error('Error tracking favorite added:', error);
    }
  }

  // Show the actual review prompt
  private async showReviewPrompt(): Promise<void> {
    try {
      if (Platform.OS !== 'ios') {
        console.log('Review prompts are only available on iOS');
        return;
      }

      console.log('🌟 Showing app review prompt');
      
      // Update metrics to track that we showed the prompt
      const metrics = await this.getMetrics();
      await Promise.all([
        this.updateMetric(REVIEW_STORAGE_KEYS.LAST_REVIEW_PROMPT, Date.now()),
        this.updateMetric(REVIEW_STORAGE_KEYS.REVIEW_PROMPTED, metrics.reviewPrompted + 1),
      ]);

      // Show the native iOS review prompt
      StoreReview.requestReview();
    } catch (error) {
      console.error('Error showing review prompt:', error);
    }
  }

  // Manual method to trigger review (for testing or manual triggers)
  async requestReview(): Promise<void> {
    if (Platform.OS === 'ios') {
      try {
        StoreReview.requestReview();
      } catch (error) {
        console.error('Error requesting review:', error);
      }
    } else {
      console.log('Review not available on this platform');
    }
  }

  // Get current metrics (for debugging)
  async getReviewMetrics(): Promise<ReviewMetrics> {
    return this.getMetrics();
  }

  // Reset metrics (for testing)
  async resetMetrics(): Promise<void> {
    try {
      await Promise.all([
        AsyncStorage.removeItem(REVIEW_STORAGE_KEYS.APP_OPENS),
        AsyncStorage.removeItem(REVIEW_STORAGE_KEYS.QUOTES_VIEWED),
        AsyncStorage.removeItem(REVIEW_STORAGE_KEYS.FAVORITES_ADDED),
        AsyncStorage.removeItem(REVIEW_STORAGE_KEYS.LAST_REVIEW_PROMPT),
        AsyncStorage.removeItem(REVIEW_STORAGE_KEYS.REVIEW_PROMPTED),
      ]);
      console.log('Review metrics reset');
    } catch (error) {
      console.error('Error resetting review metrics:', error);
    }
  }
}

export const reviewService = new ReviewService();
export default reviewService; 