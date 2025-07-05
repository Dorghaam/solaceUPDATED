// app/(onboarding)/reminders.tsx

import React, { useState } from 'react';
import { StyleSheet, SafeAreaView, View, Text, Pressable, Switch, Alert } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../constants/theme';
import { useUserStore } from '../../store/userStore';
import { scheduleDailyAffirmationReminders, cancelAllScheduledAffirmationReminders, getPushTokenAndPermissionsAsync } from '../../services/notificationService';
import { getResponsiveFontSize, getResponsiveSpacing } from '../../utils/responsive';
import * as Haptics from 'expo-haptics';

export default function RemindersPage() {
  const { setNotificationSettings } = useUserStore();
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [selectedFrequency, setSelectedFrequency] = useState(3); // Default to 3x
  const [isSchedulingNotifications, setIsSchedulingNotifications] = useState(false);

  // --- LOGIC (No changes needed here, it's already solid) ---
  const handleFrequencyChange = (direction: 'increase' | 'decrease') => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (direction === 'increase' && selectedFrequency < 10) setSelectedFrequency(selectedFrequency + 1);
    else if (direction === 'decrease' && selectedFrequency > 1) setSelectedFrequency(selectedFrequency - 1);
  };
  const generateCustomNotificationTimes = (frequency: number) => {
    const times: { hour: number; minute: number }[] = [];
    const startHour = 9, endHour = 22;
    const totalMinutes = (endHour - startHour) * 60;
    const interval = Math.floor(totalMinutes / frequency);
    for (let i = 0; i < frequency; i++) {
      const timeInMinutes = (startHour * 60) + (i * interval);
      times.push({ hour: Math.floor(timeInMinutes / 60), minute: timeInMinutes % 60 });
    }
    return times;
  };
  const handleToggleNotifications = async (enabled: boolean) => {
    setNotificationsEnabled(enabled);
    if (enabled) {
      try {
        const token = await getPushTokenAndPermissionsAsync();
        if (!token) setNotificationsEnabled(false);
      } catch (error) {
        Alert.alert('Permission Error', 'Unable to get notification permissions. Please check your device settings.');
        setNotificationsEnabled(false);
      }
    } else {
      await cancelAllScheduledAffirmationReminders().catch(console.error);
    }
  };
  const handleAllowAndSave = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (!notificationsEnabled) {
      setNotificationSettings({ enabled: false, frequency: `${selectedFrequency}x` as any });
      router.push('/(onboarding)/lockscreenwidget');
      return;
    }
    setIsSchedulingNotifications(true);
    try {
      const token = await getPushTokenAndPermissionsAsync();
      if (!token) {
        setNotificationSettings({ enabled: false, frequency: `${selectedFrequency}x` as any });
        router.push('/(onboarding)/lockscreenwidget');
        return;
      }
      const customTimes = generateCustomNotificationTimes(selectedFrequency);
      await scheduleDailyAffirmationReminders('custom', customTimes, ['general_healing']);
      setNotificationSettings({ enabled: true, frequency: `${selectedFrequency}x` as any });
      router.push('/(onboarding)/lockscreenwidget');
    } catch (error) {
      console.error('Failed to schedule notifications:', error);
      setNotificationSettings({ enabled: false, frequency: `${selectedFrequency}x` as any });
      router.push('/(onboarding)/lockscreenwidget');
    } finally {
      setIsSchedulingNotifications(false);
    }
  };
  // --- END OF LOGIC ---

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
          <View style={styles.headerTextSection}>
            <Text style={styles.mainTitle}>A reminder when you need it most.</Text>
            <Text style={styles.subtitle}>
              Healing isn't linear. Let us send you a little strength right when you need to hear it.
            </Text>
          </View>

          {/* Quote Card */}
          <View style={styles.quoteCard}>
            <Text style={styles.quoteCardTitle}>Solace</Text>
            <Text style={styles.quoteText}>
              You are rebuilding yourself, and that takes courage. Be proud of this step.
            </Text>
          </View>

          {/* Enable Notifications Toggle */}
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionLabel}>Receive daily affirmations</Text>
            <View style={styles.toggleContainer}>
              <Text style={styles.toggleLabel}>
                {notificationsEnabled ? 'Reminders On' : 'Reminders Off'}
              </Text>
              <Switch
                value={notificationsEnabled}
                onValueChange={handleToggleNotifications}
                trackColor={{ false: '#767577', true: theme.colors.primary }}
                thumbColor={'#f4f3f4'}
              />
            </View>
          </View>

          {/* How Many Section */}
          <View style={[styles.sectionContainer, { opacity: notificationsEnabled ? 1 : 0.5 }]}>
            <Text style={styles.sectionLabel}>How often?</Text>
            <View style={styles.frequencyContainer}>
              <Pressable
                style={styles.frequencyButton}
                onPress={() => handleFrequencyChange('decrease')}
                disabled={!notificationsEnabled}
              >
                <Ionicons name="remove" size={20} color="white" />
              </Pressable>
              <Text style={styles.frequencyText}>{selectedFrequency}x per day</Text>
              <Pressable
                style={styles.frequencyButton}
                onPress={() => handleFrequencyChange('increase')}
                disabled={!notificationsEnabled}
              >
                <Ionicons name="add" size={20} color="white" />
              </Pressable>
            </View>
            <Text style={styles.settingsNote}>
              You can change the categories and amount in settings later.
            </Text>
          </View>

          <View style={styles.spacer} />
        </View>

        {/* Floating Continue Button */}
        <View style={styles.floatingButtonContainer}>
          <Pressable 
            style={({ pressed }) => [
              styles.allowButton,
              { 
                opacity: isSchedulingNotifications ? 0.7 : (pressed ? 0.9 : 1),
                transform: [{ scale: pressed ? 0.98 : 1 }]
              }
            ]} 
            onPress={handleAllowAndSave}
            disabled={isSchedulingNotifications}
          >
            <Text style={styles.allowButtonText}>
              {isSchedulingNotifications ? 'Saving...' : 'Continue'}
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

// --- STYLES (Minor tweaks for text alignment and size) ---
const styles = StyleSheet.create({
  backgroundGradient: { flex: 1 },
  safeArea: { flex: 1 },
  container: {
    flex: 1,
    paddingHorizontal: theme.spacing.l,
  },
  headerTextSection: {
    alignItems: 'center',
    marginBottom: getResponsiveSpacing(theme.spacing.l),
    paddingTop: getResponsiveSpacing(theme.spacing.xl),
  },
  mainTitle: {
    fontSize: getResponsiveFontSize(28),
    fontFamily: theme.typography.fontFamily.semiBold,
    color: theme.colors.text,
    textAlign: 'center',
    marginBottom: getResponsiveSpacing(theme.spacing.m),
    lineHeight: getResponsiveFontSize(36),
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: theme.typography.fontSizes.m,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: getResponsiveFontSize(24), // Increased line height
    maxWidth: '95%',
  },
  quoteCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: theme.radii.l,
    padding: getResponsiveSpacing(theme.spacing.l),
    marginVertical: getResponsiveSpacing(theme.spacing.l),
    shadowColor: theme.colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  quoteCardTitle: {
    fontSize: getResponsiveFontSize(16),
    fontFamily: theme.typography.fontFamily.semiBold,
    color: theme.colors.text,
    marginBottom: getResponsiveSpacing(theme.spacing.s),
  },
  quoteText: {
    fontSize: getResponsiveFontSize(16),
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.textSecondary,
    lineHeight: getResponsiveFontSize(22),
  },
  sectionContainer: {
    marginBottom: getResponsiveSpacing(theme.spacing.l),
  },
  sectionLabel: {
    fontSize: getResponsiveFontSize(18),
    fontFamily: theme.typography.fontFamily.semiBold,
    color: theme.colors.text,
    marginBottom: getResponsiveSpacing(theme.spacing.m),
  },
  toggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: theme.radii.m,
    padding: getResponsiveSpacing(theme.spacing.m),
  },
  toggleLabel: {
    fontSize: getResponsiveFontSize(16),
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.text,
  },
  frequencyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: theme.radii.m,
    padding: getResponsiveSpacing(theme.spacing.m),
    marginBottom: getResponsiveSpacing(theme.spacing.s),
  },
  frequencyButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radii.s,
    padding: getResponsiveSpacing(theme.spacing.s),
  },
  frequencyText: {
    fontSize: getResponsiveFontSize(16),
    fontFamily: theme.typography.fontFamily.semiBold,
    color: theme.colors.text,
  },
  settingsNote: {
    fontSize: getResponsiveFontSize(14),
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: getResponsiveFontSize(18),
  },
  spacer: {
    flex: 1,
  },
  floatingButtonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: theme.spacing.l,
    paddingBottom: getResponsiveSpacing(theme.spacing.xl),
  },
  allowButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radii.l,
    paddingVertical: getResponsiveSpacing(theme.spacing.m),
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
  allowButtonText: {
    fontSize: theme.typography.fontSizes.m,
    fontFamily: theme.typography.fontFamily.semiBold,
    color: theme.colors.white,
  },
});