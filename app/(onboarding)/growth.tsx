import React, { useState } from 'react';
import { StyleSheet, SafeAreaView, View, Text, Pressable } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../../constants/theme';
import * as Haptics from 'expo-haptics';

const growthOptions = [
  'Healing & Moving On',
  'Self Love & Worth',
  'Overcoming Heartbreak',
  'Building Confidence',
  'Letting Go & Acceptance',
  'Finding Inner Peace'
];

export default function GrowthPage() {
  const [selectedGrowth, setSelectedGrowth] = useState<string | null>(null);

  const handleGrowthPress = (growth: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSelectedGrowth(growth);
  };

  const handleContinue = () => {
    if (!selectedGrowth) {
      return; // Don't continue if nothing is selected
    }
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    // Here you could save the selectedGrowth to analytics or user preferences
    router.push('/(onboarding)/writegoals');
  };

  return (
    <LinearGradient
      colors={[theme.colors.lightPink.lightest, theme.colors.lightPink.light, theme.colors.lightPink.medium]}
      style={styles.backgroundGradient}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
    >
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          {/* Header Text */}
          <View style={styles.headerSection}>
            <Text style={styles.title}>Where Do You Want to{'\n'}Grow?</Text>
            <Text style={styles.subtitle}>
              Choose a focus so we can align your{'\n'}quotes with your goals.
            </Text>
          </View>

          {/* Growth options list */}
          <View style={styles.optionsContainer}>
            {growthOptions.map((growth, index) => (
              <Pressable
                key={growth}
                style={({ pressed }) => [
                  styles.growthButton,
                  selectedGrowth === growth && styles.selectedGrowth,
                  { 
                    opacity: pressed ? 0.8 : 1,
                    transform: [{ scale: pressed ? 0.98 : 1 }]
                  }
                ]}
                onPress={() => handleGrowthPress(growth)}
              >
                <Text style={[
                  styles.growthText,
                  selectedGrowth === growth && styles.selectedGrowthText
                ]}>
                  {growth}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* Spacer */}
          <View style={styles.spacer} />

          {/* Continue Button */}
          <View style={styles.bottomSection}>
            <Pressable
              style={({ pressed }) => [
                styles.continueButton,
                { 
                  opacity: selectedGrowth ? (pressed ? 0.9 : 1) : 0.5,
                  transform: [{ scale: pressed && selectedGrowth ? 0.98 : 1 }]
                }
              ]}
              onPress={handleContinue}
              disabled={!selectedGrowth}
            >
              <Text style={styles.continueButtonText}>Continue</Text>
            </Pressable>
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
  container: {
    flex: 1,
    paddingHorizontal: theme.spacing.l,
  },
  headerSection: {
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
    paddingTop: theme.spacing.xl,
  },
  title: {
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: 32,
    color: theme.colors.text,
    textAlign: 'center',
    marginBottom: theme.spacing.m,
    lineHeight: 38,
  },
  subtitle: {
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: 16,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  optionsContainer: {
    gap: theme.spacing.m,
    marginBottom: theme.spacing.xl,
  },
  growthButton: {
    backgroundColor: theme.colors.white,
    paddingVertical: theme.spacing.m + 4,
    paddingHorizontal: theme.spacing.l,
    borderRadius: theme.radii.l,
    borderWidth: 2,
    borderColor: 'transparent',
    shadowColor: theme.colors.black,
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  selectedGrowth: {
    borderColor: theme.colors.text,
  },
  growthText: {
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: theme.typography.fontSizes.m,
    color: theme.colors.text,
    textAlign: 'left',
  },
  selectedGrowthText: {
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.text,
  },
  spacer: {
    flex: 1,
  },
  bottomSection: {
    paddingBottom: theme.spacing.xl,
  },
  continueButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.m,
    paddingHorizontal: theme.spacing.xl,
    borderRadius: theme.radii.l,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  continueButtonText: {
    fontFamily: theme.typography.fontFamily.semiBold,
    fontSize: theme.typography.fontSizes.m,
    color: theme.colors.white,
  },
}); 