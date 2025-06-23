import React, { useState } from 'react';
import { StyleSheet, SafeAreaView, View, Text, Pressable, Switch, Alert } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../constants/theme';
import { useUserStore } from '../../store/userStore';
import { scheduleDailyAffirmationReminders, cancelAllScheduledAffirmationReminders, getPushTokenAndPermissionsAsync } from '../../services/notificationService';
import * as Haptics from 'expo-haptics';

export default function RemindersPage() {
  const { setNotificationSettings } = useUserStore();
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [selectedFrequency, setSelectedFrequency] = useState(3); // Default to 3x
  const [isSchedulingNotifications, setIsSchedulingNotifications] = useState(false);

  const handleFrequencyChange = (direction: 'increase' | 'decrease') => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    if (direction === 'increase' && selectedFrequency < 10) {
      setSelectedFrequency(selectedFrequency + 1);
    } else if (direction === 'decrease' && selectedFrequency > 1) {
      setSelectedFrequency(selectedFrequency - 1);
    }
  };

  const generateCustomNotificationTimes = (frequency: number) => {
    const times: { hour: number; minute: number }[] = [];
    
    // Fixed time range: 9 AM to 10 PM (13 hours)
    const startHour = 9;
    const startMinute = 0;
    const endHour = 22;
    const endMinute = 0;
    
    // Calculate the time range in minutes (13 hours = 780 minutes)
    const startTimeInMinutes = startHour * 60 + startMinute; // 540 minutes (9:00 AM)
    const endTimeInMinutes = endHour * 60 + endMinute; // 1320 minutes (10:00 PM)
    const totalMinutes = endTimeInMinutes - startTimeInMinutes; // 780 minutes
    
    // Calculate interval between notifications
    const interval = Math.floor(totalMinutes / frequency);
    
    for (let i = 0; i < frequency; i++) {
      const timeInMinutes = startTimeInMinutes + (i * interval);
      const hour = Math.floor(timeInMinutes / 60);
      const minute = timeInMinutes % 60;
      
      times.push({ hour, minute });
    }
    
    return times;
  };

  const handleToggleNotifications = async (enabled: boolean) => {
    setNotificationsEnabled(enabled);
    
    if (enabled) {
      // Request permissions when enabling notifications
      try {
        const token = await getPushTokenAndPermissionsAsync();
        if (!token) {
          // Permission denied
          setNotificationsEnabled(false);
          return;
        }
      } catch (error) {
        console.error('Failed to get notification permissions:', error);
        Alert.alert(
          'Permission Error',
          'Unable to get notification permissions. Please check your device settings.',
          [{ text: 'OK' }]
        );
        setNotificationsEnabled(false);
        return;
      }
    } else {
      // Cancel all notifications when disabling
      try {
        await cancelAllScheduledAffirmationReminders();
        console.log('All notifications cancelled');
      } catch (error) {
        console.error('Failed to cancel notifications:', error);
      }
    }
  };

  const handleAllowAndSave = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    if (!notificationsEnabled) {
      Alert.alert(
        'Notifications Disabled',
        'Please enable notifications to set up reminders.',
        [{ text: 'OK' }]
      );
      return;
    }
    
    setIsSchedulingNotifications(true);

    try {
      // First, request permissions and enable notifications
      const token = await getPushTokenAndPermissionsAsync();
      if (!token) {
        Alert.alert(
          'Permission Required',  
          'Please allow notifications to receive daily motivational reminders.',
          [{ text: 'OK' }]
        );
        setIsSchedulingNotifications(false);
        return;
      }

      // Generate custom notification times based on frequency (9 AM to 10 PM)
      const customTimes = generateCustomNotificationTimes(selectedFrequency);
      
      // Schedule notifications with custom times and general healing category
      await scheduleDailyAffirmationReminders(
        'custom',
        customTimes,
        ['general_healing'] // Automatically set to general healing
      );

      // Update user store with settings
      setNotificationSettings({
        enabled: true,
        frequency: `${selectedFrequency}x` as any,
      });

      // Navigate to lockscreen widget setup after successful setup
      router.push('/(onboarding)/lockscreenwidget');
    } catch (error) {
      console.error('Failed to schedule notifications:', error);
      Alert.alert(
        'Error',
        'Failed to schedule notifications. You can set them up later in settings.',
        [
          { 
            text: 'Continue', 
            onPress: () => router.push('/(onboarding)/lockscreenwidget')
          }
        ]
      );
    } finally {
      setIsSchedulingNotifications(false);
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
        <View style={styles.container}>
          {/* Header Text */}
          <View style={styles.headerTextSection}>
            <Text style={styles.mainTitle}>Stay Strong{'\n'}Throughout the Day</Text>
            <Text style={styles.subtitle}>
              Healing reminders when you need them most.{'\n'}Don't worry - you can always change these{'\n'}settings later in the app.
            </Text>
          </View>

          {/* Quote Card */}
          <View style={styles.quoteCard}>
            <Text style={styles.quoteCardTitle}>Solace</Text>
            <Text style={styles.quoteText}>
              Your healing journey is valid, and you're exactly where you need to be right now.
            </Text>
          </View>

          {/* Enable Notifications Toggle */}
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionLabel}>Enable Notifications</Text>
            <View style={styles.toggleContainer}>
              <Text style={styles.toggleLabel}>
                {notificationsEnabled ? 'Notifications enabled' : 'Notifications disabled'}
              </Text>
              <Switch
                value={notificationsEnabled}
                onValueChange={handleToggleNotifications}
                trackColor={{ false: '#767577', true: theme.colors.primary }}
                thumbColor={notificationsEnabled ? '#f4f3f4' : '#f4f3f4'}
              />
            </View>
          </View>

          {/* How Many Section */}
          <View style={[styles.sectionContainer, { opacity: notificationsEnabled ? 1 : 0.5 }]}>
            <Text style={styles.sectionLabel}>How Many</Text>
            <View style={styles.frequencyContainer}>
              <Pressable
                style={[styles.frequencyButton, { opacity: notificationsEnabled ? 1 : 0.5 }]}
                onPress={() => notificationsEnabled && handleFrequencyChange('decrease')}
                disabled={!notificationsEnabled}
              >
                <Ionicons name="remove" size={20} color="white" />
              </Pressable>
              <Text style={styles.frequencyText}>{selectedFrequency}x</Text>
              <Pressable
                style={[styles.frequencyButton, { opacity: notificationsEnabled ? 1 : 0.5 }]}
                onPress={() => notificationsEnabled && handleFrequencyChange('increase')}
                disabled={!notificationsEnabled}
              >
                <Ionicons name="add" size={20} color="white" />
              </Pressable>
            </View>
          </View>

          {/* Spacer */}
          <View style={styles.spacer} />

          {/* Allow and Save Button */}
          <View style={styles.bottomSection}>
            <Pressable 
              style={[
                styles.allowButton,
                { 
                  opacity: isSchedulingNotifications ? 0.7 : (notificationsEnabled ? 1 : 0.5),
                  backgroundColor: notificationsEnabled ? theme.colors.primary : theme.colors.textSecondary 
                }
              ]} 
              onPress={handleAllowAndSave}
              disabled={isSchedulingNotifications}
            >
              <Text style={styles.allowButtonText}>
                {isSchedulingNotifications ? 'Setting up...' : (notificationsEnabled ? 'Save and Continue' : 'Enable Notifications First')}
              </Text>
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
  headerTextSection: {
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
    paddingTop: theme.spacing.xl,
  },
  mainTitle: {
    fontSize: 32,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.text,
    textAlign: 'center',
    marginBottom: theme.spacing.s,
    lineHeight: 38,
  },
  subtitle: {
    fontSize: theme.typography.fontSizes.m,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  quoteCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: theme.radii.l,
    padding: theme.spacing.l,
    marginBottom: theme.spacing.xl,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
  },
  quoteCardTitle: {
    fontSize: theme.typography.fontSizes.m,
    fontFamily: theme.typography.fontFamily.semiBold,
    color: theme.colors.text,
    marginBottom: theme.spacing.s,
  },
  quoteText: {
    fontSize: theme.typography.fontSizes.m,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.textSecondary,
    lineHeight: 22,
  },
  sectionContainer: {
    marginBottom: theme.spacing.l,
  },
  sectionLabel: {
    fontSize: theme.typography.fontSizes.m,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.text,
    marginBottom: theme.spacing.s,
  },
  frequencyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: theme.radii.l,
    padding: theme.spacing.m,
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
  },
  frequencyButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  frequencyText: {
    fontSize: 20,
    fontFamily: theme.typography.fontFamily.semiBold,
    color: theme.colors.text,
  },
  spacer: {
    flex: 1,
  },
  bottomSection: {
    paddingBottom: theme.spacing.xl,
  },
  allowButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radii.l,
    paddingVertical: theme.spacing.m,
    alignItems: 'center',
    justifyContent: 'center',
  },
  allowButtonText: {
    fontSize: theme.typography.fontSizes.m,
    fontFamily: theme.typography.fontFamily.semiBold,
    color: 'white',
  },
  toggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: theme.radii.l,
    padding: theme.spacing.m,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
  },
  toggleLabel: {
    fontSize: theme.typography.fontSizes.m,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.text,
  },
}); 