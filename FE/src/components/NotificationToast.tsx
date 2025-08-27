// src/components/NotificationToast.tsx
import React, { useState, useCallback } from 'react';

// Notification types and their corresponding messages
type NotificationType = 'userSettings' | 'lastMood';

interface NotificationConfig {
  message: string;
  type: 'error' | 'success' | 'warning';
  icon: string;
}

// Centralized notification message mapping
const NOTIFICATION_MESSAGES: Record<NotificationType, NotificationConfig> = {
  userSettings: {
    message: "Unable to load user settings",
    type: 'error',
    icon: '❌'
  },
  lastMood: {
    message: "Unable to load recent mood data",
    type: 'error',
    icon: '❌'
  },
  worldStats: {
    message: "Unable to load global statistics",
    type: 'error',
    icon: '❌'
  },
  userStats: {
    message: "Unable to load personal statistics",
    type: 'error',
    icon: '❌'
  },
  moodCreation: {
    message: "Unable to save your mood",
    type: 'error',
    icon: '❌'
  }
};

interface Notification {
  id: number;
  config: NotificationConfig;
  timestamp: number;
}

interface NotificationToastProps {
  // This component exposes methods via ref
}

export interface NotificationToastRef {
  showNotification: (notificationType: NotificationType) => void;
  clearNotifications: () => void;
}

const NotificationToast = React.forwardRef<NotificationToastRef, NotificationToastProps>((props, ref) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const showNotification = useCallback((notificationType: NotificationType) => {
    const config = NOTIFICATION_MESSAGES[notificationType];
    const id = Date.now() + Math.random(); // Ensure uniqueness

    const notification: Notification = {
      id,
      config,
      timestamp: Date.now()
    };

    setNotifications(prev => [...prev, notification]);

    // Auto-remove after 5 seconds
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 5000);
  }, []);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  const removeNotification = useCallback((id: number) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  // Expose methods via ref
  React.useImperativeHandle(ref, () => ({
    showNotification,
    clearNotifications
  }), [showNotification, clearNotifications]);

  return (
    <>
      {notifications.map(notification => (
        <div
          key={notification.id}
          style={{
            position: 'fixed',
            bottom: '24px',
            left: '24px',
            background: notification.config.type === 'error'
              ? 'rgba(239, 68, 68, 0.9)'
              : notification.config.type === 'success'
                ? 'rgba(34, 197, 94, 0.9)'
                : 'rgba(245, 158, 11, 0.9)', // warning
            color: 'white',
            padding: '12px 20px',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
            zIndex: 1000,
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            fontSize: '14px',
            fontWeight: '500',
            maxWidth: '420px',
            minWidth: '300px',
            cursor: 'pointer',
            transition: 'transform 0.2s ease, opacity 0.2s ease',
            animation: 'slideInFromLeft 0.3s ease-out'
          }}
          onClick={() => removeNotification(notification.id)}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateX(4px)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateX(0px)';
          }}
        >
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '18px', fontWeight: '600', marginBottom: '4px' }}>Error</div>
              <div style={{ fontSize: '14px' }}>{notification.config.message}</div>
            </div>
          </div>
        </div>
      ))}

      <style>{`
        @keyframes slideInFromLeft {
          from {
            transform: translateX(-100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `}</style>
    </>
  );
});

NotificationToast.displayName = 'NotificationToast';

export default NotificationToast;