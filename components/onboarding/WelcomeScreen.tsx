import React from 'react';
import { StyleSheet, SafeAreaView, View, Text, Pressable } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../../constants/theme';
import * as Haptics from 'expo-haptics';

export const WelcomeScreen = () => {
  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push('/(onboarding)/login');
  };

  return (
    <LinearGradient
      colors={[theme.colors.lightPink.lightest, theme.colors.lightPink.light, theme.colors.lightPink.medium]}
      style={styles.backgroundGradient}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
    >
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.contentContainer}>
          <Text style={styles.title}>Find Your Solace</Text>
          <Text style={styles.subtitle}>
            Heal and grow with affirmations designed for your journey through breakup recovery.
          </Text>
        </View>
        <View style={styles.buttonContainer}>
          <Pressable 
            style={({ pressed }) => [
              styles.getStartedButton,
              { opacity: pressed ? 0.8 : 1, transform: [{ scale: pressed ? 0.98 : 1 }] }
            ]} 
            onPress={handlePress}
          >
            <Text style={styles.buttonText}>Get Started</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  backgroundGradient: { 
    flex: 1 
  },
  safeArea: { 
    flex: 1, 
    justifyContent: 'space-between', 
    alignItems: 'center' 
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.xl,
  },
  title: {
    fontFamily: theme.typography.fontFamily.semiBold,
    fontSize: 48,
    color: theme.colors.text,
    textAlign: 'center',
    marginBottom: theme.spacing.m,
  },
  subtitle: {
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: 18,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  buttonContainer: {
    width: '100%',
    paddingHorizontal: theme.spacing.l,
    paddingBottom: theme.spacing.xl,
  },
  getStartedButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.m,
    paddingHorizontal: theme.spacing.xl,
    borderRadius: theme.radii.l,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontFamily: theme.typography.fontFamily.semiBold,
    fontSize: theme.typography.fontSizes.m,
    color: theme.colors.white,
  },
}); 