import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Calendar, CreditCard, Clock, AlertCircle, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { AdminNotification } from '@/types';

// Mock notifications
const mockNotifications: AdminNotification[] = [
  {
    id: 'notif-1',
    type: 'appointment',
    title: 'New Appointment',
    message: 'John Smith booked an oil change for Feb 28',
    read: false,
    createdAt: new Date(Date.now() - 5 * 60000).toISOString(),
    link: '/admin/appointments',
  },
  {
    id: 'notif-2',
    type: 'payment',
    title: 'Payment Received',
    message: 'Sarah Johnson paid $450 for brake service',
    read: false,
    createdAt: new Date(Date.now() - 30 * 60000).toISOString(),
    link: '/admin/billing',
  },
  {
    id: 'notif-3',
    type: 'reminder',
    title: 'Parts Arrived',
    message: 'Water pump for Michael Chen\'s BMW is ready',
    read: false,
    createdAt: new Date(Date.now() - 2 * 3600000).toISOString(),
    link: '/admin/appointments',
  },
  {
    id: 'notif-4',
    type: 'system',
    title: 'Low Inventory Alert',
    message: '5W-30 synthetic oil stock is running low',
    read: true,
    createdAt: new Date(Date.now() - 24 * 3600000).toISOString(),
  },
  {
    id: 'notif-5',
    type: 'appointment',
    title: 'Appointment Cancelled',
    message: 'Emily Rodriguez cancelled her tire rotation',
    read: true,
    createdAt: new Date(Date.now() - 48 * 3600000).toISOString(),
    link: '/admin/appointments',
  },
];

const getIcon = (type: AdminNotification['type']) => {
  switch (type) {
    case 'appointment':
      return Calendar;
    case 'payment':
      return CreditCard;
    case 'reminder':
      return Clock;
    case 'system':
      return AlertCircle;
    default:
      return Bell;
  }
};

const getTimeAgo = (dateString: string) => {
  const now = new Date();
  const date = new Date(dateString);
  const diff = now.getTime() - date.getTime();
  
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
};

export const NotificationCenter = () => {
  const [notifications, setNotifications] = useState<AdminNotification[]>(mockNotifications);
  const [isOpen, setIsOpen] = useState(false);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map(n => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const dismissNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          <AnimatePresence>
            {unreadCount > 0 && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-destructive text-destructive-foreground text-xs flex items-center justify-center font-medium"
              >
                {unreadCount > 9 ? '9+' : unreadCount}
              </motion.span>
            )}
          </AnimatePresence>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-0" align="end">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h3 className="font-semibold">Notifications</h3>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" onClick={markAllAsRead}>
              Mark all read
            </Button>
          )}
        </div>
        <ScrollArea className="h-[400px]">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Bell className="h-10 w-10 mb-3 opacity-50" />
              <p>No notifications</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {notifications.map((notification) => {
                const Icon = getIcon(notification.type);
                return (
                  <motion.div
                    key={notification.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className={cn(
                      'p-4 hover:bg-secondary/50 transition-colors cursor-pointer relative group',
                      !notification.read && 'bg-primary/5'
                    )}
                    onClick={() => markAsRead(notification.id)}
                  >
                    <div className="flex gap-3">
                      <div
                        className={cn(
                          'h-10 w-10 rounded-full flex items-center justify-center shrink-0',
                          notification.type === 'appointment' && 'bg-primary/10 text-primary',
                          notification.type === 'payment' && 'bg-green-500/10 text-green-500',
                          notification.type === 'reminder' && 'bg-yellow-500/10 text-yellow-500',
                          notification.type === 'system' && 'bg-destructive/10 text-destructive'
                        )}
                      >
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className="font-medium text-sm">{notification.title}</p>
                          {!notification.read && (
                            <span className="h-2 w-2 rounded-full bg-primary shrink-0 mt-1.5" />
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {notification.message}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {getTimeAgo(notification.createdAt)}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        dismissNotification(notification.id);
                      }}
                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-secondary rounded"
                    >
                      <X className="h-4 w-4 text-muted-foreground" />
                    </button>
                  </motion.div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
};
