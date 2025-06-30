// components/onboarding/WelcomeScreen.tsx

import React from 'react';
import { StyleSheet, SafeAreaView, View, Text, Pressable } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../../constants/theme';
import { getResponsiveFontSize, getResponsiveSpacing } from '../../utils/responsive';
import * as Haptics from 'expo-haptics';

export const WelcomeScreen = () => {
  const handleGetStarted = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push('/(onboarding)/reminders');
  };
  
  // This is a new function for the "Login" link
  const handleLoginPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
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
          
          <Text style={styles.title}>Welcome to Solace</Text>

          <Text style={styles.subtitle}>
            Daily affirmations to help you heal, let go, and love yourself again.
          </Text>

          {/* This view is for the social proof vectors you will add */}
          <View style={styles.proofContainer}>
            {/* You will add a vector on the left */}
            <Text style={styles.proofText}>
              
            </Text>
            {/* You will add a vector on the right */}
          </View>
          
        </View>
        <View style={styles.buttonContainer}>
          <Pressable 
            style={({ pressed }) => [
              styles.getStartedButton,
              { opacity: pressed ? 0.8 : 1, transform: [{ scale: pressed ? 0.98 : 1 }] }
            ]} 
            onPress={handleGetStarted}
          >
            <Text style={styles.buttonText}>Start My Healing Journey</Text>
          </Pressable>
          <Pressable onPress={handleLoginPress}>
             <Text style={styles.loginText}>Already have an account? Login</Text>
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
    paddingHorizontal: theme.spacing.l,
    width: '100%',
  },
  title: {
    fontFamily: theme.typography.fontFamily.semiBold,
    fontSize: getResponsiveFontSize(42),
    color: theme.colors.text,
    textAlign: 'center',
    lineHeight: getResponsiveFontSize(50),
  },
  subtitle: {
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: getResponsiveFontSize(18),
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: getResponsiveFontSize(26),
    marginTop: getResponsiveSpacing(theme.spacing.m),
    maxWidth: '90%', // Keep the one-liner from getting too wide
  },
  proofContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: getResponsiveSpacing(theme.spacing.xl), // Space it out from the subtitle
  },
  proofText: {
    fontFamily: theme.typography.fontFamily.semiBold,
    fontSize: getResponsiveFontSize(16),
    color: theme.colors.text,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginHorizontal: 12, // Space for the vectors
  },
  buttonContainer: {
    width: '100%',
    paddingHorizontal: theme.spacing.l,
    paddingBottom: getResponsiveSpacing(theme.spacing.xl),
    alignItems: 'center',
  },
  getStartedButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: getResponsiveSpacing(theme.spacing.m),
    borderRadius: theme.radii.l,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  buttonText: {
    fontFamily: theme.typography.fontFamily.semiBold,
    fontSize: theme.typography.fontSizes.m,
    color: theme.colors.white,
  },
  loginText: {
      marginTop: getResponsiveSpacing(theme.spacing.l),
      fontFamily: theme.typography.fontFamily.regular,
      fontSize: getResponsiveFontSize(16),
      color: theme.colors.textSecondary,
      textDecorationLine: 'underline',
  },
});