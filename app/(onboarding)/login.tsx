import React, { useState } from 'react';
import { Alert } from 'react-native';
import { router } from 'expo-router';
import { LoginScreen } from '../../components/onboarding/LoginScreen';
import { loginWithApple, loginWithGoogle } from '../../services/authService';

export default function LoginPage() {
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isAppleLoading, setIsAppleLoading] = useState(false);

  const handleSuccess = () => {
    router.replace('/(onboarding)/paywall');
  };

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    try {
      await loginWithGoogle();
      handleSuccess();
    } catch (error: any) {
      console.error('Google sign-in error:', error);
      Alert.alert('Sign-In Error', 'Could not sign in with Google. Please try again.');
      setIsGoogleLoading(false);
    }
  };

  const handleAppleSignIn = async () => {
    setIsAppleLoading(true);
    try {
      const result = await loginWithApple();
      if (result) {
        handleSuccess();
      } else {
        setIsAppleLoading(false);
      }
    } catch (error: any) {
      if (error.code !== 'ERR_REQUEST_CANCELED') {
        Alert.alert('Sign-In Error', 'Could not sign in with Apple. Please try again.');
      }
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