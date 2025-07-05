import React, { useState } from 'react';
import { StyleSheet, SafeAreaView, View, Text, Pressable, ScrollView } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../../constants/theme';
import { getResponsiveFontSize, getResponsiveSpacing } from '../../utils/responsive';
import * as Haptics from 'expo-haptics';

const struggleOptions = [
  "The constant thoughts about them.",
  "The feeling that I'm not good enough.",
  "The fear of being on my own.",
  "Hoping they'll change their mind.",
  "Just the overwhelming sadness.",
  "The pain of seeing (or imagining) them with someone else."
];

export default function Step3Screen() {
  const { name } = useLocalSearchParams();
  const [selectedStruggle, setSelectedStruggle] = useState<string>('');

  const handleSelectStruggle = (struggle: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedStruggle(struggle);
  };

  const handleContinue = () => {
    if (selectedStruggle) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      // TODO: Save selected struggle to storage/state
      router.push({
        pathname: '/(onboarding)/step4',
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
            Which one hits you the deepest{displayName ? `, ${displayName}` : ''}?
          </Text>

          {/* Instruction */}
          <Text style={styles.instruction}>
            Choose one to start.
          </Text>

          {/* Struggle Options */}
          <View style={styles.optionsContainer}>
            {struggleOptions.map((option, index) => (
              <Pressable
                key={index}
                style={({ pressed }) => [
                  styles.optionCard,
                  selectedStruggle === option && styles.selectedOptionCard,
                  { 
                    opacity: pressed ? 0.8 : 1,
                    transform: [{ scale: pressed ? 0.98 : 1 }] 
                  }
                ]}
                onPress={() => handleSelectStruggle(option)}
              >
                <Text style={[
                  styles.optionText,
                  selectedStruggle === option && styles.selectedOptionText
                ]}>
                  {option}
                </Text>
                
                {/* Selection Indicator */}
                <View style={[
                  styles.selectionIndicator,
                  selectedStruggle === option && styles.selectedIndicator
                ]}>
                  {selectedStruggle === option && (
                    <Text style={styles.checkmark}>✓</Text>
                  )}
                </View>
              </Pressable>
            ))}
          </View>
        </ScrollView>
        
        {/* Floating Continue Button */}
        <View style={styles.floatingButtonContainer}>
                      <Pressable 
              style={({ pressed }) => [
                styles.continueButton,
                { 
                  opacity: selectedStruggle ? (pressed ? 0.8 : 1) : 0.5,
                  transform: [{ scale: pressed && selectedStruggle ? 0.98 : 1 }] 
                }
              ]} 
              onPress={selectedStruggle ? handleContinue : undefined}
              disabled={!selectedStruggle}
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
  optionText: {
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: getResponsiveFontSize(16),
    color: theme.colors.text,
    lineHeight: getResponsiveFontSize(22),
    flex: 1,
    paddingRight: getResponsiveSpacing(theme.spacing.s),
  },
  selectedOptionText: {
    fontFamily: theme.typography.fontFamily.semiBold,
    color: theme.colors.primary,
  },
  selectionIndicator: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: theme.colors.textSecondary,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedIndicator: {
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