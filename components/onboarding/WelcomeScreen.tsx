// components/onboarding/WelcomeScreen.tsx

import React from 'react';
import { StyleSheet, SafeAreaView, View, Text, Pressable } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import LottieView from 'lottie-react-native';
import { theme } from '../../constants/theme';
import { getResponsiveFontSize, getResponsiveSpacing } from '../../utils/responsive';
import * as Haptics from 'expo-haptics';

export const WelcomeScreen = () => {
  const handleGetStarted = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push('/(onboarding)/step1');
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
          
          {/* Lottie Animation */}
          <View style={styles.animationContainer}>
            <LottieView
              source={require('../../assets/welcome-animation.json')}
              style={styles.animation}
              autoPlay
              loop
              speed={0.8}
            />
          </View>

          {/* Main Headline */}
          <Text style={styles.headline}>It hurts right now.</Text>

          {/* Sub-headline */}
          <Text style={styles.subheadline}>
            And that's okay. We're here to help you.
          </Text>
          
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
    paddingHorizontal: getResponsiveSpacing(theme.spacing.xl),
    width: '100%',
  },
  animationContainer: {
    width: '100%',
    height: 220,
    marginBottom: getResponsiveSpacing(theme.spacing.xl),
    justifyContent: 'center',
    alignItems: 'center',
  },
  animation: {
    width: '85%',
    height: '100%',
  },
  headline: {
    fontFamily: theme.typography.fontFamily.semiBold,
    fontSize: getResponsiveFontSize(36),
    color: theme.colors.text,
    textAlign: 'center',
    lineHeight: getResponsiveFontSize(44),
    marginBottom: getResponsiveSpacing(theme.spacing.m),
    letterSpacing: -0.5,
  },
  subheadline: {
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: getResponsiveFontSize(20),
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: getResponsiveFontSize(28),
    marginBottom: getResponsiveSpacing(theme.spacing.xl),
    maxWidth: '85%',
    letterSpacing: 0.2,
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