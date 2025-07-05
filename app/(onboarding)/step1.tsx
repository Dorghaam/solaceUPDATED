import React, { useEffect } from 'react';
import { StyleSheet, SafeAreaView, View, Text, Pressable, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withDelay } from 'react-native-reanimated';
import { theme } from '../../constants/theme';
import { getResponsiveFontSize, getResponsiveSpacing } from '../../utils/responsive';
import * as Haptics from 'expo-haptics';

export default function Step1Screen() {
  const card1Opacity = useSharedValue(0);
  const card2Opacity = useSharedValue(0);
  const card3Opacity = useSharedValue(0);
  const buttonOpacity = useSharedValue(0);

  const card1TranslateY = useSharedValue(30);
  const card2TranslateY = useSharedValue(30);
  const card3TranslateY = useSharedValue(30);
  const buttonTranslateY = useSharedValue(30);

  useEffect(() => {
    // Animate cards in sequence
    card1Opacity.value = withDelay(200, withTiming(1, { duration: 600 }));
    card1TranslateY.value = withDelay(200, withTiming(0, { duration: 600 }));

    card2Opacity.value = withDelay(600, withTiming(1, { duration: 600 }));
    card2TranslateY.value = withDelay(600, withTiming(0, { duration: 600 }));

    card3Opacity.value = withDelay(1000, withTiming(1, { duration: 600 }));
    card3TranslateY.value = withDelay(1000, withTiming(0, { duration: 600 }));

    // Animate button after cards are done
    buttonOpacity.value = withDelay(1400, withTiming(1, { duration: 600 }));
    buttonTranslateY.value = withDelay(1400, withTiming(0, { duration: 600 }));
  }, []);

  const card1AnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: card1Opacity.value,
      transform: [{ translateY: card1TranslateY.value }],
    };
  });

  const card2AnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: card2Opacity.value,
      transform: [{ translateY: card2TranslateY.value }],
    };
  });

  const card3AnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: card3Opacity.value,
      transform: [{ translateY: card3TranslateY.value }],
    };
  });

  const buttonAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: buttonOpacity.value,
      transform: [{ translateY: buttonTranslateY.value }],
    };
  });

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
        <ScrollView 
          style={styles.scrollContainer}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Main Headline */}
          <Text style={styles.headline}>Your mind is powerful. Let's teach it how to heal you.</Text>

          {/* Sub-headline */}
          <Text style={styles.subheadline}>
            This isn't magic, it's science. Here's how you'll start moving on:
          </Text>

          {/* Cards Container */}
          <View style={styles.cardsContainer}>
            {/* Card 1: Break the Cycle */}
            <Animated.View style={[styles.card, card1AnimatedStyle]}>
              <View style={styles.cardHeader}>
                <View style={styles.iconPlaceholder}>
                  <Text style={styles.iconText}>🧠</Text>
                </View>
                <Text style={styles.cardTitle}>Break the Cycle</Text>
              </View>
              <Text style={styles.cardText}>
                Daily affirmations interrupt the constant loop of overthinking about them. This creates new mental pathways, helping you find peace.
              </Text>
            </Animated.View>

            {/* Card 2: Rebuild Your Worth */}
            <Animated.View style={[styles.card, card2AnimatedStyle]}>
              <View style={styles.cardHeader}>
                <View style={styles.iconPlaceholder}>
                  <Text style={styles.iconText}>🛡️</Text>
                </View>
                <Text style={styles.cardTitle}>Rebuild Your Worth</Text>
              </View>
              <Text style={styles.cardText}>
                Positive psychology shows that focusing on your strengths boosts confidence and self-esteem. We'll remind you that their actions don't define your value.
              </Text>
            </Animated.View>

            {/* Card 3: See Real Change */}
            <Animated.View style={[styles.card, card3AnimatedStyle]}>
              <View style={styles.cardHeader}>
                <View style={styles.iconPlaceholder}>
                  <Text style={styles.iconText}>🌱</Text>
                </View>
                <Text style={styles.cardTitle}>See Real Change</Text>
              </View>
              <Text style={styles.cardText}>
                It takes users just 7-14 days of consistent, 2-minute daily sessions to start feeling more like themselves again.
              </Text>
            </Animated.View>
          </View>
        </ScrollView>
        
        {/* Floating Animated Button */}
        <Animated.View style={[styles.floatingButtonContainer, buttonAnimatedStyle]}>
          <Pressable 
            style={({ pressed }) => [
              styles.continueButton,
              { opacity: pressed ? 0.8 : 1, transform: [{ scale: pressed ? 0.98 : 1 }] }
            ]} 
            onPress={handleContinue}
          >
            <Text style={styles.buttonText}>Continue</Text>
          </Pressable>
        </Animated.View>
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
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: getResponsiveSpacing(theme.spacing.l),
    paddingTop: getResponsiveSpacing(theme.spacing.xl),
    paddingBottom: getResponsiveSpacing(theme.spacing.xl * 2), // Extra padding for sticky button
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
    fontSize: getResponsiveFontSize(16),
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: getResponsiveFontSize(22),
    marginBottom: getResponsiveSpacing(theme.spacing.xl),
    maxWidth: '90%',
    alignSelf: 'center',
  },
  cardsContainer: {
    width: '100%',
  },
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    borderRadius: theme.radii.l,
    padding: getResponsiveSpacing(theme.spacing.m),
    marginBottom: getResponsiveSpacing(theme.spacing.m),
    shadowColor: theme.colors.primary,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: getResponsiveSpacing(theme.spacing.s),
  },
  iconPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.lightPink.light,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: getResponsiveSpacing(theme.spacing.s),
  },
  iconText: {
    fontSize: 20,
  },
  cardTitle: {
    fontFamily: theme.typography.fontFamily.semiBold,
    fontSize: getResponsiveFontSize(18),
    color: theme.colors.text,
    flex: 1,
  },
  cardText: {
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: getResponsiveFontSize(14),
    color: theme.colors.textSecondary,
    lineHeight: getResponsiveFontSize(20),
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