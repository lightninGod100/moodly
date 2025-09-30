// FE/src/contexts/NotificationContext.tsx
import React, { createContext, useContext, useState, useCallback } from 'react';
import type { ReactNode } from 'react';

// Notification types
export type NotificationType = 'error' | 'success' | 'warning' | 'info';

// Notification interface
export interface Notification {
  id: number;
  type: NotificationType;
  message: string;
  timestamp: number;
}

// Input for showNotification method
export interface ShowNotificationInput {
  type: NotificationType;
  message: string;
  duration?: number; // Optional: custom duration in ms (default: 5000)
}

// Context type
interface NotificationContextType {
  notifications: Notification[];
  showNotification: (input: ShowNotificationInput) => void;
  clearNotifications: () => void;
  removeNotification: (id: number) => void;
}

// Create context
const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

// Provider props
interface NotificationProviderProps {
  children: ReactNode;
}

// Provider component
export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // Show notification method
  const showNotification = useCallback(({ type, message, duration = 5000 }: ShowNotificationInput) => {
    const id = Date.now() + Math.random(); // Ensure uniqueness

    const notification: Notification = {
      id,
      type,
      message,
      timestamp: Date.now()
    };

    setNotifications(prev => [...prev, notification]);

    // Auto-remove after duration
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, duration);
  }, []);

  // Clear all notifications
  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  // Remove specific notification
  const removeNotification = useCallback((id: number) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const contextValue: NotificationContextType = {
    notifications,
    showNotification,
    clearNotifications,
    removeNotification
  };

  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
    </NotificationContext.Provider>
  );
};

// Custom hook to use the notification context
export const useNotification = (): NotificationContextType => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};