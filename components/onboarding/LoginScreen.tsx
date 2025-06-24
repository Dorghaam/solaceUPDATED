import React from 'react';
import { StyleSheet, SafeAreaView, View, Text, Pressable, Platform, ActivityIndicator, Image, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../../constants/theme';

interface LoginScreenProps {
  onGooglePress: () => void;
  onApplePress: () => void;
  isGoogleLoading?: boolean;
  isAppleLoading?: boolean;
}

export const LoginScreen = ({
  onGooglePress,
  onApplePress,
  isGoogleLoading,
  isAppleLoading,
}: LoginScreenProps) => {
  const handlePrivacyPolicyPress = () => {
    Linking.openURL('https://sites.google.com/view/solace-app/privacy-policy');
  };

  const handleTermsPress = () => {
    Linking.openURL('https://sites.google.com/view/solace-app/home');
  };

  return (
    <LinearGradient
      colors={[theme.colors.lightPink.lightest, theme.colors.lightPink.light, theme.colors.lightPink.medium]}
      style={styles.backgroundGradient}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
    >
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.headerContainer}>
          <Text style={styles.title}>Create Your Account</Text>
          <Text style={styles.subtitle}>
            Sign in to securely save your progress and favorites.
          </Text>
        </View>
        
        <View style={styles.buttonContainer}>
          {Platform.OS === 'ios' && (
            <Pressable
              style={({ pressed }) => [
                styles.signInButton,
                styles.appleButton,
                { opacity: pressed ? 0.8 : 1, transform: [{ scale: pressed ? 0.98 : 1 }] }
              ]}
              onPress={onApplePress}
              disabled={isAppleLoading}
            >
              {isAppleLoading ? (
                <ActivityIndicator size="small" color={theme.colors.white} />
              ) : (
                <>
                  <Ionicons name="logo-apple" size={20} color={theme.colors.white} />
                  <Text style={styles.appleButtonText}>Sign in with Apple</Text>
                </>
              )}
            </Pressable>
          )}
          
          {Platform.OS === 'ios' && <View style={{ height: theme.spacing.m }} />}
          
          <Pressable
            style={({ pressed }) => [
              styles.signInButton,
              styles.googleButton,
              { opacity: pressed ? 0.8 : 1, transform: [{ scale: pressed ? 0.98 : 1 }] }
            ]}
            onPress={onGooglePress}
            disabled={isGoogleLoading}
          >
            {isGoogleLoading ? (
              <ActivityIndicator size="small" color={theme.colors.text} />
            ) : (
              <>
                <Image 
                  source={require('../../googlesignin.png')} 
                  style={styles.signInLogo}
                  resizeMode="contain"
                />
                <Text style={styles.googleButtonText}>Sign in with Google</Text>
              </>
            )}
          </Pressable>

          {/* Privacy Policy and Terms Links */}
          <View style={styles.legalLinksContainer}>
            <View style={styles.legalTextRow}>
              <Text style={styles.legalText}>By signing in, you agree to our </Text>
              <Pressable onPress={handleTermsPress}>
                <Text style={styles.linkText}>Terms of Service</Text>
              </Pressable>
              <Text style={styles.legalText}> and </Text>
              <Pressable onPress={handlePrivacyPolicyPress}>
                <Text style={styles.linkText}>Privacy Policy</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  backgroundGradient: { 
    flex: 1 
  },
  safeArea: { 
    flex: 1, 
    backgroundColor: 'transparent',
    justifyContent: 'space-between',
  },
  headerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.xl,
  },
  title: { 
    textAlign: 'center', 
    fontSize: 32, 
    fontFamily: theme.typography.fontFamily.semiBold, 
    color: theme.colors.text, 
    marginBottom: theme.spacing.s 
  },
  subtitle: { 
    textAlign: 'center', 
    fontSize: 16, 
    fontFamily: theme.typography.fontFamily.regular, 
    color: theme.colors.textSecondary, 
    lineHeight: 24,
  },
  buttonContainer: { 
    padding: theme.spacing.l 
  },
  signInButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.m,
    paddingHorizontal: theme.spacing.l,
    borderRadius: theme.radii.m,
    gap: theme.spacing.s,
  },
  appleButton: {
    backgroundColor: theme.colors.black,
  },
  googleButton: {
    backgroundColor: theme.colors.white,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
  },
  appleButtonText: {
    fontFamily: theme.typography.fontFamily.semiBold,
    fontSize: theme.typography.fontSizes.m,
    color: theme.colors.white,
  },
  googleButtonText: {
    fontFamily: theme.typography.fontFamily.semiBold,
    fontSize: theme.typography.fontSizes.m,
    color: theme.colors.text,
  },
  signInLogo: {
    width: 20,
    height: 20,
  },
  legalLinksContainer: {
    marginTop: theme.spacing.l,
    alignItems: 'center',
  },
  legalTextRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
  },
  legalText: {
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: 12,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 16,
  },
  linkText: {
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: 12,
    color: theme.colors.black,
    textDecorationLine: 'underline',
  },
}); 