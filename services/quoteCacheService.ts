import AsyncStorage from '@react-native-async-storage/async-storage';
import { Quote } from '../store/userStore';

interface CachedQuoteData {
  quotes: Quote[];
  timestamp: number;
  subscriptionTier: string;
  categories: string[];
  activeCategory: string | null; // Track which specific category was cached
}

const CACHE_KEY = 'cached_quotes';
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
const MAX_CACHED_QUOTES = 100; // Limit cache size

class QuoteCacheService {
  /**
   * Cache quotes after successful fetch
   */
  async cacheQuotes(
    quotes: Quote[], 
    subscriptionTier: string, 
    activeCategories: string[],
    activeCategory: string | null = null
  ): Promise<void> {
    try {
      // Only cache a reasonable amount to save storage
      const quotesToCache = quotes.slice(0, MAX_CACHED_QUOTES);
      
      const cacheData: CachedQuoteData = {
        quotes: quotesToCache,
        timestamp: Date.now(),
        subscriptionTier,
        categories: activeCategories,
        activeCategory,
      };

      await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
      console.log(`[QuoteCache] Cached ${quotesToCache.length} quotes for offline use`);
    } catch (error) {
      console.error('[QuoteCache] Failed to cache quotes:', error);
    }
  }

  /**
   * Get cached quotes for offline use
   */
  async getCachedQuotes(
    currentSubscriptionTier: string,
    activeCategories: string[],
    currentActiveCategory: string | null = null
  ): Promise<Quote[] | null> {
    try {
      const cachedData = await AsyncStorage.getItem(CACHE_KEY);
      
      if (!cachedData) {
        console.log('[QuoteCache] No cached quotes found');
        return null;
      }

      const parsed: CachedQuoteData = JSON.parse(cachedData);
      
      // Check if cache is expired
      if (Date.now() - parsed.timestamp > CACHE_DURATION) {
        console.log('[QuoteCache] Cache expired, removing old data');
        await this.clearCache();
        return null;
      }

      // Check if the cached data matches the current viewing context
      if (currentActiveCategory && parsed.activeCategory !== currentActiveCategory) {
        console.log(`[QuoteCache] Cache mismatch: cached for '${parsed.activeCategory}', requested '${currentActiveCategory}'`);
        return null; // Cache doesn't match current category selection
      }

      // Filter quotes based on current subscription tier and categories
      let filteredQuotes = parsed.quotes;
      
      // If user's subscription tier has changed, we might need to filter out premium quotes
      if (currentSubscriptionTier === 'free' && parsed.subscriptionTier === 'premium') {
        // Filter out premium categories if user is now free
        // This requires category metadata - for now, return all cached quotes
        console.log('[QuoteCache] Subscription tier downgraded, but returning cached quotes');
      }

      console.log(`[QuoteCache] Retrieved ${filteredQuotes.length} cached quotes for context: ${currentActiveCategory || 'general'}`);
      return filteredQuotes;
    } catch (error) {
      console.error('[QuoteCache] Failed to retrieve cached quotes:', error);
      return null;
    }
  }

  /**
   * Check if we have valid cached quotes
   */
  async hasCachedQuotes(): Promise<boolean> {
    try {
      const cachedData = await AsyncStorage.getItem(CACHE_KEY);
      if (!cachedData) return false;

      const parsed: CachedQuoteData = JSON.parse(cachedData);
      const isExpired = Date.now() - parsed.timestamp > CACHE_DURATION;
      
      return !isExpired && parsed.quotes.length > 0;
    } catch (error) {
      return false;
    }
  }

  /**
   * Clear the cache
   */
  async clearCache(): Promise<void> {
    try {
      await AsyncStorage.removeItem(CACHE_KEY);
      console.log('[QuoteCache] Cache cleared');
    } catch (error) {
      console.error('[QuoteCache] Failed to clear cache:', error);
    }
  }

  /**
   * Get cache info for debugging
   */
  async getCacheInfo(): Promise<{ size: number; age: number; tier: string } | null> {
    try {
      const cachedData = await AsyncStorage.getItem(CACHE_KEY);
      if (!cachedData) return null;

      const parsed: CachedQuoteData = JSON.parse(cachedData);
      return {
        size: parsed.quotes.length,
        age: Date.now() - parsed.timestamp,
        tier: parsed.subscriptionTier
      };
    } catch (error) {
      return null;
    }
  }

  /**
   * Get cache statistics in human-readable format
   */
  async getCacheStats(): Promise<string> {
    try {
      const info = await this.getCacheInfo();
      if (!info) {
        return 'No cached quotes available';
      }

      const ageHours = Math.floor(info.age / (1000 * 60 * 60));
      const ageDays = Math.floor(ageHours / 24);
      
      let ageText = '';
      if (ageDays > 0) {
        ageText = `${ageDays} day${ageDays > 1 ? 's' : ''} ago`;
      } else {
        ageText = `${ageHours} hour${ageHours > 1 ? 's' : ''} ago`;
      }

      return `${info.size} quotes cached ${ageText} (${info.tier} tier)`;
    } catch (error) {
      return 'Error reading cache info';
    }
  }
}

export const quoteCacheService = new QuoteCacheService(); 