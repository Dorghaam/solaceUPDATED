import { GoogleSignin } from '@react-native-google-signin/google-signin';
import Constants from 'expo-constants';

// This flag ensures we only configure it once.
let isGoogleSignInConfigured = false;

export function configureGoogleSignIn() {
  if (isGoogleSignInConfigured) {
    return;
  }

  // Retrieve the Web Client ID from your environment variables.
  // This is the most critical piece of the configuration.
  const webClientId = Constants.expoConfig?.extra?.GOOGLE_WEB_CLIENT_ID as string;

  if (!webClientId) {
    console.error("Google Sign-In Error: Missing GOOGLE_WEB_CLIENT_ID in app.config.js extra section. Sign-in will fail.");
    return;
  }

  try {
    GoogleSignin.configure({
      // webClientId is required for Google Sign-In to work on both platforms
      webClientId: webClientId,
      // offlineAccess is required for getting an idToken
      offlineAccess: true, 
    });
    
    console.log('[GoogleAuth] Google Sign-In configured successfully.');
    isGoogleSignInConfigured = true;

  } catch (error) {
    console.error('[GoogleAuth] Error configuring Google Sign-In:', error);
  }
} 