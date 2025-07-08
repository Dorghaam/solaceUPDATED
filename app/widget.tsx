import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useUserStore } from '@/store/userStore';

export default function WidgetScreen() {
  const { setTargetQuote } = useUserStore();
  const { id, quote } = useLocalSearchParams<{ id: string; quote: string }>();

  useEffect(() => {
    if (id && quote) {
      // Use the actual quote ID from the widget URL
      const targetQuote = {
        id: id, // Use the actual database ID
        text: decodeURIComponent(quote),
      };
      
      setTargetQuote(targetQuote);
    }
    
    // Navigate back to the main screen
    router.replace('/(main)');
  }, [id, quote, setTargetQuote]);

  return (
    <View style={styles.container}>
      <Text style={styles.loadingText}>Loading...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  loadingText: {
    fontSize: 18,
    color: '#666',
  },
}); 