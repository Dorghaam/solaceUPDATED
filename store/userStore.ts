import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

// --- Types ---
export type FamiliarityAffirmations = 'new' | 'occasional' | 'regular' | null;
export type NotificationFrequency = '1x' | '3x' | '5x' | '10x' | null;
export type SubscriptionTier = 'unknown' | 'free' | 'premium'; // Added subscription tier with unknown state

export interface NotificationSettings {
  enabled: boolean;
  frequency: NotificationFrequency;
  // time?: string; // Consider if specific time selection is needed later
}

export interface DailyMood {
  emoji: string;
  mood: string;
  date: string; // YYYY-MM-DD
}

export interface TargetQuote {
  id: string;
  text: string;
  category?: string;
}

// NEW: Breakup-specific categories with premium flag
export interface BreakupCategory {
  id: string;
  label: string;
  premium: boolean; // True if this category requires a premium subscription
}

export const breakupInterestCategories: BreakupCategory[] = [
  { id: 'general_healing', label: 'General Healing', premium: false }, // Free
  { id: 'moving_on', label: 'Moving On', premium: false }, // Free
  { id: 'self_love_discovery', label: 'Self-Love & Discovery', premium: true },
  { id: 'coping_loneliness', label: 'Coping with Loneliness', premium: true },
  { id: 'rebuilding_confidence', label: 'Rebuilding Confidence', premium: true },
  { id: 'managing_anger_resentment', label: 'Managing Anger/Resentment', premium: true },
  { id: 'finding_closure', label: 'Finding Closure', premium: true },
  { id: 'hope_for_future', label: 'Hope for the Future', premium: true },
  { id: 'healing_from_betrayal', label: 'Healing from Betrayal (Cheating)', premium: true },
  { id: 'loss_of_partner_widow', label: 'Loss of a Partner (Widow/Widower)', premium: true },
  { id: 'navigating_divorce', label: 'Navigating Divorce', premium: true },
  { id: 'heartbreak_recovery', label: 'Heartbreak Recovery', premium: true },
  // Add more specific TikTok-friendly categories as needed
  { id: 'letting_go_of_ex', label: 'Letting Go of an Ex', premium: true },
  { id: 'embracing_single_life', label: 'Embracing Single Life', premium: true },
  { id: 'overcoming_codependency', label: 'Overcoming Codependency', premium: true },
];


export interface WidgetSettings {
  category: BreakupCategory['id'] | 'favorites' | 'all'; // Can be a specific category ID, 'favorites', or 'all'
  theme: WidgetTheme;
}

export type WidgetTheme = 'light' | 'dark' | 'pink_text_on_white' | 'dark_text_on_pink';

// --- State ---
interface UserState {
  // Onboarding & Profile
  userName: string | null;
  hasCompletedOnboarding: boolean;
  affirmationFamiliarity: FamiliarityAffirmations;
  interestCategories: string[]; // Stores IDs of selected BreakupCategory
  activeQuoteCategory: string | null; // ID of the currently active category for the feed

  // Authentication
  supabaseUser: any | null; // Consider using Supabase User type if available

  // App Features
  favoriteQuoteIds: string[];
  notificationSettings: NotificationSettings | null;
  pushToken: string | null;
  dailyMood: DailyMood | null;
  targetQuote: TargetQuote | null; // For handling notification navigations

  // Widget Settings
  widgetSettings: WidgetSettings;
  isWidgetCustomizing: boolean; // To control UI on widget config screen

  // Monetization
  subscriptionTier: SubscriptionTier; // Added subscriptionTier

  // Actions
  setUserName: (name: string) => void;
  setHasCompletedOnboarding: (status: boolean) => void;
  setAffirmationFamiliarity: (familiarity: FamiliarityAffirmations) => void;
  toggleInterestCategory: (categoryId: string) => void;
  setInterestCategories: (categoryIds: string[]) => void; // For setting all at once if needed
  setActiveQuoteCategory: (categoryId: string | null) => void;

  setSupabaseUser: (user: any | null) => void;

  addFavoriteQuoteId: (quoteId: string) => void;
  removeFavoriteQuoteId: (quoteId: string) => void;
  setNotificationSettings: (settings: Partial<NotificationSettings>) => void;
  setPushToken: (token: string | null) => void;
  setDailyMood: (mood: DailyMood) => void;
  setTargetQuote: (quote: TargetQuote | null) => void;
  clearTargetQuote: () => void;

  setWidgetSettings: (settings: Partial<WidgetSettings>) => void;
  setIsWidgetCustomizing: (isCustomizing: boolean) => void;

  setSubscriptionTier: (tier: SubscriptionTier) => void; // Added action for subscription tier

  resetState: () => void;
}

// --- Store ---
const initialState = {
  // Onboarding & Profile
  userName: null,
  hasCompletedOnboarding: false,
  affirmationFamiliarity: null,
  interestCategories: [breakupInterestCategories.find(cat => !cat.premium)?.id || 'general_healing'], // Default to the first free category
  activeQuoteCategory: null, // No active category by default, shows all (or all from selected free)

  // Auth
  supabaseUser: null,

  // App Features
  favoriteQuoteIds: [],
  notificationSettings: {
    enabled: false,
    frequency: '3x' as NotificationFrequency,
  },
  pushToken: null,
  dailyMood: null,
  targetQuote: null,

  // Widget Settings
  widgetSettings: {
    category: 'all', // Default to 'all' breakup quotes for widget
    theme: 'light' as WidgetTheme,
  },
  isWidgetCustomizing: false, // Default to not customizing

  // Monetization - SAFE: Start as unknown, will be determined by RevenueCat
  subscriptionTier: 'unknown' as SubscriptionTier, // Safe default until RC confirms
};

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      ...initialState,

      // --- Actions ---
      setUserName: (name) => set({ userName: name }),
      setHasCompletedOnboarding: (status) => set({ hasCompletedOnboarding: status }),
      setAffirmationFamiliarity: (familiarity) => set({ affirmationFamiliarity: familiarity }),
      toggleInterestCategory: (categoryId) =>
        set((state) => ({
          interestCategories: state.interestCategories.includes(categoryId)
            ? state.interestCategories.filter((id) => id !== categoryId)
            : [...state.interestCategories, categoryId],
        })),
      setInterestCategories: (categoryIds) => set({ interestCategories: categoryIds }),
      setActiveQuoteCategory: (categoryId) => set({ activeQuoteCategory: categoryId }),

      setSupabaseUser: (user) => set({ supabaseUser: user }),

      addFavoriteQuoteId: (quoteId) =>
        set((state) => ({
          favoriteQuoteIds: state.favoriteQuoteIds.includes(quoteId)
            ? state.favoriteQuoteIds
            : [...state.favoriteQuoteIds, quoteId],
        })),
      removeFavoriteQuoteId: (quoteId) =>
        set((state) => ({
          favoriteQuoteIds: state.favoriteQuoteIds.filter((id) => id !== quoteId),
        })),

      setNotificationSettings: (settingsUpdate) =>
        set((state) => ({
          notificationSettings: {
            ...(state.notificationSettings || { enabled: false, frequency: '3x' }), // Ensure defaults
            ...settingsUpdate,
          } as NotificationSettings, // Type assertion
        })),
      setPushToken: (token) => set({ pushToken: token }),
      setDailyMood: (mood) => set({ dailyMood: mood }),
      setTargetQuote: (quote) => set({ targetQuote: quote }),
      clearTargetQuote: () => set({ targetQuote: null }),

      setWidgetSettings: (settingsUpdate) =>
        set((state) => ({
          widgetSettings: {
            ...state.widgetSettings,
            ...settingsUpdate,
          },
        })),
      setIsWidgetCustomizing: (isCustomizing) => set({ isWidgetCustomizing: isCustomizing }),

      setSubscriptionTier: (tier) => set({ subscriptionTier: tier }), // Action to set tier

      resetState: () => {
        console.log('UserStore: Resetting state to initial values.');
        set(initialState);
      },
    }),
    {
      name: 'solace-user-storage',
      storage: createJSONStorage(() => AsyncStorage),
      // Partialize to persist only specific parts of the state
      partialize: (state) => ({
        userName: state.userName,
        hasCompletedOnboarding: state.hasCompletedOnboarding,
        affirmationFamiliarity: state.affirmationFamiliarity,
        interestCategories: state.interestCategories,
        // supabaseUser is handled by Supabase client persistence
        favoriteQuoteIds: state.favoriteQuoteIds,
        notificationSettings: state.notificationSettings,
        // pushToken is often re-fetched
        dailyMood: state.dailyMood,
        widgetSettings: state.widgetSettings,
        isWidgetCustomizing: state.isWidgetCustomizing,
        // REMOVED: subscriptionTier - Let RevenueCat be the single source of truth
        // activeQuoteCategory and targetQuote are typically transient
      }),
      // Custom hydration logic if needed
      onRehydrateStorage: () => async (state) => {
        console.log('UserStore: Hydration starts.');
        if (state) {
          // Ensure critical defaults if hydration somehow misses them
          state.widgetSettings = state.widgetSettings || initialState.widgetSettings;
          state.notificationSettings = state.notificationSettings || initialState.notificationSettings;
          state.interestCategories = state.interestCategories && state.interestCategories.length > 0 ? state.interestCategories : initialState.interestCategories;
          state.isWidgetCustomizing = state.isWidgetCustomizing !== undefined ? state.isWidgetCustomizing : initialState.isWidgetCustomizing;
          
          // ALWAYS start with 'unknown' - RevenueCat will update this
          state.subscriptionTier = 'unknown';
          console.log('UserStore: Subscription tier reset to unknown for RevenueCat to determine');
          
          console.log('UserStore: Hydration complete, state:', {
            userName: state.userName,
            hasCompletedOnboarding: state.hasCompletedOnboarding,
            subscriptionTier: state.subscriptionTier,
            interestCategories: state.interestCategories,
            isWidgetCustomizing: state.isWidgetCustomizing,
          });
        } else {
          console.log('UserStore: Hydration - no persisted state found, using initial state.');
        }
      },
    }
  )
);

// --- Hooks for easy access ---
// export const useUserName = () => useUserStore((state) => state.userName);
// export const useIsOnboardingComplete = () => useUserStore((state) => state.hasCompletedOnboarding);
// ... add more specific hooks if needed for performance critical components