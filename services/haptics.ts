// services/haptics.ts
/**
 * Triggers a short, crisp vibration for button clicks and interactions.
 * Conforms to Material Design guidelines for light impact.
 */
export const hapticClick = () => {
  if (window.navigator && window.navigator.vibrate) {
    // A very brief tap for clicks
    window.navigator.vibrate(10);
  }
};

/**
 * Triggers a confirmation haptic feedback pattern for successful actions.
 * e.g., successfully saving a form.
 */
export const hapticSuccess = () => {
  if (window.navigator && window.navigator.vibrate) {
    // A short double-vibration to indicate success
    window.navigator.vibrate([20, 80, 20]);
  }
};

/**
 * Triggers a noticeable haptic feedback for errors or invalid actions.
 * e.g., pressing save on an invalid form.
 */
export const hapticError = () => {
  if (window.navigator && window.navigator.vibrate) {
    // A longer, more distinct vibration for errors
    window.navigator.vibrate(150);
  }
};
