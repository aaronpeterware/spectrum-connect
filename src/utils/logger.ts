/**
 * Production-safe logging utility
 * Only logs in development mode to prevent exposing sensitive info
 */

export const logger = {
  log: (...args: any[]) => {
    if (__DEV__) {
      console.log(...args);
    }
  },

  warn: (...args: any[]) => {
    if (__DEV__) {
      console.warn(...args);
    }
  },

  error: (...args: any[]) => {
    if (__DEV__) {
      console.error(...args);
    }
    // In production, you could send errors to a tracking service
    // errorTrackingService.captureException(args[0]);
  },

  // For debugging only - never log PII even in dev
  debug: (...args: any[]) => {
    if (__DEV__) {
      console.log('[DEBUG]', ...args);
    }
  },
};

export default logger;
