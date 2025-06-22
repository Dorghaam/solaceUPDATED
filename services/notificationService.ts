import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';
import { Alert, Platform } from 'react-native';
import { supabase } from './supabaseClient';

// Configure notification handler (important for foreground notifications)
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true, // Consider making this a user setting
    shouldSetBadge: false, // Consider making this a user setting
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

const REMINDER_CHANNEL_ID = 'solaceDailyReminders';

// Function to fetch random quotes from Supabase for notifications
const fetchRandomQuotesForNotifications = async (count: number = 20, categories?: string[]) => {
  try {
    let query = supabase
      .from('quotes')
      .select('id, text, category'); // Include id for navigation

    // Filter by categories if provided
    if (categories && categories.length > 0) {
      query = query.in('category', categories);
    }

    const { data, error } = await query
      .limit(count);

    if (error) {
      console.error('Error fetching quotes for notifications:', error);
      return null;
    }

    // Shuffle the quotes for true randomization
    const shuffledData = data ? [...data].sort(() => Math.random() - 0.5) : null;
    return shuffledData;
  } catch (error) {
    console.error('Failed to fetch quotes for notifications:', error);
    return null;
  }
};

// Fallback messages if Supabase is unavailable - Breakup/Healing focused
const fallbackMessages = [
  "You are healing at your own pace, and that's perfectly okay.",
  "Every day you're becoming stronger and more resilient.",
  "Your worth isn't defined by your past relationships.",
  "You deserve love that lifts you up, starting with self-love.",
  "This difficult chapter is teaching you valuable lessons.",
  "You have the strength to rebuild and create a beautiful life.",
  "Your healing journey is unique and worthy of patience.",
  "Better days are coming. Trust the process of moving forward."
];

// Function to get a quote message based on index and date for variety
const getQuoteMessage = (quotes: any[], index: number) => {
  if (!quotes || quotes.length === 0) {
    // Use fallback messages if no quotes available
    const message = fallbackMessages[index % fallbackMessages.length];
    return { message, quote: null };
  }
  
  // Use current date to add variety - different quotes will be selected on different days
  const today = new Date();
  const dayOfYear = Math.floor((today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24));
  const seed = dayOfYear + index; // Combine day of year with reminder index
  
  const quoteIndex = seed % quotes.length;
  const quote = quotes[quoteIndex];
  
  // Format the quote cleanly for notifications - removed quotation marks
  let message = quote.text;
  return { message, quote };
};



// Call this once, e.g., when app starts or when notifications are first enabled
export const setupNotificationChannelsAsync = async () => {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(REMINDER_CHANNEL_ID, {
      name: 'Daily Affirmation Reminders',
      importance: Notifications.AndroidImportance.DEFAULT,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C', // Your app's primary color could go here
    });
    console.log('Notification channel set up (Android)');
  }
};

// Default reminder times for different frequencies
const defaultReminderTimes = {
  '1x': [
    { hour: 14, minute: 0 }, // 2:00 PM
  ],
  '3x': [
    { hour: 9, minute: 0 },  // 9:00 AM
    { hour: 14, minute: 0 }, // 2:00 PM
    { hour: 19, minute: 0 }, // 7:00 PM
  ],
  '5x': [
    { hour: 8, minute: 0 },  // 8:00 AM
    { hour: 11, minute: 0 }, // 11:00 AM
    { hour: 14, minute: 0 }, // 2:00 PM
    { hour: 17, minute: 0 }, // 5:00 PM
    { hour: 20, minute: 0 }, // 8:00 PM
  ],
  '10x': [
    { hour: 7, minute: 0 },  // 7:00 AM
    { hour: 9, minute: 0 },  // 9:00 AM
    { hour: 11, minute: 0 }, // 11:00 AM
    { hour: 13, minute: 0 }, // 1:00 PM
    { hour: 15, minute: 0 }, // 3:00 PM
    { hour: 17, minute: 0 }, // 5:00 PM
    { hour: 19, minute: 0 }, // 7:00 PM
    { hour: 20, minute: 30 }, // 8:30 PM
    { hour: 21, minute: 30 }, // 9:30 PM
    { hour: 22, minute: 30 }, // 10:30 PM
  ],
  'custom': [] as { hour: number; minute: number }[]
};

export const scheduleDailyAffirmationReminders = async (frequency: '1x' | '3x' | '5x' | '10x' | 'custom' = '3x', customTimes?: { hour: number; minute: number }[], categories?: string[]) => {
  await setupNotificationChannelsAsync(); // Ensure channel exists
  await Notifications.cancelAllScheduledNotificationsAsync(); // Clear existing Solace reminders first
  console.log(`Scheduling ${frequency} daily reminders...`);

  const reminderTimes = frequency === 'custom' && customTimes ? customTimes : defaultReminderTimes[frequency];

  // Fetch quotes from Supabase for notifications
  console.log('Fetching quotes from Supabase for notifications...');
  const quotes = await fetchRandomQuotesForNotifications(reminderTimes.length * 7, categories); // Get enough quotes for a week

  // Schedule regular frequency-based reminders
  const reminderPromises = reminderTimes.map(async (time, index) => {
    const identifier = `dailyAffirmationReminder-${index}`;
    try {
      const trigger: Notifications.DailyTriggerInput = {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: time.hour,
        minute: time.minute,
      };

      // Add channelId for Android
      if (Platform.OS === 'android') {
        (trigger as any).channelId = REMINDER_CHANNEL_ID;
      }

      // Get a quote message for this reminder
      const { message, quote } = getQuoteMessage(quotes || [], index);

      await Notifications.scheduleNotificationAsync({
        content: {
          title: "Solace",
          body: message,
          sound: 'default',
          data: quote ? { 
            type: 'quote',
            quoteId: quote.id,
            quoteText: quote.text,
            quoteCategory: quote.category 
          } : { type: 'fallback' },
        },
        trigger,
      });
      console.log(`Scheduled daily reminder for ${time.hour}:${time.minute < 10 ? '0' : ''}${time.minute} with quote: "${message.substring(0, 50)}..."`);
    } catch (e) {
      console.error(`Failed to schedule reminder ${identifier}`, e);
    }
  });

  // Wait for all notifications to be scheduled
  await Promise.all(reminderPromises);
  console.log(`All ${frequency} daily reminders scheduled successfully.`);
};

// Helper function to get the reminder times for a given frequency
export const getReminderTimesForFrequency = (frequency: '1x' | '3x' | '5x' | '10x' | 'custom') => {
  return defaultReminderTimes[frequency];
};

export const cancelAllScheduledAffirmationReminders = async () => {
  await Notifications.cancelAllScheduledNotificationsAsync();
  console.log('All scheduled affirmation reminders cancelled.');
};

// Function to set up notification response listener
export const setupNotificationResponseListener = (onNotificationResponse: (response: Notifications.NotificationResponse) => void) => {
  const subscription = Notifications.addNotificationResponseReceivedListener(onNotificationResponse);
  return subscription;
};

// You already have a version of this in onboarding/notifications.tsx
// This is a more generic one.
export async function getPushTokenAndPermissionsAsync(): Promise<string | null> {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.log('Failed to get push token for push notification (permission denied)!');
    Alert.alert('Permissions Needed', 'To receive reminders, please enable notifications for Solace in your device settings.');
    return null;
  }

  // For local notifications, we don't actually need a push token
  // Push tokens are only needed for remote push notifications
  // Since we're using local scheduled notifications, we can return a placeholder token
  // to indicate that permissions were granted
  
  // Only try to get push token if we have a valid project ID
  try {
    const projectId = Constants.expoConfig?.extra?.eas?.projectId;
    if (!projectId || projectId === "your-eas-project-id") {
      console.log('No valid EAS project ID found. Using local notifications only.');
      return 'local-notifications-enabled'; // Placeholder token to indicate permissions granted
    }
    
    const token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
    console.log('Expo Push Token obtained:', token);
    return token;
  } catch (e) {
    console.warn("Could not get push token, but local notifications will still work:", e);
    return 'local-notifications-enabled'; // Still allow local notifications
  }
} 