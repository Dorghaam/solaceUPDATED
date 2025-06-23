import React, { useState } from 'react';
import { StyleSheet, SafeAreaView, View, Text, Pressable } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../../constants/theme';
import * as Haptics from 'expo-haptics';

const discoveryOptions = [
  'TikTok',
  'Instagram',
  'Facebook',
  'Web Search',
  'Friend / Family',
  'App Store',
  'Other'
];

export default function DiscoveryPage() {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);

  const handleOptionPress = (option: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSelectedOption(option);
    // Here you could save the selectedOption to analytics or user preferences
    // Small delay to show selection before navigating
    setTimeout(() => {
      router.push('/(onboarding)/personalize');
    }, 200);
  };

  const handleSkip = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push('/(onboarding)/personalize');
  };

  return (
    <LinearGradient
      colors={[theme.colors.lightPink.lightest, theme.colors.lightPink.light, theme.colors.lightPink.medium]}
      style={styles.backgroundGradient}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
    >
      <SafeAreaView style={styles.safeArea}>
        {/* Header with Skip button */}
        <View style={styles.header}>
          <View style={styles.headerPlaceholder} />
          <Pressable 
            style={({ pressed }) => [
              styles.skipButton,
              { opacity: pressed ? 0.6 : 1 }
            ]} 
            onPress={handleSkip}
          >
            <Text style={styles.skipText}>Skip</Text>
          </Pressable>
        </View>

        {/* Main content */}
        <View style={styles.contentContainer}>
          <Text style={styles.title}>How Did You Discover{'\n'}Solace?</Text>
          <Text style={styles.subtitle}>Choose an option below to continue.</Text>

          {/* Options list */}
          <View style={styles.optionsContainer}>
            {discoveryOptions.map((option, index) => (
              <Pressable
                key={option}
                style={({ pressed }) => [
                  styles.optionButton,
                  selectedOption === option && styles.selectedOption,
                  { 
                    opacity: pressed ? 0.8 : 1,
                    transform: [{ scale: pressed ? 0.98 : 1 }]
                  }
                ]}
                onPress={() => handleOptionPress(option)}
              >
                <Text style={[
                  styles.optionText,
                  selectedOption === option && styles.selectedOptionText
                ]}>
                  {option}
                </Text>
              </Pressable>
            ))}
          </View>
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
    flex: 1 
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.l,
    paddingTop: theme.spacing.m,
  },
  headerPlaceholder: {
    width: 50, // To center the skip button
  },
  skipButton: {
    paddingVertical: theme.spacing.s,
    paddingHorizontal: theme.spacing.m,
  },
  skipText: {
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: theme.typography.fontSizes.m,
    color: theme.colors.text,
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.l,
  },
  title: {
    fontFamily: theme.typography.fontFamily.semiBold,
    fontSize: 32,
    color: theme.colors.text,
    textAlign: 'center',
    marginBottom: theme.spacing.m,
    lineHeight: 40,
  },
  subtitle: {
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: 16,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: theme.spacing.xl,
  },
  optionsContainer: {
    width: '100%',
    gap: theme.spacing.m,
  },
  optionButton: {
    backgroundColor: theme.colors.white,
    paddingVertical: theme.spacing.m + 4,
    paddingHorizontal: theme.spacing.l,
    borderRadius: theme.radii.l,
    borderWidth: 2,
    borderColor: 'transparent',
    shadowColor: theme.colors.black,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  selectedOption: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.lightPink.light,
  },
  optionText: {
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: theme.typography.fontSizes.m,
    color: theme.colors.text,
    textAlign: 'left',
  },
  selectedOptionText: {
    fontFamily: theme.typography.fontFamily.semiBold,
    color: theme.colors.primary,
  },
}); 