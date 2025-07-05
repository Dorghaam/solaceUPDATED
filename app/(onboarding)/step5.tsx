import React, { useRef, useEffect } from 'react';
import { StyleSheet, SafeAreaView, View, Text, Pressable } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../../constants/theme';
import { getResponsiveFontSize, getResponsiveSpacing } from '../../utils/responsive';
import * as Haptics from 'expo-haptics';
import LottieView from 'lottie-react-native';

export default function Step5Screen() {
  const { name } = useLocalSearchParams();
  const animationRef = useRef<LottieView>(null);

  const displayName = name && typeof name === 'string' && name.trim() ? name.trim() : '';

  useEffect(() => {
    // Start the animation when component mounts
    if (animationRef.current) {
      animationRef.current.play();
    }
  }, []);

  const handleContinue = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push('/(onboarding)/reminders');
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
          {/* Flower Animation */}
          <View style={styles.animationContainer}>
            <LottieView
              ref={animationRef}
              source={require('../../assets/flower-bloom-animation.json')}
              style={styles.animation}
              autoPlay={false}
              loop={false}
              speed={1}
            />
          </View>

          {/* Main Headline */}
          <Text style={styles.headline}>
            Beautiful{displayName ? `, ${displayName}` : ''}.
          </Text>

          {/* Sub-headline */}
          <Text style={styles.subheadline}>
            Taking this first step is the hardest part, and you just did it.
          </Text>
        </View>
        
        {/* Continue Button */}
        <View style={styles.floatingButtonContainer}>
          <Pressable 
            style={({ pressed }) => [
              styles.continueButton,
              { opacity: pressed ? 0.8 : 1, transform: [{ scale: pressed ? 0.98 : 1 }] }
            ]} 
            onPress={handleContinue}
          >
            <Text style={styles.buttonText}>Continue</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  backgroundGradient: { 
    flex: 1 
  },
  safeArea: { 
    flex: 1,
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: getResponsiveSpacing(theme.spacing.l),
    paddingTop: getResponsiveSpacing(theme.spacing.xl),
  },
  animationContainer: {
    width: 200,
    height: 200,
    marginBottom: getResponsiveSpacing(theme.spacing.xl),
    justifyContent: 'center',
    alignItems: 'center',
  },
  animation: {
    width: '100%',
    height: '100%',
  },
  headline: {
    fontFamily: theme.typography.fontFamily.semiBold,
    fontSize: getResponsiveFontSize(28),
    color: theme.colors.text,
    textAlign: 'center',
    lineHeight: getResponsiveFontSize(36),
    marginBottom: getResponsiveSpacing(theme.spacing.m),
    letterSpacing: -0.3,
  },
  subheadline: {
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: getResponsiveFontSize(18),
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: getResponsiveFontSize(24),
    letterSpacing: 0.2,
    maxWidth: '90%',
  },
  floatingButtonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: theme.spacing.l,
    paddingBottom: getResponsiveSpacing(theme.spacing.xl),
  },
  continueButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: getResponsiveSpacing(theme.spacing.m),
    borderRadius: theme.radii.l,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    shadowColor: theme.colors.primary,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  buttonText: {
    fontFamily: theme.typography.fontFamily.semiBold,
    fontSize: theme.typography.fontSizes.m,
    color: theme.colors.white,
  },
}); 