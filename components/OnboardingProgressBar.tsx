import React from 'react';
import { View, StyleSheet } from 'react-native';
import { theme } from '../constants/theme';
import { getResponsiveSpacing } from '../utils/responsive';

interface OnboardingProgressBarProps {
  currentStep: number;
  totalSteps: number;
}

export const OnboardingProgressBar: React.FC<OnboardingProgressBarProps> = ({
  currentStep,
  totalSteps
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.stepsContainer}>
        {Array.from({ length: totalSteps }, (_, index) => {
          const stepNumber = index + 1;
          const isCompleted = stepNumber <= currentStep;
          
          return (
            <View
              key={stepNumber}
              style={[
                styles.stepIndicator,
                isCompleted ? styles.completedStep : styles.incompleteStep
              ]}
            />
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: getResponsiveSpacing(theme.spacing.l),
    paddingTop: getResponsiveSpacing(theme.spacing.m),
    paddingBottom: getResponsiveSpacing(theme.spacing.s),
  },
  stepsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: getResponsiveSpacing(theme.spacing.xs),
  },
  stepIndicator: {
    height: 4,
    flex: 1,
    borderRadius: 2,
    maxWidth: 40,
  },
  completedStep: {
    backgroundColor: theme.colors.primary,
  },
  incompleteStep: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
}); 