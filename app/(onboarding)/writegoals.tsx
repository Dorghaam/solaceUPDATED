// app/(onboarding)/writegoals.tsx

import React, { useState } from 'react';
import { StyleSheet, SafeAreaView, View, Text, Pressable, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../../constants/theme';
import { useUserStore } from '../../store/userStore';
import { getResponsiveDimensions, getResponsiveFontSize, getResponsiveSpacing } from '../../utils/responsive';
import * as Haptics from 'expo-haptics';
import { OnboardingProgressBar } from '../../components/OnboardingProgressBar';

export default function WriteGoalsPage() {
  const [goals, setGoals] = useState<string>('');
  const { setHealingGoals } = useUserStore();
  const responsiveDimensions = getResponsiveDimensions();
  const styles = createStyles();

  const handleSaveGoals = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    // Save locally (will sync to database after authentication)
    if (goals.trim()) {
      setHealingGoals(goals.trim());
    }
    
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
        <OnboardingProgressBar 
          currentStep={9} 
          totalSteps={10} 
        />
        <KeyboardAvoidingView 
          style={styles.keyboardAvoidingView}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={styles.container}>
            {/* Header Text */}
            <View style={styles.headerSection}>
              {/* --- NEW, MORE INVITING COPY --- */}
              <Text style={styles.title}>What does healing look like for you?</Text>
              <Text style={styles.subtitle}>
                You don't have to write anything, but sharing what's on your heart helps us find the perfect words for you.
              </Text>
            </View>

            {/* Text Input */}
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.textInput}
                value={goals}
                onChangeText={setGoals}
                placeholder="I want to..."
                placeholderTextColor={theme.colors.textSecondary}
                multiline
                textAlignVertical="top"
                maxLength={500}
                returnKeyType="done"
                onSubmitEditing={handleSaveGoals}
                blurOnSubmit={true}
              />
            </View>
          </View>
        </KeyboardAvoidingView>
        
        {/* Save Goals Button - Outside Container */}
        <View style={styles.bottomSection}>
          <Pressable
            style={({ pressed }) => [
              styles.continueButton,
              { 
                opacity: pressed ? 0.9 : 1,
                transform: [{ scale: pressed ? 0.98 : 1 }]
              }
            ]}
            onPress={handleSaveGoals}
          >
            <Text style={styles.continueButtonText}>Save My Goals</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const createStyles = () => {
  const responsiveDimensions = getResponsiveDimensions();
  
  return StyleSheet.create({
    backgroundGradient: { 
      flex: 1 
    },
    safeArea: { 
      flex: 1 
    },
    keyboardAvoidingView: {
      flex: 1
    },
    container: {
      flex: 1,
      paddingHorizontal: responsiveDimensions.horizontalPadding,
      maxWidth: responsiveDimensions.contentWidth,
      alignSelf: 'center',
      paddingBottom: 100, // Space for floating button
    },
    headerSection: {
      alignItems: 'center',
      marginBottom: theme.spacing.xl,
      paddingTop: theme.spacing.xl,
    },
    title: {
      fontFamily: theme.typography.fontFamily.semiBold,
      fontSize: 28,
      color: theme.colors.text,
      textAlign: 'center',
      lineHeight: 36,
      letterSpacing: -0.3,
      marginBottom: theme.spacing.s,
    },
    subtitle: {
      fontSize: theme.typography.fontSizes.m,
      fontFamily: theme.typography.fontFamily.regular,
      color: theme.colors.textSecondary,
      textAlign: 'center',
      lineHeight: 22,
    },
    inputContainer: {
      marginBottom: getResponsiveSpacing(theme.spacing.xl),
    },
    textInput: {
      backgroundColor: theme.colors.white,
      borderRadius: theme.radii.l,
      paddingHorizontal: getResponsiveSpacing(theme.spacing.l),
      paddingVertical: getResponsiveSpacing(theme.spacing.l),
      fontSize: theme.typography.fontSizes.m,
      fontFamily: theme.typography.fontFamily.regular,
      color: theme.colors.text,
      minHeight: 200,
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
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      paddingHorizontal: theme.spacing.l,
      paddingBottom: getResponsiveSpacing(theme.spacing.xl),
    },
    continueButton: {
      backgroundColor: theme.colors.primary,
      borderRadius: theme.radii.l,
      paddingVertical: getResponsiveSpacing(theme.spacing.m),
      alignItems: 'center',
      justifyContent: 'center',
      width: '100%',
      shadowColor: theme.colors.black,
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    },
    continueButtonText: {
      fontSize: theme.typography.fontSizes.m,
      fontFamily: theme.typography.fontFamily.semiBold,
      color: 'white',
    },
  });
};