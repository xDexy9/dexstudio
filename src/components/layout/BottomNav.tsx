import { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { getUnreadMessageCount, subscribeToJobs } from '@/services/firestoreService';
import { UnreadBadge } from '@/components/UnreadBadge';
import { NotificationPanel } from '@/components/notifications/NotificationPanel';
import { Button } from '@/components/ui/button';
import { subscribeToNotifications } from '@/services/notificationService';

const ICON_IMAGES: Record<string, string> = {
  '/dashboard': '/iconsimages/dashboard.png',
  '/manager':   '/iconsimages/manager.png',
  '/jobs':      '/iconsimages/jobs.png',
  '/quotes':    '/iconsimages/quote.png',
  '/invoices':  '/iconsimages/invoice.png',
  '/messages':  '/iconsimages/chat.png',
  '/settings':  '/iconsimages/settings.png',
};

const navItems = [
  { path: '/dashboard', labelKey: 'nav.dashboard', showBadge: false, roles: ['admin', 'manager', 'mechanic'] },
  { path: '/manager', labelKey: 'nav.manager', showBadge: false, roles: ['admin', 'manager'] },
  { path: '/jobs', labelKey: 'nav.jobs', showBadge: false, roles: ['admin', 'manager'] },
  { path: '/quotes', labelKey: 'nav.quotes', showBadge: false, roles: ['admin', 'manager'] },
  { path: '/invoices', labelKey: 'nav.invoices', showBadge: false, roles: ['admin', 'manager'] },
  { path: '/messages', labelKey: 'nav.chats', showBadge: true, roles: ['admin', 'manager', 'mechanic'] },
  { path: '/settings', labelKey: 'nav.settings', showBadge: false, roles: ['admin', 'manager', 'mechanic'] },
];

export default function BottomNav() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const location = useLocation();
  const [unreadCount, setUnreadCount] = useState(0);
  const [notificationUnreadCount, setNotificationUnreadCount] = useState(0);
  const [notStartedCount, setNotStartedCount] = useState(0);

  useEffect(() => {
    const loadUnreadCount = async () => {
      if (user) {
        const count = await getUnreadMessageCount(user.id, undefined, user.role);
        setUnreadCount(count);
      }
    };
    loadUnreadCount();
  }, [user]);

  useEffect(() => {
    if (user?.role !== 'mechanic' || !user?.id) return;
    const unsubscribe = subscribeToJobs((jobs) => {
      const count = jobs.filter(j => j.status === 'not_started' && j.assignedMechanicId === user.id).length;
      setNotStartedCount(count);
    });
    return () => unsubscribe();
  }, [user?.role, user?.id]);

  useEffect(() => {
    if (!user?.id) return;

    const unsubscribe = subscribeToNotifications(user.id, (notifications) => {
      const unread = notifications.filter((n) => !n.isRead).length;
      setNotificationUnreadCount(unread);
    });

    return () => unsubscribe();
  }, [user?.id]);

  // Filter nav items based on user role
  const visibleNavItems = navItems.filter(item =>
    user && item.roles.includes(user.role)
  );

  const isMechanic = user?.role === 'mechanic';

  // For mechanics: Dashboard, Alerts, Chats, Settings
  // For others: First 2 items, Alerts, remaining items
  const renderNavItem = (item: typeof navItems[0]) => {
    const isActive = location.pathname === item.path ||
                    (item.path !== '/dashboard' && location.pathname.startsWith(item.path));

    return (
      <NavLink
        key={item.path}
        to={item.path}
        className={cn(
          "relative flex flex-col items-center justify-center gap-1 w-16 h-full transition-colors",
          isActive
            ? "text-primary"
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        <div className="relative">
          <img
            src={ICON_IMAGES[item.path]}
            alt=""
            className={cn(
              "w-[26px] h-[26px] object-contain transition-all duration-200",
              isActive ? "scale-110" : "opacity-80 hover:opacity-100 hover:scale-105"
            )}
          />
          {item.showBadge && unreadCount > 0 && (
            <UnreadBadge count={unreadCount} className="-top-1 -right-2" />
          )}
          {item.path === '/dashboard' && isMechanic && notStartedCount > 0 && (
            <span className="absolute -top-0.5 -right-3 flex items-center justify-center w-[24px] h-[24px] rounded-full overflow-visible">
              <span className="absolute inline-flex h-4 w-4 animate-ping rounded-full bg-green-600 opacity-75" />
              <span className="relative inline-flex items-center justify-center min-w-[15px] h-[15px] px-0.5 text-[9px] font-bold text-white bg-green-700 rounded-full shadow-lg shadow-green-700/40">
                {notStartedCount > 9 ? '9+' : notStartedCount}
              </span>
            </span>
          )}
        </div>
        <span className="text-[10px] font-medium text-center leading-tight line-clamp-2 w-full px-0.5">{t(item.labelKey)}</span>
      </NavLink>
    );
  };

  const renderNotificationBell = () => (
    <div className="relative flex flex-col items-center justify-center gap-1 w-16 h-full">
      <NotificationPanel
        trigger={
          <Button
            variant="ghost"
            size="icon"
            className="relative h-10 w-10 hover:bg-transparent transition-colors"
          >
            <img src="/iconsimages/alerts.png" alt="" className="w-[26px] h-[26px] object-contain" />
            {notificationUnreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center w-[24px] h-[24px] rounded-full overflow-visible">
                <span className="absolute inline-flex h-4 w-4 animate-ping rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex items-center justify-center min-w-[15px] h-[15px] px-0.5 text-[9px] font-bold text-white bg-red-500 rounded-full shadow-lg shadow-red-500/40">
                  {notificationUnreadCount > 9 ? '9+' : notificationUnreadCount}
                </span>
              </span>
            )}
          </Button>
        }
      />
      <span className="text-[10px] font-medium text-muted-foreground text-center leading-tight line-clamp-2 w-full px-0.5">{t('nav.alerts')}</span>
    </div>
  );

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border safe-bottom z-50">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto">
        {isMechanic ? (
          <>
            {/* Mechanic order: Dashboard, Alerts, Chats, Settings */}
            {visibleNavItems.filter(item => item.path === '/dashboard').map(renderNavItem)}
            {renderNotificationBell()}
            {visibleNavItems.filter(item => item.path === '/messages').map(renderNavItem)}
            {visibleNavItems.filter(item => item.path === '/settings').map(renderNavItem)}
          </>
        ) : (
          <>
            {/* Others: First 2 items, Alerts, remaining items */}
            {visibleNavItems.slice(0, 2).map(renderNavItem)}
            {renderNotificationBell()}
            {visibleNavItems.slice(2).map(renderNavItem)}
          </>
        )}
      </div>
    </nav>
  );
}
