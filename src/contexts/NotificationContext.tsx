import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { useLanguage } from './LanguageContext';
import {
  subscribeToNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  Notification
} from '@/services/notificationService';
import { toast } from 'sonner';

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const isInitialLoadRef = useRef(true);
  const previousCountRef = useRef(0);

  useEffect(() => {
    if (!user) {
      setNotifications([]);
      setUnreadCount(0);
      isInitialLoadRef.current = true;
      previousCountRef.current = 0;
      return;
    }

    // Subscribe to real-time notifications
    const unsubscribe = subscribeToNotifications(user.id, (newNotifications) => {
      // Calculate unread count
      const newUnreadCount = newNotifications.filter(n => !n.isRead).length;

      // Only show toast for NEW notifications (not on initial load)
      if (!isInitialLoadRef.current && newUnreadCount > previousCountRef.current) {
        const latestNotification = newNotifications.find(n => !n.isRead);
        if (latestNotification) {
          toast.info(latestNotification.title, {
            description: latestNotification.message,
            duration: 5000,
          });

          // Play notification sound (optional)
          try {
            const audio = new Audio('/notification-sound.mp3');
            audio.volume = 0.3;
            audio.play().catch(() => {
              console.log('Could not play notification sound');
            });
          } catch (error) {
            // Silently fail if audio doesn't work
          }
        }
      }

      setNotifications(newNotifications);
      setUnreadCount(newUnreadCount);
      previousCountRef.current = newUnreadCount;

      // Mark as loaded after first batch of notifications
      if (isInitialLoadRef.current) {
        isInitialLoadRef.current = false;
      }
    });

    return () => unsubscribe();
  }, [user]);

  const markAsRead = async (notificationId: string) => {
    try {
      await markNotificationAsRead(notificationId);
    } catch (error) {
      console.error('Error marking notification as read:', error);
      toast.error(t('notif.markReadFailed'));
    }
  };

  const markAllAsRead = async () => {
    if (!user) return;

    try {
      await markAllNotificationsAsRead(user.id);
      toast.success(t('notif.allMarkedRead'));
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      toast.error(t('notif.markAllReadFailed'));
    }
  };

  return (
    <NotificationContext.Provider value={{ 
      notifications, 
      unreadCount, 
      markAsRead, 
      markAllAsRead 
    }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}