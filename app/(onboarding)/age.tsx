import React, { useState } from 'react';
import { StyleSheet, SafeAreaView, View, Text, Pressable } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../../constants/theme';
import { useUserStore } from '../../store/userStore';
import * as Haptics from 'expo-haptics';

const ageOptions = [
  '13 to 17',
  '18 to 24',
  '25 to 34',
  '35 to 54',
  '55+'
];

export default function AgePage() {
  const [selectedAge, setSelectedAge] = useState<string | null>(null);
  const { setAge } = useUserStore();

  const handleAgePress = async (age: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSelectedAge(age);
    
    // Save locally (will sync to database after authentication)
    setAge(age);
    
    // Small delay to show selection before navigating
    setTimeout(() => {
      router.push('/(onboarding)/name');
    }, 200);
  };

  const handleSkip = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push('/(onboarding)/name');
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
          <Text style={styles.title}>What's Your Age?</Text>
          <Text style={styles.subtitle}>
            We use your age to personalize your{'\n'}experience and content.
          </Text>

          {/* Age options list */}
          <View style={styles.optionsContainer}>
            {ageOptions.map((age, index) => (
              <Pressable
                key={age}
                style={({ pressed }) => [
                  styles.ageButton,
                  selectedAge === age && styles.selectedAge,
                  { 
                    opacity: pressed ? 0.8 : 1,
                    transform: [{ scale: pressed ? 0.98 : 1 }]
                  }
                ]}
                onPress={() => handleAgePress(age)}
              >
                <Text style={[
                  styles.ageText,
                  selectedAge === age && styles.selectedAgeText
                ]}>
                  {age}
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
    maxWidth: 500,
    alignSelf: 'center',
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
    marginBottom: theme.spacing.xl + theme.spacing.m,
    lineHeight: 22,
  },
  optionsContainer: {
    width: '100%',
    gap: theme.spacing.m,
  },
  ageButton: {
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
  selectedAge: {
    borderColor: theme.colors.text,
  },
  ageText: {
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: theme.typography.fontSizes.m,
    color: theme.colors.text,
    textAlign: 'left',
  },
  selectedAgeText: {
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.text,
  },
}); 