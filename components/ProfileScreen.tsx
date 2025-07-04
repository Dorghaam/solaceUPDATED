import React, { useState, useRef, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Pressable,
  Dimensions,
  Animated,
  ScrollView,
  Alert,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { PanGestureHandler, State } from 'react-native-gesture-handler';
import { theme } from '../constants/theme';
import { signOut, deleteCurrentUserAccount } from '../services/authService';
import { useUserStore } from '../store/userStore';
import * as Haptics from 'expo-haptics';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface ProfileScreenProps {
  visible: boolean;
  onClose: () => void;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({
  visible,
  onClose,
}) => {
  const slideAnim = useRef(new Animated.Value(screenHeight)).current;
  const backgroundOpacity = useRef(new Animated.Value(0)).current;
  const panY = useRef(new Animated.Value(0)).current;

  // Profile form state
  const [profileName, setProfileName] = useState('');
  const [profilePhone, setProfilePhone] = useState(''); // Empty by default
  const [profileEmail, setProfileEmail] = useState('');
  const [countryCode, setCountryCode] = useState('+1');
  
  // Get user data from store
  const userName = useUserStore((state) => state.userName);
  const supabaseUser = useUserStore((state) => state.supabaseUser);

  // Set initial profile data from store when component mounts
  useEffect(() => {
    // Always set the name from the user store (from onboarding flow)
    if (userName) {
      setProfileName(userName);
    }
    // Set email from authenticated user
    if (supabaseUser?.email) {
      setProfileEmail(supabaseUser.email);
    }
    // Phone remains empty as requested
  }, [userName, supabaseUser]);

  useEffect(() => {
    if (visible) {
      // Reset pan gesture and slide up animation
      panY.setValue(0);
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(backgroundOpacity, {
          toValue: 0.5,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // Slide down animation
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: screenHeight,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(backgroundOpacity, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  const handleClose = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: screenHeight,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(backgroundOpacity, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onClose();
    });
  };

  const handlePanGestureEvent = Animated.event(
    [{ nativeEvent: { translationY: panY } }],
    { useNativeDriver: true }
  );

  const handlePanStateChange = (event: any) => {
    if (event.nativeEvent.state === State.END) {
      const { translationY, velocityY } = event.nativeEvent;
      
      if (translationY > 100 || velocityY > 800) {
        handleClose();
      } else {
        Animated.spring(panY, {
          toValue: 0,
          useNativeDriver: true,
          tension: 100,
          friction: 8,
        }).start();
      }
    }
  };

  const handleProfileSave = () => {
    // Save profile logic here
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    // Update the user store with the new name
    const { setUserName } = useUserStore.getState();
    if (profileName.trim() && profileName !== userName) {
      setUserName(profileName.trim());
    }
    
    Alert.alert('Profile Saved', 'Your profile has been updated successfully.');
  };

  const handleProfileSignOut = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
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
                console.log('ProfileScreen: Starting sign out process...');
                
                // First close the modal
                handleClose();
                
                // Small delay to let modal close animation complete
                setTimeout(async () => {
                  try {
                    // Then sign out
                    await signOut();
                    console.log('ProfileScreen: Sign out successful');
                    
                    // ❌ Remove explicit navigation - let the layout handle it automatically
                    // Small delay to ensure state changes are processed
                    // setTimeout(() => {
                    //   try {
                    //     console.log('ProfileScreen: Navigating to onboarding...');
                    //     router.replace('/(onboarding)');
                    //   } catch (navError) {
                    //     console.error('ProfileScreen: Navigation error:', navError);
                    //     // The auth state change will handle the redirect
                    //   }
                    // }, 100);
                    
                  } catch (error: any) {
                    console.error('ProfileScreen: Sign out error:', error);
                    Alert.alert('Error', 'Failed to sign out. Please try again.');
                  }
                }, 200);
                
              } catch (error: any) {
                console.error('ProfileScreen: Sign out process error:', error);
                Alert.alert('Error', 'Failed to sign out. Please try again.');
              }
            },
          },
        ]
      );
    } catch (error) {
      console.error('ProfileScreen: Error showing sign out alert:', error);
    }
  };

  const handleDeleteProfile = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      Alert.alert(
        'Delete Account',
        'This action cannot be undone. Your account, all data, favorites, and subscription will be permanently deleted.',
        [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: 'Delete Account',
            style: 'destructive',
            onPress: () => {
              // Second confirmation for extra safety
              Alert.alert(
                'Are you absolutely sure?',
                'This will permanently delete your account and all associated data. This action cannot be undone.',
                [
                  {
                    text: 'Cancel',
                    style: 'cancel',
                  },
                  {
                    text: 'Yes, Delete Forever',
                    style: 'destructive',
                    onPress: async () => {
                      try {
                        // Show loading state while deleting
                        Alert.alert('Deleting Account', 'Please wait while we delete your account...');
                        
                        // First close the modal
                        handleClose();
                        
                        // Call the delete function which handles both Supabase and RevenueCat cleanup
                        await deleteCurrentUserAccount();
                        
                        console.log('ProfileScreen: Account deletion successful');
                        // ❌ Remove explicit navigation - let the layout handle it automatically
                        // router.replace('/(onboarding)');
                        
                        // Show success message
                        setTimeout(() => {
                          Alert.alert('Account Deleted', 'Your account has been permanently deleted.');
                        }, 1000);
                        
                      } catch (error: any) {
                        console.error('ProfileScreen: Account deletion error:', error);
                        Alert.alert(
                          'Error', 
                          'Failed to delete your account. Please try again or contact support if the problem persists.'
                        );
                      }
                    },
                  },
                ]
              );
            },
          },
        ]
      );
    } catch (error) {
      console.error('ProfileScreen: Error showing delete account alert:', error);
    }
  };

  if (!visible) {
    return null;
  }

  return (
    <View style={styles.overlay}>
      {/* Background overlay */}
      <Animated.View 
        style={[
          styles.background,
          { opacity: backgroundOpacity }
        ]}
      >
        <Pressable style={styles.backgroundTouchable} onPress={handleClose} />
      </Animated.View>

      {/* Profile Modal content */}
      <PanGestureHandler
        onGestureEvent={handlePanGestureEvent}
        onHandlerStateChange={handlePanStateChange}
      >
        <Animated.View
          style={[
            styles.modal,
            { 
              transform: [
                { translateY: slideAnim },
                { translateY: panY }
              ] 
            }
          ]}
        >
          <LinearGradient
            colors={[theme.colors.lightPink.lightest, theme.colors.lightPink.light]}
            style={styles.modalContent}
          >
            {/* Drag handle */}
            <View style={styles.dragHandle} />
            
            {/* Profile Header */}
            <View style={styles.header}>
              <Pressable style={styles.backButton} onPress={handleClose}>
                <Ionicons name="chevron-back" size={24} color={theme.colors.text} />
              </Pressable>
              <View style={styles.titleContainer}>
                <Text style={styles.headerTitle}>My Profile</Text>
              </View>
            </View>

            {/* Profile Content */}
            <ScrollView 
              style={styles.content}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.scrollContent}
            >
              {/* Name Field */}
              <View style={styles.profileField}>
                <TextInput
                  style={styles.profileInput}
                  value={profileName}
                  onChangeText={setProfileName}
                  placeholder="Enter your name"
                  placeholderTextColor={theme.colors.textSecondary}
                />
              </View>

              {/* Phone Field */}
              <View style={styles.profileField}>
                <View style={styles.phoneContainer}>
                  <View style={styles.countryCodeContainer}>
                    <Text style={styles.countryCodeText}>{countryCode}</Text>
                    <Ionicons name="chevron-down" size={16} color={theme.colors.textSecondary} />
                  </View>
                  <TextInput
                    style={styles.phoneInput}
                    value={profilePhone}
                    onChangeText={setProfilePhone}
                    placeholder="Phone number"
                    placeholderTextColor={theme.colors.textSecondary}
                    keyboardType="phone-pad"
                  />
                </View>
              </View>

              {/* Email Field */}
              <View style={styles.profileField}>
                <TextInput
                  style={styles.profileInput}
                  value={profileEmail}
                  onChangeText={setProfileEmail}
                  placeholder="Enter your email"
                  placeholderTextColor={theme.colors.textSecondary}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              {/* Save Button */}
              <Pressable
                style={({ pressed }) => [
                  styles.saveButton,
                  { opacity: pressed ? 0.8 : 1 }
                ]}
                onPress={handleProfileSave}
              >
                <Text style={styles.saveButtonText}>Save</Text>
              </Pressable>

              {/* Log Out Button */}
              <Pressable
                style={({ pressed }) => [
                  styles.logOutButton,
                  { opacity: pressed ? 0.8 : 1 }
                ]}
                onPress={handleProfileSignOut}
              >
                <Text style={styles.logOutText}>Log Out</Text>
              </Pressable>

              {/* Delete Profile Button */}
              <Pressable
                style={({ pressed }) => [
                  styles.deleteButton,
                  { opacity: pressed ? 0.8 : 1 }
                ]}
                onPress={handleDeleteProfile}
              >
                <View style={styles.deleteButtonContent}>
                  <Ionicons name="trash-outline" size={20} color="#dc3545" />
                  <Text style={styles.deleteButtonText}>Delete Profile</Text>
                </View>
              </Pressable>
            </ScrollView>
          </LinearGradient>
        </Animated.View>
      </PanGestureHandler>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1001, // Higher than settings modal to appear on top
  },
  background: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#000',
  },
  backgroundTouchable: {
    flex: 1,
  },
  modal: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    bottom: 0,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
  },
  modalContent: {
    flex: 1,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  dragHandle: {
    width: 40,
    height: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.m,
    paddingTop: 20,
    paddingBottom: theme.spacing.m,
    position: 'relative',
  },
  backButton: {
    position: 'absolute',
    top: -10,
    left: 0,
    paddingHorizontal: 8,
    paddingVertical: 8,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  titleContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: theme.typography.fontSizes.l,
    fontFamily: theme.typography.fontFamily.semiBold,
    color: theme.colors.text,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: theme.spacing.m,
    paddingBottom: theme.spacing.xl,
    paddingTop: theme.spacing.l,
  },
  profileField: {
    marginBottom: theme.spacing.l,
  },
  profileInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: theme.radii.m,
    paddingHorizontal: theme.spacing.m,
    paddingVertical: theme.spacing.m + 4,
    fontSize: theme.typography.fontSizes.m,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.text,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
  },
  phoneContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: theme.radii.m,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    overflow: 'hidden',
  },
  countryCodeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.m,
    paddingVertical: theme.spacing.m + 4,
    borderRightWidth: 1,
    borderRightColor: 'rgba(0, 0, 0, 0.1)',
    gap: theme.spacing.s,
  },
  countryCodeText: {
    fontSize: theme.typography.fontSizes.m,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.text,
  },
  phoneInput: {
    flex: 1,
    paddingHorizontal: theme.spacing.m,
    paddingVertical: theme.spacing.m + 4,
    fontSize: theme.typography.fontSizes.m,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.text,
  },
  saveButton: {
    backgroundColor: theme.colors.primary, // Use theme pink instead of purple
    borderRadius: theme.radii.m,
    paddingVertical: theme.spacing.m + 4,
    alignItems: 'center',
    marginTop: theme.spacing.xl,
    marginBottom: theme.spacing.m,
  },
  saveButtonText: {
    fontSize: theme.typography.fontSizes.m,
    fontFamily: theme.typography.fontFamily.semiBold,
    color: 'white',
  },
  logOutButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: theme.radii.m,
    paddingVertical: theme.spacing.m + 4,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(0, 0, 0, 0.1)',
  },
  logOutText: {
    fontSize: theme.typography.fontSizes.m,
    fontFamily: theme.typography.fontFamily.semiBold,
    color: theme.colors.text,
  },
  deleteButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: theme.radii.m,
    paddingVertical: theme.spacing.m + 4,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(220, 53, 69, 0.2)', // Light red border
    marginTop: theme.spacing.m,
  },
  deleteButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.s,
  },
  deleteButtonText: {
    fontSize: theme.typography.fontSizes.m,
    fontFamily: theme.typography.fontFamily.semiBold,
    color: '#dc3545', // Red color for delete action
  },
}); 