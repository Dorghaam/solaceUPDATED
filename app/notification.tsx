import { useEffect } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { useUserStore } from '../store/userStore';

export default function NotificationRoute() {
  const { id, quote } = useLocalSearchParams<{ id?: string; quote: string }>();
  const { setTargetQuote } = useUserStore();

  useEffect(() => {
    console.log('[Notification Route] Processing notification with id:', id, 'quote:', quote);
    
    if (quote && typeof quote === 'string') {
      try {
        // Decode the quote text from URL encoding
        const decodedQuote = decodeURIComponent(quote);
        console.log('[Notification Route] Setting target quote:', decodedQuote);
        
        setTargetQuote({
          id: id || 'notification-quote', // Use actual ID if available, fallback to notification-quote
          text: decodedQuote,
          category: 'notification'
        });
        
        // Navigate to main feed
        router.replace('/(main)');
      } catch (error) {
        console.error('[Notification Route] Error processing quote:', error);
        router.replace('/(main)');
      }
    } else {
      console.log('[Notification Route] No quote found, redirecting to main');
      router.replace('/(main)');
    }
  }, [id, quote, setTargetQuote]);

  return null; // This is a routing component, no UI needed
} 