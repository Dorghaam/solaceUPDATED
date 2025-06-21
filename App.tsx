import React from 'react';
import { ActivityIndicator, StyleSheet, View, StatusBar } from 'react-native';
import { useFonts } from 'expo-font';
import { theme } from './constants/theme'; // Import our new theme
import { MainFeedScreen } from './components/MainFeedScreen'; // Import our new screen

export default function App() {
  // Load the custom fonts
  const [fontsLoaded] = useFonts({
    'Inter-Regular': require('./Inter/static/Inter_18pt-Regular.ttf'),
    'Inter-SemiBold': require('./Inter/static/Inter_18pt-SemiBold.ttf'),
  });

  // Show a loading indicator until the fonts are loaded
  if (!fontsLoaded) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  // Render the main app content
  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <MainFeedScreen />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background, // Use the background color from our theme
  },
}); 