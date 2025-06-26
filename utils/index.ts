// Re-export polyfill
export * from './backHandlerPolyfill';

// Re-export auth guard
export { useAuthGuard } from './useAuthGuard';

// Store hydration utility
export const waitForStoreHydration = (): Promise<void> => {
  return new Promise<void>((resolve) => {
    const checkHydrated = () => {
      const { useUserStore } = require('../store/userStore');
      if (useUserStore.getState().hydrated) {
        resolve();
      } else {
        setTimeout(checkHydrated, 10);
      }
    };
    checkHydrated();
  });
};
