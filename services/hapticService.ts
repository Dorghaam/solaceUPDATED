import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

class HapticService {
  // Light feedback for subtle interactions like tab switches
  async light() {
    if (Platform.OS === 'ios') {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } else {
      // Android fallback - short vibration
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }

  // Medium feedback for button presses, like favorites
  async medium() {
    if (Platform.OS === 'ios') {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } else {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  }

  // Heavy feedback for important actions
  async heavy() {
    if (Platform.OS === 'ios') {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    } else {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    }
  }

  // Success feedback for positive actions like liking
  async success() {
    if (Platform.OS === 'ios') {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else {
      // Android fallback
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  }

  // Warning feedback for caution actions
  async warning() {
    if (Platform.OS === 'ios') {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    } else {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    }
  }

  // Error feedback for error states
  async error() {
    if (Platform.OS === 'ios') {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } else {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    }
  }

  // Selection feedback for picking options
  async selection() {
    if (Platform.OS === 'ios') {
      await Haptics.selectionAsync();
    } else {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }
}

export const hapticService = new HapticService(); 