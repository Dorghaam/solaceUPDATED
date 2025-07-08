import { useEffect } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { useUserStore } from '../store/userStore';
import { View } from 'react-native';

export default function WidgetRoute() {
  const { quote } = useLocalSearchParams<{ quote?: string }>();
  const { setTargetQuote } = useUserStore();

  useEffect(() => {
    console.log('[WidgetRoute] Processing widget route with quote:', quote);
    
    if (quote) {
      // Set the target quote from the widget
      setTargetQuote({
        id: `widget-${Date.now()}`,
        text: decodeURIComponent(quote)
      });
    }

    // Always redirect to main - let main handle showing the modal
    router.replace('/(main)');
  }, []); // Empty dependency array - only run once when component mounts

  // Return empty view since we're immediately redirecting
  return <View />;
} 