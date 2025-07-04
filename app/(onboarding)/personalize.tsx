import React from 'react';
import { StyleSheet, SafeAreaView, View, Text, Pressable, Image } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../../constants/theme';
import { getResponsiveDimensions, getResponsiveFontSize } from '../../utils/responsive';
import * as Haptics from 'expo-haptics';

export default function PersonalizePage() {
  const responsiveDimensions = getResponsiveDimensions();
  
  const handleMakeItYours = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push('/(onboarding)/age');
  };

  return (
    <LinearGradient
      colors={[theme.colors.lightPink.lightest, theme.colors.lightPink.light, theme.colors.lightPink.medium]}
      style={styles.backgroundGradient}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
    >
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          {/* Top spacing */}
          <View style={styles.topSpacer} />
          
          {/* Illustration */}
          <View style={styles.illustrationContainer}>
            <Image 
              source={require('../../image.png')} 
              style={styles.illustration}
              resizeMode="contain"
            />
          </View>
          
          {/* Text content */}
          <View style={styles.textContainer}>
            <Text style={styles.title}>
              Let's Customize Your{'\n'}Healing Journey
            </Text>
          </View>
          
          {/* Bottom section with button */}
          <View style={styles.bottomSection}>
            <Pressable
              style={({ pressed }) => [
                styles.button,
                { 
                  opacity: pressed ? 0.9 : 1,
                  transform: [{ scale: pressed ? 0.98 : 1 }]
                }
              ]}
              onPress={handleMakeItYours}
            >
              <Text style={styles.buttonText}>Make It Yours</Text>
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  backgroundGradient: { 
    flex: 1 
  },
  safeArea: { 
    flex: 1 
  },
  container: {
    flex: 1,
    paddingHorizontal: theme.spacing.l,
    maxWidth: 600,
    alignSelf: 'center',
  },
  topSpacer: {
    flex: 0.15,
  },
  illustrationContainer: {
    flex: 0.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  illustration: {
    width: '100%',
    height: '100%',
    maxWidth: 300,
    maxHeight: 300,
  },
  textContainer: {
    flex: 0.2,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.m,
  },
  title: {
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: getResponsiveFontSize(28),
    color: theme.colors.text,
    textAlign: 'center',
    lineHeight: getResponsiveFontSize(36),
  },
  bottomSection: {
    flex: 0.15,
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: theme.spacing.xl,
  },
  button: {
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.m,
    paddingHorizontal: theme.spacing.xl,
    borderRadius: theme.radii.l,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  buttonText: {
    fontFamily: theme.typography.fontFamily.semiBold,
    fontSize: theme.typography.fontSizes.m,
    color: theme.colors.white,
  },
}); 