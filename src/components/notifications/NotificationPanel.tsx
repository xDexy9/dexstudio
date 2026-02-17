import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BadgeCheck, Wrench, Flame, MessagesSquare, Banknote, BellRing, CheckCheck, Trash2 } from 'lucide-react';
import { tVars } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  subscribeToNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteAllReadNotifications,
} from '@/services/notificationService';
import { toast } from 'sonner';
import { Notification as NotificationType } from '@/lib/types';
import { cn } from '@/lib/utils';

const getNotificationIcon = (type: string) => {
  switch (type) {
    case 'job_completed':   return BadgeCheck;
    case 'job_assigned':    return Wrench;
    case 'job_updated':     return Flame;
    case 'message_received': return MessagesSquare;
    case 'payment_received': return Banknote;
    default:                return BellRing;
  }
};

const getNotificationColor = (type: string): string => {
  switch (type) {
    case 'job_completed':   return '#22c55e';
    case 'job_assigned':    return '#3b82f6';
    case 'job_updated':     return '#f97316';
    case 'message_received': return '#a855f7';
    case 'payment_received': return '#10b981';
    default:                return '#6366f1';
  }
};

const LOCALE_MAP: Record<string, string> = { en: 'en-GB', fr: 'fr-FR', ro: 'ro-RO', pt: 'pt-PT', ru: 'ru-RU' };

const getRelativeTime = (timestamp: any, justNow: string, lang: string) => {
  const date = timestamp?.toDate ? timestamp.toDate() : new Date(timestamp);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return justNow;
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d`;
  return date.toLocaleDateString(LOCALE_MAP[lang] || 'en-GB');
};

interface NotificationPanelProps {
  trigger?: React.ReactNode;
}

export function NotificationPanel({ trigger }: NotificationPanelProps) {
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<NotificationType[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!user?.id) return;

    const unsubscribe = subscribeToNotifications(user.id, (newNotifications) => {
      setNotifications(newNotifications);
      const unread = newNotifications.filter((n) => !n.isRead).length;
      setUnreadCount(unread);
    });

    return () => unsubscribe();
  }, [user?.id]);

  const handleNotificationClick = async (notification: NotificationType) => {
    if (!notification.isRead) {
      await markNotificationAsRead(notification.id);
    }
    if (notification.jobId) {
      navigate(`/jobs/${notification.jobId}`);
      setIsOpen(false);
    }
  };

  const handleMarkAllRead = async () => {
    if (user?.id) {
      await markAllNotificationsAsRead(user.id);
    }
  };

  const handleDeleteAllRead = async () => {
    if (!user?.id) return;
    const readCount = notifications.filter((n) => n.isRead).length;
    if (readCount === 0) {
      toast.info(t('notifications.noReadToDelete'));
      return;
    }
    try {
      const deletedCount = await deleteAllReadNotifications(user.id);
      toast.success(`Deleted ${deletedCount} read notification${deletedCount !== 1 ? 's' : ''}`);
    } catch (error) {
      console.error('Error deleting notifications:', error);
      toast.error(t('notifications.deleteFailed'));
    }
  };

  const readCount = notifications.filter((n) => n.isRead).length;

  const defaultTrigger = (
    <Button
      variant="ghost"
      size="icon"
      className="relative h-10 w-10 rounded-full hover:bg-accent transition-all duration-200"
    >
      <BellRing className="h-5 w-5" />
      {unreadCount > 0 && (
        <span className="absolute -top-1 -right-1 flex items-center justify-center w-[28px] h-[28px] rounded-full overflow-visible">
          <span className="absolute inline-flex h-5 w-5 animate-ping rounded-full bg-red-400 opacity-75"></span>
          <span className="relative inline-flex items-center justify-center min-w-[17px] h-[17px] px-1 text-[10px] font-bold text-white bg-red-500 rounded-full shadow-lg shadow-red-500/40">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        </span>
      )}
    </Button>
  );

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        {trigger || defaultTrigger}
      </SheetTrigger>
      <SheetContent className="w-full sm:w-[420px] p-0 flex flex-col sheet-above-nav" style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}>

        {/* Header */}
        <SheetHeader className="px-5 pt-5 pb-4 border-b bg-background">
          <div className="flex items-center justify-between mb-3">
            <div>
              <SheetTitle className="text-xl font-bold tracking-tight">{t('notifications.title')}</SheetTitle>
              {unreadCount > 0 && (
                <SheetDescription className="text-xs text-muted-foreground mt-0.5">
                  {unreadCount} unread
                </SheetDescription>
              )}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-2">
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="flex-1 flex items-center justify-center gap-2 h-9 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary text-xs font-semibold transition-colors"
              >
                <CheckCheck className="h-3.5 w-3.5" />
                {t('notifications.markAllRead')}
              </button>
            )}
            {readCount > 0 && (
              <button
                onClick={handleDeleteAllRead}
                className="flex-1 flex items-center justify-center gap-2 h-9 rounded-xl bg-destructive/10 hover:bg-destructive/20 text-destructive text-xs font-semibold transition-colors"
              >
                <Trash2 className="h-3.5 w-3.5" />
                {t('notifications.clearRead')}
              </button>
            )}
          </div>
        </SheetHeader>

        {/* List */}
        <ScrollArea className="flex-1 px-3">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
              <div className="rounded-2xl p-5 mb-4" style={{ backgroundColor: '#6366f120' }}>
                <BellRing className="h-10 w-10" style={{ color: '#6366f1' }} />
              </div>
              <p className="text-base font-semibold text-foreground mb-1">{t('notifications.empty')}</p>
              <p className="text-sm text-muted-foreground max-w-xs">{t('notifications.emptyDesc')}</p>
            </div>
          ) : (
            <div className="py-3 space-y-2">
              {notifications.map((notification) => {
                const Icon = getNotificationIcon(notification.type);
                const color = getNotificationColor(notification.type);

                const displayTitle = notification.titleKey
                  ? tVars(notification.titleKey, language, notification.messageVars || {})
                  : notification.title;
                const displayMessage = notification.messageKey
                  ? tVars(notification.messageKey, language, notification.messageVars || {})
                  : notification.message;

                return (
                  <button
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    className={cn(
                      'w-full text-left rounded-2xl px-4 py-3.5 transition-all duration-200 group border',
                      'hover:shadow-md active:scale-[0.98]',
                      !notification.isRead
                        ? 'bg-accent/40 border-border'
                        : 'bg-muted/30 border-transparent hover:border-border'
                    )}
                  >
                    <div className="flex gap-3 items-start">
                      <Icon className="flex-shrink-0 w-7 h-7 mt-0.5" style={{ color }} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-0.5">
                          <p className="text-sm font-semibold line-clamp-1 text-foreground">
                            {displayTitle}
                          </p>
                          <div className="flex items-center gap-1.5 flex-shrink-0">
                            <span className="text-[11px] text-muted-foreground font-medium">
                              {getRelativeTime(notification.createdAt, t('notifications.justNow'), language)}
                            </span>
                            {!notification.isRead && (
                              <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                            )}
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {displayMessage}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </ScrollArea>

        {/* Footer count */}
        {notifications.length > 0 && (
          <div className="border-t px-5 py-3 bg-muted/20">
            <p className="text-xs text-center text-muted-foreground">
              {notifications.length} notification{notifications.length !== 1 ? 's' : ''}
            </p>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
