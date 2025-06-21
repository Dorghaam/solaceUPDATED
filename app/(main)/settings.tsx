import React from 'react';
import { View, Text, StyleSheet, Pressable, Alert } from 'react-native';
import { router } from 'expo-router';
import { theme } from '../../constants/theme';
import { useAuthGuard } from '../../utils';
import { signOut } from '../../services/authService';
import { hapticService } from '../../services/hapticService';

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
                await signOut();
                console.log('Settings: Sign out successful, redirecting to onboarding');
                router.replace('/(onboarding)');
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

  return (
    <View style={styles.container}>
      <Text style={styles.text}>Settings Screen</Text>
      
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
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
  },
  text: {
    fontSize: theme.typography.fontSizes.l,
    fontFamily: theme.typography.fontFamily.semiBold,
    color: theme.colors.text,
  },
  signOutContainer: {
    position: 'absolute',
    bottom: 60,
    left: 20,
    right: 20,
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