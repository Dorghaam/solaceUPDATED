import React, { useState } from 'react';
import { StyleSheet, SafeAreaView, View, Text, Pressable, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../../constants/theme';
import { getResponsiveFontSize, getResponsiveSpacing } from '../../utils/responsive';
import * as Haptics from 'expo-haptics';
import { OnboardingProgressBar } from '../../components/OnboardingProgressBar';

export default function Step2Screen() {
  const [name, setName] = useState('');

  const handleContinue = () => {
    if (name.trim()) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      // TODO: Save name to storage/state
      router.push({
        pathname: '/(onboarding)/step3',
        params: { name: name.trim() }
      });
    }
  };



  return (
    <LinearGradient
      colors={[theme.colors.lightPink.lightest, theme.colors.lightPink.light, theme.colors.lightPink.medium]}
      style={styles.backgroundGradient}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
    >
      <SafeAreaView style={styles.safeArea}>
        <OnboardingProgressBar 
          currentStep={2} 
          totalSteps={10} 
        />
        <KeyboardAvoidingView 
          style={styles.keyboardAvoidingView}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        >
          <View style={styles.contentContainer}>
            {/* Main Headline */}
            <Text style={styles.headline}>
              What do you want{'\n'}to be called?
            </Text>

            {/* Subtitle */}
            <Text style={styles.subtitle}>
              Your name will appear{'\n'}in your affirmations
            </Text>

            {/* Name Input */}
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.nameInput}
                placeholder="Your name"
                placeholderTextColor={theme.colors.textSecondary}
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
                autoCorrect={false}
                returnKeyType="done"
                onSubmitEditing={handleContinue}
              />
            </View>
          </View>
          
          {/* Continue Button */}
          <View style={styles.buttonContainer}>
            <Pressable 
              style={({ pressed }) => [
                styles.continueButton,
                { 
                  opacity: name.trim() ? (pressed ? 0.8 : 1) : 0.5,
                  transform: [{ scale: pressed ? 0.98 : 1 }] 
                }
              ]} 
              onPress={handleContinue}
              disabled={!name.trim()}
            >
              <Text style={styles.buttonText}>Continue</Text>
            </Pressable>
          </View>
        </KeyboardAvoidingView>
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
  keyboardAvoidingView: {
    flex: 1,
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingHorizontal: getResponsiveSpacing(theme.spacing.l),
    paddingTop: getResponsiveSpacing(theme.spacing.xl),
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
  subtitle: {
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: getResponsiveFontSize(18),
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: getResponsiveFontSize(24),
    marginBottom: getResponsiveSpacing(theme.spacing.xl),
    letterSpacing: 0.2,
  },
  inputContainer: {
    width: '100%',
    maxWidth: 400,
  },
  nameInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: theme.radii.l,
    paddingHorizontal: getResponsiveSpacing(theme.spacing.m),
    paddingVertical: getResponsiveSpacing(theme.spacing.m + 2),
    fontSize: getResponsiveFontSize(16),
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.text,
    textAlign: 'left',
    shadowColor: theme.colors.primary,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonContainer: {
    width: '100%',
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