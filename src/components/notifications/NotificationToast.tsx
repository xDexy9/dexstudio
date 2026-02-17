import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { subscribeToNotifications, markNotificationAsRead, Notification as NotifType } from '@/services/notificationService';
import { tVars } from '@/lib/i18n';
import { BadgeCheck, Wrench, Flame, MessagesSquare, Banknote, BellRing, X } from 'lucide-react';

interface ToastNotification extends NotifType {
  isNew?: boolean;
}

const getNotificationIcon = (type: string) => {
  switch (type) {
    case 'job_completed':
      return BadgeCheck;
    case 'job_assigned':
      return Wrench;
    case 'job_updated':
      return Flame;
    case 'message_received':
      return MessagesSquare;
    case 'payment_received':
      return Banknote;
    default:
      return BellRing;
  }
};

const getNotificationColor = (type: string) => {
  switch (type) {
    case 'job_completed':
      return '#22c55e';   // vivid green
    case 'job_assigned':
      return '#3b82f6';   // vivid blue
    case 'job_updated':
      return '#f97316';   // vivid orange
    case 'message_received':
      return '#a855f7';   // vivid purple
    case 'payment_received':
      return '#10b981';   // vivid emerald
    default:
      return '#6366f1';   // vivid indigo
  }
};

export function NotificationToast() {
  const { user } = useAuth();
  const { language } = useLanguage();
  const navigate = useNavigate();
  const [toasts, setToasts] = useState<ToastNotification[]>([]);
  const [previousNotificationIds, setPreviousNotificationIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!user?.id) return;

    const unsubscribe = subscribeToNotifications(user.id, (notifications) => {
      // Find new notifications that we haven't seen before
      const newNotifications = notifications.filter(
        (notification) =>
          !notification.isRead &&
          !previousNotificationIds.has(notification.id)
      );

      if (newNotifications.length > 0) {
        // Add new toasts (limit to 3 visible at once)
        const newToasts = newNotifications.slice(0, 3).map(n => ({
          ...n,
          isNew: true
        }));

        setToasts(prev => [...newToasts, ...prev].slice(0, 3));

        // Update the set of seen notification IDs
        setPreviousNotificationIds(prev => {
          const updated = new Set(prev);
          newNotifications.forEach(n => updated.add(n.id));
          return updated;
        });

        // Auto-dismiss after 5 seconds
        newToasts.forEach(toast => {
          setTimeout(() => {
            dismissToast(toast.id);
          }, 5000);
        });
      }
    });

    return () => unsubscribe();
  }, [user?.id, previousNotificationIds]);

  const dismissToast = (id: string) => {
    setToasts(prev => prev.map(t =>
      t.id === id ? { ...t, isNew: false } : t
    ));

    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 300);
  };

  const handleToastClick = async (toast: ToastNotification) => {
    // Mark as read
    if (!toast.isRead) {
      await markNotificationAsRead(toast.id);
    }

    // Navigate to job if jobId exists
    if (toast.jobId) {
      navigate(`/jobs/${toast.jobId}`);
      dismissToast(toast.id);
    }
  };

  const handleDismiss = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    dismissToast(id);
  };

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-6 right-6 z-[100] flex flex-col gap-1.5 pointer-events-none">
      {toasts.map((toast, index) => {
        const Icon = getNotificationIcon(toast.type);
        const iconColor = getNotificationColor(toast.type);

        const displayTitle = toast.titleKey
          ? tVars(toast.titleKey, language, toast.messageVars || {})
          : toast.title;
        const displayMessage = toast.messageKey
          ? tVars(toast.messageKey, language, toast.messageVars || {})
          : toast.message;

        return (
          <div
            key={toast.id}
            className={`
              notification-toast pointer-events-auto
              ${toast.isNew ? 'notification-toast--in' : 'notification-toast--out'}
            `}
            style={{
              transition: 'transform 0.15s ease-out'
            }}
          >
            <div
              onClick={() => handleToastClick(toast)}
              className="notification-toast__box bg-card border border-border shadow-lg rounded-xl overflow-hidden flex items-center h-20 w-[320px] max-w-[calc(100vw-3rem)] cursor-pointer hover:shadow-xl transition-shadow"
            >
              {/* Content */}
              <div className="flex items-center flex-1 px-4 py-3 gap-3">
                <Icon className="flex-shrink-0 w-8 h-8" style={{ color: iconColor }} />
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm text-foreground line-clamp-1">
                    {displayTitle}
                  </div>
                  <div className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                    {displayMessage}
                  </div>
                </div>
              </div>

              {/* Close Button */}
              <div className="flex items-center h-full px-3">
                <button
                  onClick={(e) => handleDismiss(e, toast.id)}
                  className="p-1.5 rounded-full hover:bg-accent transition-colors focus:outline-none focus:bg-accent"
                  aria-label="Dismiss notification"
                >
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
