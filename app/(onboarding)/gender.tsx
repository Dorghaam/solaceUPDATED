import React, { useState } from 'react';
import { StyleSheet, SafeAreaView, View, Text, Pressable } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../../constants/theme';
import * as Haptics from 'expo-haptics';

const genderOptions = [
  'Female',
  'Male', 
  'Other',
  'Prefer not to say'
];

export default function GenderPage() {
  const [selectedGender, setSelectedGender] = useState<string | null>(null);

  const handleGenderPress = (gender: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSelectedGender(gender);
    // Here you could save the selectedGender to analytics or user preferences
    // Small delay to show selection before navigating
    setTimeout(() => {
      router.push('/(onboarding)/relationship');
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
          <Text style={styles.title}>Tell Us a Bit About Yourself</Text>
          <Text style={styles.subtitle}>
            This helps us customize quotes that truly{'\n'}resonate with you.
          </Text>

          {/* Gender options list */}
          <View style={styles.optionsContainer}>
            {genderOptions.map((gender, index) => (
              <Pressable
                key={gender}
                style={({ pressed }) => [
                  styles.genderButton,
                  selectedGender === gender && styles.selectedGender,
                  { 
                    opacity: pressed ? 0.8 : 1,
                    transform: [{ scale: pressed ? 0.98 : 1 }]
                  }
                ]}
                onPress={() => handleGenderPress(gender)}
              >
                <Text style={[
                  styles.genderText,
                  selectedGender === gender && styles.selectedGenderText
                ]}>
                  {gender}
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
    paddingTop: theme.spacing.xl,
    paddingHorizontal: theme.spacing.l,
  },
  title: {
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: 32,
    color: theme.colors.text,
    textAlign: 'center',
    marginBottom: theme.spacing.m,
  },
  subtitle: {
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: 16,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: theme.spacing.xl,
    lineHeight: 22,
  },
  optionsContainer: {
    width: '100%',
    gap: theme.spacing.m,
  },
  genderButton: {
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
  selectedGender: {
    borderColor: theme.colors.text,
  },
  genderText: {
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: theme.typography.fontSizes.m,
    color: theme.colors.text,
    textAlign: 'left',
  },
  selectedGenderText: {
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.text,
  },
}); 