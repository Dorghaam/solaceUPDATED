import React, { useState } from 'react';
import { StyleSheet, SafeAreaView, View, Text, Pressable } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../../constants/theme';
import * as Haptics from 'expo-haptics';

const relationshipOptions = [
  'Recently went through a breakup',
  'Going through a divorce',
  'Focusing on Myself',
  'Healing from a past relationship',
  'Single and ready to heal',
  'It\'s complicated',
  'Prefer not to say'
];

export default function RelationshipPage() {
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);

  const handleStatusPress = (status: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSelectedStatus(status);
    // Here you could save the selectedStatus to analytics or user preferences
    // Small delay to show selection before navigating
    setTimeout(() => {
      router.push('/(onboarding)/spiritual');
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
          <Text style={styles.title}>Where Are You In{'\n'}Your Healing Journey?</Text>
          <Text style={styles.subtitle}>
            We'll send you the perfect reminders for{'\n'}exactly where you are right now.
          </Text>

          {/* Relationship status options list */}
          <View style={styles.optionsContainer}>
            {relationshipOptions.map((status, index) => (
              <Pressable
                key={status}
                style={({ pressed }) => [
                  styles.statusButton,
                  selectedStatus === status && styles.selectedStatus,
                  { 
                    opacity: pressed ? 0.8 : 1,
                    transform: [{ scale: pressed ? 0.98 : 1 }]
                  }
                ]}
                onPress={() => handleStatusPress(status)}
              >
                <Text style={[
                  styles.statusText,
                  selectedStatus === status && styles.selectedStatusText
                ]}>
                  {status}
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
  statusButton: {
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
  selectedStatus: {
    borderColor: theme.colors.text,
  },
  statusText: {
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: theme.typography.fontSizes.m,
    color: theme.colors.text,
    textAlign: 'left',
  },
  selectedStatusText: {
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.text,
  },
}); 