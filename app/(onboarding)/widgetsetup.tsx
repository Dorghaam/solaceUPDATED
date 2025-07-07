import React, { useState, useEffect } from 'react';
import { StyleSheet, SafeAreaView, View, Text, Pressable, Dimensions, Platform, Alert, NativeModules } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../constants/theme';
import { useUserStore } from '../../store/userStore';
import { supabase } from '../../services/supabaseClient';
import { getResponsiveDimensions, getWidgetPreviewSize, getResponsiveFontSize, getResponsiveSpacing } from '../../utils/responsive';
import * as Haptics from 'expo-haptics';
import { OnboardingProgressBar } from '../../components/OnboardingProgressBar';

const { width } = Dimensions.get('window');

export default function WidgetSetupPage() {
  const { setWidgetSettings, userName } = useUserStore();
  const [isApplying, setIsApplying] = useState(false);
  const [isApplied, setIsApplied] = useState(false);
  const responsiveDimensions = getResponsiveDimensions();
  const widgetSize = getWidgetPreviewSize();
  const styles = createStyles();

  useEffect(() => {
    // Auto-apply the widget with general healing category when screen loads
    handleApplyWidget();
  }, []);

  const updateWidgetData = async () => {
    if (Platform.OS !== 'ios') {
      return; // Only iOS supports widgets
    }

    try {
      // Fetch general healing quotes from Supabase
      const { data, error } = await supabase
        .from('quotes')
        .select('text')
        .eq('category', 'general_healing')
        .limit(150);
      
      if (error) throw error;
      
      let quotesToSend: string[] = [`Hello ${userName || 'User'}! Open Solace to get inspired.`];
      
      if (data && data.length > 0) {
        // Shuffle the quotes for variety
        const shuffledQuotes = [...data].sort(() => Math.random() - 0.5);
        quotesToSend = shuffledQuotes.map(q => q.text);
      }

      // Update widget with quotes and user name
      const { WidgetUpdateModule } = NativeModules;
      if (WidgetUpdateModule) {
        await WidgetUpdateModule.updateQuotes(quotesToSend);
        if (userName) {
          await WidgetUpdateModule.updateUserName(userName);
        }
        console.log('Widget updated successfully with general healing quotes');
      }
    } catch (error) {
      console.error('Failed to update widget:', error);
    }
  };

  const handleApplyWidget = async () => {
    setIsApplying(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      // Set widget settings to general healing
      setWidgetSettings({ 
        category: 'general_healing',
        theme: 'light' 
      });

      // Update the widget data if on iOS
      await updateWidgetData();

      // Simulate applying process
      setTimeout(() => {
        setIsApplying(false);
        setIsApplied(true);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }, 2000);

    } catch (error) {
      console.error('Failed to apply widget:', error);
      setIsApplying(false);
      Alert.alert(
        'Widget Setup',
        'Widget settings have been saved. You can customize your widget anytime in Settings.',
        [{ text: 'OK' }]
      );
    }
  };

  const handleContinue = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/(onboarding)/writegoals');
  };



  return (
    <LinearGradient
      colors={[theme.colors.lightPink.lightest, theme.colors.lightPink.light, theme.colors.lightPink.medium]}
      style={styles.backgroundGradient}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
    >
      <SafeAreaView style={styles.safeArea}>
        <OnboardingProgressBar 
          currentStep={8} 
          totalSteps={10} 
        />
        <View style={styles.container}>
          {/* Header Text */}
          <View style={styles.headerSection}>
            <Text style={styles.title}>Setting Up Your{'\n'}Widget</Text>
            <Text style={styles.subtitle}>
              We're applying the General Healing category{'\n'}to get you started with uplifting quotes.
            </Text>
          </View>

          {/* Widget Preview */}
          <View style={styles.widgetPreviewContainer}>
            <View style={[styles.widgetPreview, isApplied && styles.widgetApplied]}>
              <View style={styles.widgetContent}>
                <Text style={styles.widgetText}>
                  {isApplying 
                    ? 'Setting up...' 
                    : isApplied 
                      ? 'You are worthy of love and healing. Every step forward matters.'
                      : 'I am becoming stronger.'
                  }
                </Text>
                                 {isApplying && (
                   <View style={styles.loadingDots}>
                     <View style={styles.dot} />
                     <View style={styles.dot} />
                     <View style={styles.dot} />
                   </View>
                 )}
              </View>
            </View>
          </View>

          {/* Status Section */}
          <View style={styles.statusContainer}>
            {isApplying ? (
              <View style={styles.statusItem}>
                <Ionicons name="sync" size={20} color={theme.colors.primary} />
                <Text style={styles.statusText}>Applying General Healing category...</Text>
              </View>
            ) : isApplied ? (
              <View style={styles.statusItem}>
                <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                <Text style={[styles.statusText, { color: '#10B981' }]}>
                  Widget ready with General Healing quotes!
                </Text>
              </View>
            ) : null}
          </View>

          {/* Info Section */}
          <View style={styles.infoContainer}>
            <View style={styles.infoCard}>
              <Ionicons name="information-circle-outline" size={24} color={theme.colors.primary} />
              <Text style={styles.infoText}>
                You can change widget categories anytime in Settings. Go to Settings → Widget to customize your experience.
              </Text>
            </View>
          </View>

          {/* Spacer */}
          <View style={styles.spacer} />
        </View>

        {/* Continue Button - Outside Container */}
        <View style={styles.bottomSection}>
          <Pressable
            style={({ pressed }) => [
              styles.continueButton,
              { 
                opacity: isApplied ? (pressed ? 0.9 : 1) : 0.5,
                transform: [{ scale: pressed && isApplied ? 0.98 : 1 }]
              }
            ]}
            onPress={handleContinue}
            disabled={!isApplied}
          >
            <Text style={styles.continueButtonText}>
              {isApplied ? 'Continue' : 'Setting up...'}
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const createStyles = () => {
  const responsiveDimensions = getResponsiveDimensions();
  const widgetSize = getWidgetPreviewSize();
  
  return StyleSheet.create({
    backgroundGradient: { 
      flex: 1 
    },
    safeArea: { 
      flex: 1 
    },
    container: {
      flex: 1,
      paddingHorizontal: responsiveDimensions.horizontalPadding,
      maxWidth: responsiveDimensions.contentWidth,
      alignSelf: 'center',
      paddingBottom: 100, // Space for floating button
    },

  headerSection: {
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
    paddingTop: theme.spacing.xl,
  },
  title: {
    fontFamily: theme.typography.fontFamily.semiBold,
    fontSize: 28,
    color: theme.colors.text,
    textAlign: 'center',
    lineHeight: 36,
    letterSpacing: -0.3,
    marginBottom: theme.spacing.s,
  },
  subtitle: {
    fontSize: theme.typography.fontSizes.m,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  widgetPreviewContainer: {
    alignItems: 'center',
    marginBottom: theme.spacing.l,
  },
  widgetPreview: {
    width: widgetSize.width,
    height: widgetSize.height,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: theme.radii.l,
    borderWidth: 2,
    borderColor: 'rgba(0, 0, 0, 0.1)',
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
  widgetApplied: {
    borderColor: '#10B981',
    borderWidth: 2,
    borderStyle: 'solid',
  },
  widgetContent: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.m,
  },
  widgetText: {
    fontSize: 16,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.text,
    textAlign: 'center',
    lineHeight: 22,
  },
  loadingDots: {
    flexDirection: 'row',
    marginTop: theme.spacing.s,
    gap: 4,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: theme.colors.primary,
  },

  statusContainer: {
    alignItems: 'center',
    marginBottom: theme.spacing.l,
  },
  statusItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.s,
  },
  statusText: {
    fontSize: theme.typography.fontSizes.m,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.text,
  },
  infoContainer: {
    marginBottom: theme.spacing.l,
  },
  infoCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: theme.radii.l,
    padding: theme.spacing.m,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: theme.spacing.s,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
  },
  infoText: {
    flex: 1,
    fontSize: theme.typography.fontSizes.s,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.textSecondary,
    lineHeight: 20,
  },
  spacer: {
    flex: 1,
  },
  bottomSection: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: theme.spacing.l,
    paddingBottom: getResponsiveSpacing(theme.spacing.xl),
  },
  continueButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radii.l,
    paddingVertical: getResponsiveSpacing(theme.spacing.m),
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    shadowColor: theme.colors.black,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  continueButtonText: {
    fontSize: theme.typography.fontSizes.m,
    fontFamily: theme.typography.fontFamily.semiBold,
    color: 'white',
  },
  });
}; 