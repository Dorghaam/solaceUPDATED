import { GoogleSignin } from '@react-native-google-signin/google-signin';

export function configureGoogleSignIn() {
  try {
    const webClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
    if (!webClientId) {
      console.warn('Google Sign-In: webClientId is missing from environment variables.');
      return;
    }

    GoogleSignin.configure({
      webClientId,
      offlineAccess: true, // if you want to access Google API on behalf of the user FROM YOUR SERVER
    });
    console.log('Google Sign-In configured successfully.');
  } catch (error) {
    console.warn(`Google Sign-In configuration failed. This is expected in Expo Go. Error: ${error.message}`);
  }
} 