import React, { useState } from 'react';
import { StyleSheet, SafeAreaView, View, Text, Pressable, ScrollView } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../../constants/theme';
import { getResponsiveFontSize, getResponsiveSpacing } from '../../utils/responsive';
import * as Haptics from 'expo-haptics';

const focusOptions = [
  { id: 'confidence', text: 'Rebuilding my confidence & self-worth' },
  { id: 'self-love', text: 'Learning to love being by myself' },
  { id: 'inner-peace', text: 'Finding my inner peace & letting go' },
  { id: 'glow-up', text: 'Focusing on my future & my glow up' },
  { id: 'boundaries', text: 'Setting boundaries & protecting my energy' },
  { id: 'stop-thoughts', text: 'Stopping the constant thoughts about them' },
  { id: 'acceptance', text: 'Accepting that it\'s truly over and moving forward' },
  { id: 'self-forgiveness', text: 'Forgiving myself for what happened' },
  { id: 'manage-emotions', text: 'Managing the waves of sadness and anxiety' },
  { id: 'rediscover-self', text: 'Rediscovering who I am without them' },
  { id: 'break-attachment', text: 'Breaking my attachment to their approval' },
  { id: 'trust-reason', text: 'Trusting that this happened for a reason' },
];

export default function Step4Screen() {
  const { name } = useLocalSearchParams();
  const [selectedFocus, setSelectedFocus] = useState<string[]>([]);

  const handleToggleFocus = (focusId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    setSelectedFocus(prev => {
      if (prev.includes(focusId)) {
        return prev.filter(id => id !== focusId);
      } else {
        return [...prev, focusId];
      }
    });
  };

  const handleContinue = () => {
    if (selectedFocus.length > 0) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      // TODO: Save selected focus areas to storage/state
      router.push({
        pathname: '/(onboarding)/step5',
        params: { name: displayName }
      });
    }
  };

  const displayName = name && typeof name === 'string' && name.trim() ? name.trim() : '';

  return (
    <LinearGradient
      colors={[theme.colors.lightPink.lightest, theme.colors.lightPink.light, theme.colors.lightPink.medium]}
      style={styles.backgroundGradient}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
    >
      <SafeAreaView style={styles.safeArea}>
        <ScrollView 
          style={styles.scrollContainer}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Main Headline */}
          <Text style={styles.headline}>
            What are you focusing on as you move forward{displayName ? `, ${displayName}` : ''}?
          </Text>

          {/* Instruction */}
          <Text style={styles.instruction}>
            Select your core focus areas.
          </Text>

          {/* Focus Options */}
          <View style={styles.optionsContainer}>
            {focusOptions.map((option) => {
              const isSelected = selectedFocus.includes(option.id);
              
              return (
                <Pressable
                  key={option.id}
                  style={({ pressed }) => [
                    styles.optionCard,
                    isSelected && styles.selectedOptionCard,
                    { 
                      opacity: pressed ? 0.8 : 1,
                      transform: [{ scale: pressed ? 0.98 : 1 }] 
                    }
                  ]}
                  onPress={() => handleToggleFocus(option.id)}
                >
                  <View style={styles.optionContent}>
                    <Text style={[
                      styles.optionText,
                      isSelected && styles.selectedOptionText
                    ]}>
                      {option.text}
                    </Text>
                  </View>
                  
                  {/* Checkbox Indicator */}
                  <View style={[
                    styles.checkboxIndicator,
                    isSelected && styles.selectedCheckbox
                  ]}>
                    {isSelected && (
                      <Text style={styles.checkmark}>✓</Text>
                    )}
                  </View>
                </Pressable>
              );
            })}
          </View>
        </ScrollView>
        
        {/* Floating Continue Button */}
        <View style={styles.floatingButtonContainer}>
                      <Pressable 
              style={({ pressed }) => [
                styles.continueButton,
                { 
                  opacity: selectedFocus.length > 0 ? (pressed ? 0.8 : 1) : 0.5,
                  transform: [{ scale: pressed && selectedFocus.length > 0 ? 0.98 : 1 }] 
                }
              ]} 
              onPress={selectedFocus.length > 0 ? handleContinue : undefined}
              disabled={selectedFocus.length === 0}
            >
                          <Text style={styles.buttonText}>
                Continue
              </Text>
          </Pressable>
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
    flex: 1,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: getResponsiveSpacing(theme.spacing.l),
    paddingTop: getResponsiveSpacing(theme.spacing.xl),
    paddingBottom: getResponsiveSpacing(theme.spacing.xl * 2),
  },
  headline: {
    fontFamily: theme.typography.fontFamily.semiBold,
    fontSize: getResponsiveFontSize(28),
    color: theme.colors.text,
    textAlign: 'center',
    lineHeight: getResponsiveFontSize(36),
    marginBottom: getResponsiveSpacing(theme.spacing.m),
    letterSpacing: -0.3,
  },
  instruction: {
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: getResponsiveFontSize(16),
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: getResponsiveSpacing(theme.spacing.xl),
    letterSpacing: 0.2,
  },
  optionsContainer: {
    width: '100%',
  },
  optionCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    borderRadius: 15,
    paddingHorizontal: getResponsiveSpacing(theme.spacing.m + 4),
    paddingVertical: getResponsiveSpacing(theme.spacing.m),
    marginBottom: getResponsiveSpacing(theme.spacing.m),
    shadowColor: theme.colors.primary,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 2,
    borderColor: 'transparent',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 50,
  },
  selectedOptionCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderColor: theme.colors.primary,
    shadowOpacity: 0.2,
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },

  optionText: {
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: getResponsiveFontSize(16),
    color: theme.colors.text,
    lineHeight: getResponsiveFontSize(22),
    flex: 1,
  },
  selectedOptionText: {
    fontFamily: theme.typography.fontFamily.semiBold,
    color: theme.colors.primary,
  },
  checkboxIndicator: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: theme.colors.textSecondary,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedCheckbox: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  checkmark: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  floatingButtonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: theme.spacing.l,
    paddingBottom: getResponsiveSpacing(theme.spacing.xl),
  },
  continueButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: getResponsiveSpacing(theme.spacing.m),
    borderRadius: theme.radii.l,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    shadowColor: theme.colors.primary,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  buttonText: {
    fontFamily: theme.typography.fontFamily.semiBold,
    fontSize: theme.typography.fontSizes.m,
    color: theme.colors.white,
  },
}); 