import React, { useState } from 'react';
import { StyleSheet, SafeAreaView, View, Text, Pressable, TextInput, Keyboard } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../../constants/theme';
import { useUserStore } from '../../store/userStore';
import * as Haptics from 'expo-haptics';

export default function NamePage() {
  const [name, setName] = useState('');
  const { setUserName } = useUserStore();

  const handleContinue = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    // Save the name to the user store (this will update the profile in settings)
    if (name.trim()) {
      setUserName(name.trim());
    }
    
    // Navigate to gender page
    router.push('/(onboarding)/gender');
  };

  const handleSkip = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push('/(onboarding)/gender');
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
          <Text style={styles.title}>What Should We Call You?</Text>
          <Text style={styles.subtitle}>
            Your name will appear in your{'\n'}personalized healing affirmations.
          </Text>

          {/* Name input */}
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.nameInput}
              placeholder="Enter your name"
              placeholderTextColor={theme.colors.textSecondary}
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
              returnKeyType="done"
              onSubmitEditing={handleContinue}
              maxLength={50}
            />
          </View>
        </View>

        {/* Bottom section with Continue button */}
        <View style={styles.bottomSection}>
          <Pressable
            style={({ pressed }) => [
              styles.continueButton,
              { 
                opacity: pressed ? 0.9 : 1,
                transform: [{ scale: pressed ? 0.98 : 1 }]
              }
            ]}
            onPress={handleContinue}
          >
            <Text style={styles.continueButtonText}>Continue</Text>
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
    marginBottom: theme.spacing.m,
    lineHeight: 22,
  },
  inputContainer: {
    width: '100%',
    marginTop: theme.spacing.s,
  },
  nameInput: {
    backgroundColor: theme.colors.white,
    paddingVertical: theme.spacing.m + 4,
    paddingHorizontal: theme.spacing.l,
    borderRadius: theme.radii.l,
    fontSize: theme.typography.fontSizes.m,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.text,
    textAlign: 'left',
    shadowColor: theme.colors.black,
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  bottomSection: {
    paddingHorizontal: theme.spacing.l,
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