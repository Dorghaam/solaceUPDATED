import { GoogleSignin } from '@react-native-google-signin/google-signin';
import Constants from 'expo-constants';

export const configureGoogleSignIn = () => {
  try {
    const webClientId = Constants.expoConfig?.extra?.googleWebClientId as string | undefined;
    // This is your iOS Client ID from the GoogleService-Info.plist
    const iosClientId = "791966352436-ds9guvagr07rk1fhr5dua5feob3i16vc.apps.googleusercontent.com"; 

    if (!webClientId || !iosClientId) {
      console.error(
        "Google Sign-In configure ERROR: webClientId or iosClientId is missing. " +
        "Ensure EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID is in your .env and the correct iOS Client ID is in this file."
      );
      return;
    }

    GoogleSignin.configure({
      webClientId: webClientId, // For Supabase token verification
      iosClientId: iosClientId, // For the native iOS module
      offlineAccess: true,      // Required to get an idToken
    });
    console.log("services/googleAuthService.ts: Google Sign-In configured successfully with Web and iOS Client IDs.");
  } catch (error) {
    console.error("services/googleAuthService.ts: Error configuring Google Sign-In:", error);
  }
}; 