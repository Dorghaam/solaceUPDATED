import { BackHandler, Platform } from 'react-native';

// Polyfill for BackHandler.removeEventListener which was removed in React Native 0.72+
// This prevents crashes when code (typically from libraries) calls the removed method
// This is a type-safe implementation that works on both iOS and Android
export function applyBackHandlerPolyfill(): void {
  // Only apply if the method doesn't exist
  if (typeof BackHandler === 'object' && BackHandler && !('removeEventListener' in BackHandler)) {
    // Use JS object property assignment to add the missing method
    // TypeScript will complain here, but it works at runtime
    (BackHandler as any).removeEventListener = (
      _eventName: string,
      _handler: () => boolean
    ): void => {
      // iOS: This is effectively a no-op since BackHandler does nothing on iOS anyway
      // Android: This prevents crashes when old code calls the removed method
      if (__DEV__ && Platform.OS === 'android') {
        console.warn(
          '[BackHandler Polyfill] BackHandler.removeEventListener was called but is deprecated. ' +
          'Update code to use the subscription.remove() pattern instead.'
        );
      }
      // Do nothing - the real functionality is in the subscription.remove() pattern
    };
  }
} 