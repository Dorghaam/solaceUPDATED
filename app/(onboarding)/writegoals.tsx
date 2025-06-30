// app/(onboarding)/writegoals.tsx

import React, { useState } from 'react';
import { StyleSheet, SafeAreaView, View, Text, Pressable, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../../constants/theme';
import { useUserStore } from '../../store/userStore';
import { getResponsiveFontSize, getResponsiveSpacing } from '../../utils/responsive';
import * as Haptics from 'expo-haptics';

export default function WriteGoalsPage() {
  const [goals, setGoals] = useState<string>('');
  const { setHealingGoals } = useUserStore();

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
                placeholder="I want to rebuild my confidence and learn to love myself again..."
                placeholderTextColor={theme.colors.textSecondary}
                multiline
                textAlignVertical="top"
                maxLength={500}
                returnKeyType="done"
                onSubmitEditing={handleSaveGoals}
                blurOnSubmit={true}
              />
            </View>

            {/* Spacer */}
            <View style={styles.spacer} />

            {/* Save Goals Button */}
            <View style={styles.bottomSection}>
              <Pressable
                style={({ pressed }) => [
                  styles.saveButton,
                  { 
                    opacity: pressed ? 0.9 : 1,
                    transform: [{ scale: pressed ? 0.98 : 1 }]
                  }
                ]}
                onPress={handleSaveGoals}
              >
                <Text style={styles.saveButtonText}>Save My Goals</Text>
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}

// --- UPDATED STYLESHEET WITH RESPONSIVE STYLING ---
const styles = StyleSheet.create({
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
    paddingHorizontal: theme.spacing.l,
  },
  headerSection: {
    alignItems: 'center',
    marginBottom: getResponsiveSpacing(theme.spacing.xl),
    paddingTop: getResponsiveSpacing(theme.spacing.xl),
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
    lineHeight: getResponsiveFontSize(22),
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
  spacer: {
    flex: 1,
  },
  bottomSection: {
    paddingBottom: getResponsiveSpacing(theme.spacing.xl),
  },
  saveButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: getResponsiveSpacing(theme.spacing.m),
    paddingHorizontal: getResponsiveSpacing(theme.spacing.xl),
    borderRadius: theme.radii.l,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  saveButtonText: {
    fontFamily: theme.typography.fontFamily.semiBold,
    fontSize: theme.typography.fontSizes.m,
    color: theme.colors.white,
  },
});