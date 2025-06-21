import React, { useState } from 'react';
import { Alert } from 'react-native';
import { LoginScreen } from '../../components/onboarding/LoginScreen';
import { loginWithApple, loginWithGoogle } from '../../services/authService';

export default function LoginPage() {
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isAppleLoading, setIsAppleLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    try {
      const result = await loginWithGoogle();
      console.log('Google sign-in successful:', result);
      // On success, the onAuthStateChange listener in _layout.tsx will handle navigation
    } catch (error: any) {
      console.error('Google sign-in error:', error);
      Alert.alert('Sign-In Error', 'Could not sign in with Google. Please try again.');
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleAppleSignIn = async () => {
    setIsAppleLoading(true);
    try {
      const result = await loginWithApple();
      if (result) {
        console.log('Apple sign-in successful:', result);
        // On success, the onAuthStateChange listener in _layout.tsx will handle navigation
      }
      // If result is null, it means the user cancelled - no need to show error
    } catch (error: any) {
      console.error('Apple sign-in error:', error);
      if (error.code !== 'ERR_REQUEST_CANCELED') {
        Alert.alert('Sign-In Error', 'Could not sign in with Apple. Please try again.');
      }
    } finally {
      setIsAppleLoading(false);
    }
  };

  return (
    <LoginScreen
      onGooglePress={handleGoogleSignIn}
      onApplePress={handleAppleSignIn}
      isGoogleLoading={isGoogleLoading}
      isAppleLoading={isAppleLoading}
    />
  );
} 