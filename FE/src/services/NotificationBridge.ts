// FE/src/services/NotificationBridge.ts

import type { ShowNotificationInput } from '../contexts/NotificationContext';

/**
 * NotificationBridge - Connects service layer (plain TypeScript) to React NotificationContext
 * 
 * This bridge allows non-React code (like API services) to trigger notifications
 * without directly depending on React Context.
 * 
 * Architecture:
 * - Service Layer (TypeScript) → Bridge → React Context → UI Toast
 * 
 * Usage:
 * 1. In App.tsx: notificationBridge.setHandler(showNotification)
 * 2. In services: notificationBridge.notify({ type: 'error', message: '...' })
 */
class NotificationBridge {
  private handler?: (input: ShowNotificationInput) => void;

  /**
   * Set the notification handler (usually from useNotification hook)
   * This should be called once at app initialization in App.tsx
   * 
   * @param handler - The showNotification function from NotificationContext
   */
  setHandler(handler: (input: ShowNotificationInput) => void): void {
    this.handler = handler;
  }

  /**
   * Trigger a notification from anywhere in the app
   * Safe to call even if handler is not set (will log warning in dev)
   * 
   * @param input - Notification configuration (type, message, duration)
   */
  notify(input: ShowNotificationInput): void {
    if (!this.handler) {
      console.warn(
        'NotificationBridge: No handler set. Call setHandler() in App.tsx first.',
        input
      );
      return;
    }

    this.handler(input);
  }

  /**
   * Check if the bridge is initialized and ready to use
   * Useful for conditional notification logic
   * 
   * @returns true if handler is set, false otherwise
   */
  isInitialized(): boolean {
    return !!this.handler;
  }

  /**
   * Clear the handler (useful for testing or cleanup)
   * Not typically needed in production code
   */
  clearHandler(): void {
    this.handler = undefined;
  }
}

// Export singleton instance
// This ensures one bridge instance is shared across the entire app
export const notificationBridge = new NotificationBridge();