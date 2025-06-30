import React from 'react';
import { StyleSheet, SafeAreaView, View, Text, Pressable, Dimensions } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../constants/theme';
import { getResponsiveDimensions, getWidgetPreviewSize, getResponsiveFontSize, getResponsiveSpacing } from '../../utils/responsive';
import * as Haptics from 'expo-haptics';

const { width } = Dimensions.get('window');

export default function LockscreenWidgetPage() {
  const handleDone = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/(onboarding)/widgetsetup');
  };

  const handleSkip = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/(onboarding)/growth');
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
          {/* Skip Button */}
          <View style={styles.topRow}>
            <View style={styles.spacerFlex} />
            <Pressable style={styles.skipButton} onPress={handleSkip}>
              <Text style={styles.skipText}>Skip</Text>
            </Pressable>
          </View>

          {/* Header Text */}
          <View style={styles.headerSection}>
            <Text style={styles.title}>Lockscreen{'\n'}Widgets</Text>
          </View>

          {/* Widget Preview */}
          <View style={styles.widgetPreviewContainer}>
            <View style={styles.widgetPreview}>
              <View style={styles.widgetContent}>
                <Text style={styles.widgetText}>I am becoming{'\n'}stronger.</Text>
              </View>
            </View>
          </View>

          {/* Instructions */}
          <View style={styles.instructionsContainer}>
            <Text style={styles.instructionsTitle}>Add a free widget to your{'\n'}Lock Screen</Text>
            
            <View style={styles.instructionsList}>
              <View style={styles.instructionItem}>
                <Text style={styles.instructionNumber}>1.</Text>
                <Text style={styles.instructionText}>
                  On your phone's Lock Screen, touch and hold an empty area until the screen customizes
                </Text>
              </View>
              
              <View style={styles.instructionItem}>
                <Text style={styles.instructionNumber}>2.</Text>
                <Text style={styles.instructionText}>
                  Tap "Customize" then tap "Add Widgets" to add the widget
                </Text>
              </View>

              <View style={styles.instructionItem}>
                <Text style={styles.instructionNumber}>3.</Text>
                <Text style={styles.instructionText}>
                  Find "Solace" in the widget list and select it
                </Text>
              </View>
            </View>
          </View>

          {/* Spacer */}
          <View style={styles.spacer} />

          {/* Done Button */}
          <View style={styles.bottomSection}>
            <Pressable
              style={({ pressed }) => [
                styles.doneButton,
                { 
                  opacity: pressed ? 0.9 : 1,
                  transform: [{ scale: pressed ? 0.98 : 1 }]
                }
              ]}
              onPress={handleDone}
            >
              <Text style={styles.doneButtonText}>Done</Text>
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
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: getResponsiveSpacing(theme.spacing.m),
    paddingBottom: getResponsiveSpacing(theme.spacing.s),
  },
  spacerFlex: {
    flex: 1,
  },
  skipButton: {
    paddingVertical: getResponsiveSpacing(theme.spacing.s),
    paddingHorizontal: getResponsiveSpacing(theme.spacing.m),
  },
  skipText: {
    fontSize: theme.typography.fontSizes.m,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.text,
  },

  headerSection: {
    alignItems: 'center',
    marginBottom: getResponsiveSpacing(theme.spacing.l),
    paddingTop: getResponsiveSpacing(theme.spacing.m),
  },
  title: {
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: getResponsiveFontSize(32),
    color: theme.colors.text,
    textAlign: 'center',
    lineHeight: getResponsiveFontSize(38),
  },
  widgetPreviewContainer: {
    alignItems: 'center',
    marginBottom: getResponsiveSpacing(theme.spacing.xl),
  },
  widgetPreview: {
    width: width * 0.85,
    height: 160,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: theme.radii.l,
    borderWidth: 2,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: theme.colors.black,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  widgetContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  widgetText: {
    fontSize: getResponsiveFontSize(18),
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: getResponsiveFontSize(24),
  },
  instructionsContainer: {
    marginBottom: getResponsiveSpacing(theme.spacing.l),
  },
  instructionsTitle: {
    fontSize: getResponsiveFontSize(20),
    fontFamily: theme.typography.fontFamily.semiBold,
    color: theme.colors.text,
    textAlign: 'center',
    marginBottom: getResponsiveSpacing(theme.spacing.l),
    lineHeight: getResponsiveFontSize(26),
  },
  instructionsList: {
    gap: getResponsiveSpacing(theme.spacing.m),
  },
  instructionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  instructionNumber: {
    fontSize: getResponsiveFontSize(16),
    fontFamily: theme.typography.fontFamily.semiBold,
    color: theme.colors.text,
    marginRight: getResponsiveSpacing(theme.spacing.s),
    minWidth: 20,
  },
  instructionText: {
    fontSize: getResponsiveFontSize(16),
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.textSecondary,
    flex: 1,
    lineHeight: getResponsiveFontSize(22),
  },
  spacer: {
    flex: 1,
  },
  bottomSection: {
    paddingBottom: getResponsiveSpacing(theme.spacing.xl),
  },
  doneButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: getResponsiveSpacing(theme.spacing.m),
    paddingHorizontal: getResponsiveSpacing(theme.spacing.xl),
    borderRadius: theme.radii.l,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  doneButtonText: {
    fontFamily: theme.typography.fontFamily.semiBold,
    fontSize: theme.typography.fontSizes.m,
    color: theme.colors.white,
  },
}); 