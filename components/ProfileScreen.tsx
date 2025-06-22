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
import { router } from 'expo-router';
import { theme } from '../constants/theme';
import { signOut } from '../services/authService';
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
  const [profileName, setProfileName] = useState('Johnson');
  const [profilePhone, setProfilePhone] = useState('0987654321');
  const [profileEmail, setProfileEmail] = useState('michaeljohnson@gmail.com');
  const [countryCode, setCountryCode] = useState('+1');
  
  // Get user data from store
  const userName = useUserStore((state) => state.userName);
  const supabaseUser = useUserStore((state) => state.supabaseUser);

  // Set initial profile data from store when component mounts
  useEffect(() => {
    if (userName) {
      setProfileName(userName);
    }
    if (supabaseUser?.email) {
      setProfileEmail(supabaseUser.email);
    }
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
                // First close the modal
                handleClose();
                // Then sign out and redirect
                await signOut();
                console.log('ProfileScreen: Sign out successful, redirecting to onboarding');
                router.replace('/(onboarding)');
              } catch (error: any) {
                console.error('ProfileScreen: Sign out error:', error);
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
    backgroundColor: '#5D4E75', // Dark purple like in the image
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
}); 