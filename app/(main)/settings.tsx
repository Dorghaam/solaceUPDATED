import React from 'react';
import { View, Text, StyleSheet, Pressable, Alert, Platform } from 'react-native';
import { router } from 'expo-router';
import { theme } from '../../constants/theme';
import { useAuthGuard } from '../../utils';
import { signOut } from '../../services/authService';
import { hapticService } from '../../services/hapticService';
import { Ionicons } from '@expo/vector-icons';

export default function SettingsScreen() {
  // Authentication guard - redirects to onboarding if not authenticated
  const { shouldRender } = useAuthGuard();

  // If user is not authenticated, don't render anything (useAuthGuard handles redirect)
  if (!shouldRender) {
    return null;
  }

  const handleSignOut = async () => {
    try {
      hapticService.light();
      Alert.alert(
        'Sign Out',
        'Are you sure you want to sign out?',
        [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: 'Sign Out',
            style: 'destructive',
            onPress: async () => {
              try {
                console.log('Settings: Starting sign out process...');
                
                // Perform sign out
                await signOut();
                console.log('Settings: Sign out successful');
                
                // Small delay to ensure state changes are processed
                setTimeout(() => {
                  try {
                    console.log('Settings: Navigating to onboarding...');
                    router.replace('/(onboarding)');
                  } catch (navError) {
                    console.error('Settings: Navigation error:', navError);
                    // The auth state change will handle the redirect
                  }
                }, 100);
                
              } catch (error: any) {
                console.error('Settings: Sign out error:', error);
                Alert.alert('Error', 'Failed to sign out. Please try again.');
              }
            },
          },
        ]
      );
    } catch (error) {
      console.error('Settings: Error showing sign out alert:', error);
    }
  };

  const handleWidgetConfig = () => {
    hapticService.selection();
    if (Platform.OS !== 'ios') {
      Alert.alert('iOS Only', 'Widgets are only available on iOS devices.');
      return;
    }
    router.push('/(main)/widgetconfig');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.text}>Settings Screen</Text>
      
      {/* Settings Options */}
      <View style={styles.settingsContainer}>
        
        {/* Widget Configuration - iOS Only */}
        {Platform.OS === 'ios' && (
          <Pressable
            style={({ pressed }) => [
              styles.settingItem,
              pressed && styles.settingItemPressed
            ]}
            onPress={handleWidgetConfig}
          >
            <View style={styles.settingItemContent}>
              <Ionicons name="grid-outline" size={24} color="#FF69B4" />
              <View style={styles.settingItemText}>
                <Text style={styles.settingItemTitle}>Widget Configuration</Text>
                <Text style={styles.settingItemSubtitle}>Customize your lock screen widget</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#666" />
            </View>
          </Pressable>
        )}
      </View>
      
      <View style={styles.signOutContainer}>
        <Pressable
          style={({ pressed }) => [
            styles.signOutButton,
            pressed && styles.signOutButtonPressed
          ]}
          onPress={handleSignOut}
        >
          <Text style={styles.signOutButtonText}>Sign Out</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    paddingTop: 60,
  },
  text: {
    fontSize: theme.typography.fontSizes.l,
    fontFamily: theme.typography.fontFamily.semiBold,
    color: theme.colors.text,
    textAlign: 'center',
    marginBottom: 40,
  },
  settingsContainer: {
    paddingHorizontal: 20,
    flex: 1,
  },
  settingItem: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 12,
    paddingVertical: 16,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  settingItemPressed: {
    backgroundColor: '#F8F8F8',
    transform: [{ scale: 0.98 }],
  },
  settingItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  settingItemText: {
    flex: 1,
  },
  settingItemTitle: {
    fontSize: 16,
    fontFamily: theme.typography.fontFamily.semiBold,
    color: theme.colors.text,
    marginBottom: 2,
  },
  settingItemSubtitle: {
    fontSize: 14,
    color: '#666',
    fontFamily: theme.typography.fontFamily.regular,
  },
  signOutContainer: {
    paddingHorizontal: 20,
    paddingBottom: 60,
  },
  signOutButton: {
    backgroundColor: '#FF6B6B',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  signOutButtonPressed: {
    backgroundColor: '#FF5252',
    transform: [{ scale: 0.98 }],
  },
  signOutButtonText: {
    color: 'white',
    fontSize: 16,
    fontFamily: theme.typography.fontFamily.semiBold,
  },
}); 