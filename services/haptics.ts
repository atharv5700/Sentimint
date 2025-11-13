/**
 * For this service to work optimally in a native app,
 * install the Capacitor Haptics plugin:
 * npm install @capacitor/haptics
 * npx cap sync
 * 
 * This service will automatically use the native plugin if available,
 * otherwise it will fall back to the web standard Vibration API.
 */

// This type definition helps with TypeScript checking without needing the full library import.
declare global {
  interface Window {
    Capacitor?: {
      isPluginAvailable: (name: string) => boolean;
      Plugins: {
        [key: string]: any;
      }
    };
  }
}

const canUseHaptics = () => window.Capacitor?.isPluginAvailable('Haptics');

/**
 * Triggers a short, crisp vibration for button clicks and interactions.
 * Conforms to Material Design guidelines for light impact.
 */
export const hapticClick = () => {
  try {
    if (canUseHaptics()) {
      window.Capacitor.Plugins.Haptics.impact({ style: 'light' });
    } else if (window.navigator?.vibrate) {
      window.navigator.vibrate(10);
    }
  } catch (e) {
    console.warn("Haptic feedback failed", e);
  }
};

/**
 * Triggers a confirmation haptic feedback pattern for successful actions.
 * e.g., successfully saving a form.
 */
export const hapticSuccess = () => {
  try {
    if (canUseHaptics()) {
      window.Capacitor.Plugins.Haptics.notification({ type: 'success' });
    } else if (window.navigator?.vibrate) {
      window.navigator.vibrate([20, 80, 20]);
    }
  } catch (e) {
    console.warn("Haptic feedback failed", e);
  }
};

/**
 * Triggers a noticeable haptic feedback for errors or invalid actions.
 * e.g., pressing save on an invalid form.
 */
export const hapticError = () => {
  try {
    if (canUseHaptics()) {
       window.Capacitor.Plugins.Haptics.notification({ type: 'error' });
    } else if (window.navigator?.vibrate) {
      window.navigator.vibrate([80, 40, 80]);
    }
  } catch (e) {
    console.warn("Haptic feedback failed", e);
  }
};
