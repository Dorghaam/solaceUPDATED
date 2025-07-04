import React, { useState } from 'react';
import { StyleSheet, SafeAreaView, View, Text, Pressable } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../../constants/theme';
import { useUserStore } from '../../store/userStore';
import { getResponsiveFontSize, getResponsiveSpacing } from '../../utils/responsive';
import * as Haptics from 'expo-haptics';

const spiritualOptions = [
  'Yes',
  'No',
  'Spiritual but not religious'
];

export default function SpiritualPage() {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const { setSpiritualPreference } = useUserStore();

  const handleOptionPress = async (option: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSelectedOption(option);
    
    // Save locally (will sync to database after authentication)
    setSpiritualPreference(option);
    
    // Small delay to show selection before navigating
    setTimeout(() => {
      router.push('/(onboarding)/goals');
    }, 200);
  };

  return (
    <LinearGradient
      colors={[theme.colors.lightPink.lightest, theme.colors.lightPink.light, theme.colors.lightPink.medium]}
      style={styles.backgroundGradient}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
    >
      <SafeAreaView style={styles.safeArea}>
        {/* Main content */}
        <View style={styles.contentContainer}>
          <Text style={styles.title}>Do You Identify as{'\n'}Religious or Spiritual?</Text>
          <Text style={styles.subtitle}>
            Your response helps us tailor quotes{'\n'}that resonate with your worldview.
          </Text>

          {/* Spiritual options list */}
          <View style={styles.optionsContainer}>
            {spiritualOptions.map((option, index) => (
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
  contentContainer: {
    flex: 1,
    paddingTop: getResponsiveSpacing(theme.spacing.xl),
    paddingHorizontal: theme.spacing.l,
  },
  title: {
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: getResponsiveFontSize(32),
    color: theme.colors.text,
    textAlign: 'center',
    marginBottom: getResponsiveSpacing(theme.spacing.m),
    lineHeight: getResponsiveFontSize(38),
  },
  subtitle: {
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: getResponsiveFontSize(16),
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: getResponsiveSpacing(theme.spacing.xl),
    lineHeight: getResponsiveFontSize(22),
  },
  optionsContainer: {
    width: '100%',
    gap: getResponsiveSpacing(theme.spacing.m),
  },
  optionButton: {
    backgroundColor: theme.colors.white,
    paddingVertical: getResponsiveSpacing(theme.spacing.m + 4),
    paddingHorizontal: getResponsiveSpacing(theme.spacing.l),
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
  selectedOption: {
    borderColor: theme.colors.text,
  },
  optionText: {
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: theme.typography.fontSizes.m,
    color: theme.colors.text,
    textAlign: 'left',
  },
  selectedOptionText: {
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.text,
  },
}); 