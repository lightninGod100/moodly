// FE/src/components/NotificationToast.tsx
import React from 'react';
import { useNotification } from '../contexts/NotificationContext';
import type { NotificationType } from '../contexts/NotificationContext';

// Color mapping for notification types
const NOTIFICATION_COLORS: Record<NotificationType, string> = {
  error: 'rgba(239, 68, 68, 0.9)',
  success: 'rgba(34, 197, 94, 0.9)',
  warning: 'rgba(245, 158, 11, 0.9)',
  info: 'rgba(59, 130, 246, 0.9)'
};

// Title mapping for notification types
const NOTIFICATION_TITLES: Record<NotificationType, string> = {
  error: 'Error',
  success: 'Success',
  warning: 'Warning',
  info: 'Info'
};

const NotificationToast: React.FC = () => {
  const { notifications, removeNotification } = useNotification();

  return (
    <>
      {notifications.map((notification) => (
        <div
          key={notification.id}
          style={{
            position: 'fixed',
            bottom: '24px',
            left: '24px',
            background: NOTIFICATION_COLORS[notification.type],
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
              <div style={{ fontSize: '18px', fontWeight: '600', marginBottom: '4px' }}>
                {NOTIFICATION_TITLES[notification.type]}
              </div>
              <div style={{ fontSize: '14px' }}>{notification.message}</div>
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
};

export default NotificationToast;