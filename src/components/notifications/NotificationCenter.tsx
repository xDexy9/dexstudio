import React, { useState, useEffect } from 'react';
import { Bell, Check, CheckCheck, X, Trash2, Briefcase, MessageSquare, Package, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  subscribeToNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  getUnreadNotificationCount,
} from '@/services/notificationService';
import { Notification as NotificationType } from '@/lib/types';
import { cn } from '@/lib/utils';

const getNotificationIcon = (type: string) => {
  switch (type) {
    case 'job_completed':
      return <CheckCheck className="h-5 w-5" />;
    case 'job_assigned':
      return <Briefcase className="h-5 w-5" />;
    case 'job_updated':
      return <AlertCircle className="h-5 w-5" />;
    case 'message_received':
      return <MessageSquare className="h-5 w-5" />;
    case 'payment_received':
      return <Package className="h-5 w-5" />;
    default:
      return <Bell className="h-5 w-5" />;
  }
};

const getNotificationColor = (type: string) => {
  switch (type) {
    case 'job_completed':
      return 'bg-green-500/10 text-green-600 dark:text-green-400';
    case 'job_assigned':
      return 'bg-blue-500/10 text-blue-600 dark:text-blue-400';
    case 'job_updated':
      return 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400';
    case 'message_received':
      return 'bg-purple-500/10 text-purple-600 dark:text-purple-400';
    case 'payment_received':
      return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400';
    default:
      return 'bg-gray-500/10 text-gray-600 dark:text-gray-400';
  }
};

const getRelativeTime = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
  return date.toLocaleDateString('en-GB');
};

export function NotificationCenter() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<NotificationType[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!user?.id) return;

    // Subscribe to notifications
    const unsubscribe = subscribeToNotifications(user.id, (newNotifications) => {
      setNotifications(newNotifications);
      const unread = newNotifications.filter((n) => !n.isRead).length;
      setUnreadCount(unread);
    });

    return () => unsubscribe();
  }, [user?.id]);

  const handleNotificationClick = async (notification: NotificationType) => {
    // Mark as read
    if (!notification.isRead) {
      await markNotificationAsRead(notification.id);
    }

    // Navigate to job if jobId exists
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

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative h-10 w-10 rounded-full hover:bg-accent transition-all duration-200"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex items-center justify-center h-5 w-5 rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[380px] p-0"
        align="end"
        sideOffset={8}
      >
        <div className="flex items-center justify-between border-b px-4 py-3">
          <div>
            <h3 className="font-semibold text-base">Notifications</h3>
            {unreadCount > 0 && (
              <p className="text-xs text-muted-foreground">
                You have {unreadCount} unread {unreadCount === 1 ? 'notification' : 'notifications'}
              </p>
            )}
          </div>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleMarkAllRead}
              className="h-8 text-xs"
            >
              <CheckCheck className="h-4 w-4 mr-1" />
              Mark all read
            </Button>
          )}
        </div>

        <ScrollArea className="h-[400px]">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
              <div className="rounded-full bg-muted p-3 mb-3">
                <Bell className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium text-muted-foreground">No notifications yet</p>
              <p className="text-xs text-muted-foreground mt-1">
                We'll notify you when something important happens
              </p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notification) => (
                <button
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className={cn(
                    'w-full px-4 py-3 text-left transition-all duration-200 hover:bg-accent group',
                    !notification.isRead && 'bg-accent/50'
                  )}
                >
                  <div className="flex gap-3">
                    <div className={cn('flex-shrink-0 rounded-full p-2', getNotificationColor(notification.type))}>
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-semibold line-clamp-1">
                          {notification.title}
                        </p>
                        {!notification.isRead && (
                          <span className="flex-shrink-0 h-2 w-2 rounded-full bg-primary animate-pulse" />
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                        {notification.message}
                      </p>
                      <p className="text-xs text-muted-foreground/70 mt-2">
                        {getRelativeTime(notification.createdAt)}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </ScrollArea>

        {notifications.length > 0 && (
          <div className="border-t px-4 py-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                navigate('/settings');
                setIsOpen(false);
              }}
              className="w-full text-xs"
            >
              Notification Settings
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
