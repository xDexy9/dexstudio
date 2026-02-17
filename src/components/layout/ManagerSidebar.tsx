import React, { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  Plus,
  ChevronLeft,
  ChevronRight,
  Shield,
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { getUnreadMessageCount, subscribeToJobs } from '@/services/firestoreService';
import { UnreadBadge } from '@/components/UnreadBadge';
import { Button } from '@/components/ui/button';
import { NotificationPanel } from '@/components/notifications/NotificationPanel';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getUserAvatarUrl } from '@/lib/avatarUtils';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from '@/components/ui/sidebar';
import { Badge } from '@/components/ui/badge';

const ICON_IMAGES: Record<string, string> = {
  '/dashboard':         '/iconsimages/dashboard.png',
  '/manager':           '/iconsimages/manager.png',
  '/jobs':              '/iconsimages/jobs.png',
  '/quotes':            '/iconsimages/quote.png',
  '/invoices':          '/iconsimages/invoice.png',
  '/messages':          '/iconsimages/chat.png',
  '/manager/analytics': '/iconsimages/analysis.png',
  '/vehicles':          '/iconsimages/cars.png',
  '/customers':         '/iconsimages/customers.png',
  '/team':              '/iconsimages/team.png',
  '/parts':             '/iconsimages/parts.png',
  '/services':          '/iconsimages/services.png',
  '/company-settings':  '/iconsimages/company.png',
  '/settings':          '/iconsimages/settings.png',
};

const mainNavItems = [
  { path: '/dashboard', labelKey: 'nav.dashboard', showBadge: false },
  { path: '/manager', labelKey: 'nav.manager', showBadge: false },
  { path: '/jobs', labelKey: 'nav.jobs', showBadge: false },
  { path: '/quotes', labelKey: 'nav.quotes', showBadge: false },
  { path: '/invoices', labelKey: 'nav.invoices', showBadge: false },
  { path: '/messages', labelKey: 'nav.chats', showBadge: true },
];

const managementItems = [
  { path: '/manager/analytics', labelKey: 'manager.nav.analytics', showBadge: false },
  { path: '/vehicles', labelKey: 'manager.nav.vehicles', showBadge: false },
  { path: '/customers', labelKey: 'manager.nav.customers', showBadge: false },
  { path: '/team', labelKey: 'manager.nav.team', showBadge: false },
  { path: '/parts', labelKey: 'nav.partsManagement', showBadge: false },
  { path: '/services', labelKey: 'nav.servicesManagement', showBadge: false },
  { path: '/company-settings', labelKey: 'nav.companySettings', showBadge: false },
  { path: '/data-management', labelKey: 'nav.dataManagement', showBadge: false },
];

export function ManagerSidebar() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const location = useLocation();
  const { state, toggleSidebar } = useSidebar();
  const isCollapsed = state === 'collapsed';

  const [unreadCount, setUnreadCount] = useState(0);
  const [notStartedCount, setNotStartedCount] = useState(0);

  useEffect(() => {
    const loadUnread = async () => {
      if (user) {
        const count = await getUnreadMessageCount(user.id, undefined, user.role);
        setUnreadCount(count);
      }
    };
    loadUnread();
    const interval = setInterval(loadUnread, 30000);
    return () => clearInterval(interval);
  }, [user]);

  useEffect(() => {
    const unsubscribe = subscribeToJobs((jobs) => {
      const count = jobs.filter(j => j.status === 'not_started').length;
      setNotStartedCount(count);
    });
    return () => unsubscribe();
  }, []);

  const isActive = (path: string) =>
    location.pathname === path ||
    (path !== '/manager' && location.pathname.startsWith(path));

  return (
    <Sidebar
      className={cn(
        "border-r border-border/40 bg-gradient-to-b from-card via-card to-muted/20 transition-all duration-300",
        isCollapsed ? "w-[72px]" : "w-48"
      )}
      collapsible="icon"
    >
      <SidebarHeader className="p-3 pb-4 border-b border-border/40 bg-gradient-to-br from-primary/5 via-transparent to-transparent">
        <div className={cn("flex items-center", isCollapsed ? "justify-center flex-col gap-1.5" : "justify-between")}>
          <div className="flex items-center gap-2.5">
            <img src="/Garageprologo.png" alt="GaragePro Logo" className="w-12 h-12 object-contain" />
            {!isCollapsed && (
              <div>
                <h1 className="font-bold text-base bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">GaragePro</h1>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <Badge variant="secondary" className="text-[9px] px-1.5 py-0 font-semibold bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
                    {t('manager.role')}
                  </Badge>
                </div>
              </div>
            )}
          </div>
          {!isCollapsed && <NotificationPanel />}
        </div>
      </SidebarHeader>

      <SidebarContent className="p-2">
        {/* Quick Action */}
        {!isCollapsed && (
          <div className="mb-3 px-1">
            <NavLink to="/jobs/new">
              <button className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-[20px] border-none text-white font-semibold text-sm bg-gradient-to-r from-[#0400ff] to-[#1a8adb] dark:from-[#0200aa] dark:to-[#0d5a9a] bg-[length:100%_auto] hover:bg-[length:200%_auto] hover:bg-right hover:animate-pulse-glow transition-all duration-300 cursor-pointer">
                <Plus className="h-4 w-4" />
                {t('dashboard.createJob')}
              </button>
            </NavLink>
          </div>
        )}

        {isCollapsed && (
          <div className="mb-3 flex justify-center">
            <NavLink to="/jobs/new">
              <button className="h-10 w-10 rounded-full border-none text-white bg-gradient-to-r from-[#0400ff] to-[#1a8adb] dark:from-[#0200aa] dark:to-[#0d5a9a] bg-[length:100%_auto] hover:bg-[length:200%_auto] hover:bg-right hover:animate-pulse-glow transition-all duration-300 cursor-pointer flex items-center justify-center">
                <Plus className="h-4 w-4" />
              </button>
            </NavLink>
          </div>
        )}

        {/* Main Navigation */}
        <SidebarGroup>
          <SidebarGroupLabel className={cn("px-2 mb-1.5 text-[10px] font-bold uppercase tracking-wider text-white/70", isCollapsed && "sr-only")}>
            {t('manager.nav.main')}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-0.5">
              {mainNavItems.map((item) => {
                const active = isActive(item.path);

                return (
                  <SidebarMenuItem key={item.path}>
                    <SidebarMenuButton asChild>
                      <NavLink
                        to={item.path}
                        className={cn(
                          "flex items-center gap-2.5 pl-1 pr-2.5 py-2.5 rounded-lg transition-all duration-200 relative group",
                          active
                            ? "bg-gradient-to-r from-primary to-primary/90 text-white shadow-lg shadow-primary/25 "
                            : "hover:bg-muted/60 text-white/90 hover:text-white ",
                          isCollapsed && "justify-center px-1"
                        )}
                      >
                        <div className="relative flex-shrink-0">
                          <img
                            src={ICON_IMAGES[item.path]}
                            alt=""
                            className={cn(
                              "w-[18px] h-[18px] object-contain transition-transform duration-200",
                              !isCollapsed && ""
                            )}
                          />
                          {item.showBadge && unreadCount > 0 && isCollapsed && (
                            <UnreadBadge count={unreadCount} className="-top-1 -right-2" />
                          )}
                          {item.path === '/dashboard' && notStartedCount > 0 && isCollapsed && (
                            <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center w-[24px] h-[24px] rounded-full overflow-visible">
                              <span className="absolute inline-flex h-4 w-4 animate-ping rounded-full bg-green-600 opacity-75" />
                              <span className="relative inline-flex items-center justify-center min-w-[15px] h-[15px] px-0.5 text-[9px] font-bold text-white bg-green-700 rounded-full shadow-lg shadow-green-700/40">
                                {notStartedCount > 9 ? '9+' : notStartedCount}
                              </span>
                            </span>
                          )}
                        </div>
                        {!isCollapsed && (
                          <>
                            <span className="font-semibold text-sm text-white">
                              {t(item.labelKey)}
                            </span>
                            {item.path === '/dashboard' && notStartedCount > 0 && (
                              <span className="relative inline-flex items-center justify-center ml-1 w-[32px] h-[32px] rounded-full overflow-visible">
                                <span className="absolute inline-flex h-6 w-6 animate-ping rounded-full bg-green-600 opacity-75" />
                                <span className="relative inline-flex items-center justify-center min-w-[17px] h-[17px] px-1 text-[10px] font-bold text-white bg-green-700 rounded-full shadow-lg shadow-green-700/40">
                                  {notStartedCount > 99 ? '99+' : notStartedCount}
                                </span>
                              </span>
                            )}
                            {item.showBadge && unreadCount > 0 && (
                              <span className="relative inline-flex items-center justify-center ml-1 w-[32px] h-[32px] rounded-full overflow-visible">
                                <span className="absolute inline-flex h-6 w-6 animate-ping rounded-full bg-amber-400 opacity-75" />
                                <span className="relative inline-flex items-center justify-center min-w-[17px] h-[17px] px-1 text-[10px] font-bold text-white bg-amber-500 rounded-full shadow-lg shadow-amber-500/40">
                                  {unreadCount > 99 ? '99+' : unreadCount}
                                </span>
                              </span>
                            )}
                          </>
                        )}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Management Section */}
        <SidebarGroup className="mt-0.5">
          <SidebarGroupLabel className={cn("px-2 mb-1.5 text-[10px] font-bold uppercase tracking-wider text-white/70", isCollapsed && "sr-only")}>
            {t('manager.nav.management')}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-0.5">
              {managementItems.map((item) => {
                const active = isActive(item.path);

                return (
                  <SidebarMenuItem key={item.path}>
                    <SidebarMenuButton asChild>
                      <NavLink
                        to={item.path}
                        className={cn(
                          "flex items-center gap-2.5 pl-1 pr-2.5 py-2.5 rounded-lg transition-all duration-200 group",
                          active
                            ? "bg-gradient-to-r from-primary to-primary/90 text-white shadow-lg shadow-primary/25 "
                            : "hover:bg-muted/60 text-white/90 hover:text-white ",
                          isCollapsed && "justify-center px-1"
                        )}
                      >
                        <img
                          src={ICON_IMAGES[item.path]}
                          alt=""
                          className={cn(
                            "w-[18px] h-[18px] object-contain flex-shrink-0 transition-transform duration-200",
                            !isCollapsed && ""
                          )}
                        />
                        {!isCollapsed && (
                          <span className="font-semibold text-sm text-white">
                            {t(item.labelKey)}
                          </span>
                        )}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-2 border-t border-border/40 bg-gradient-to-br from-muted/20 to-transparent">
        {/* Settings */}
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <NavLink
                to="/settings"
                className={cn(
                  "flex items-center gap-2.5 pl-1 pr-2.5 py-2.5 rounded-lg transition-all duration-200 group",
                  isActive('/settings')
                    ? "bg-gradient-to-r from-primary to-primary/90 text-white shadow-lg shadow-primary/25"
                    : "hover:bg-muted/60 text-white/90 hover:text-white",
                  isCollapsed && "justify-center px-1"
                )}
              >
                <img
                  src={ICON_IMAGES['/settings']}
                  alt=""
                  className={cn(
                    "w-[18px] h-[18px] object-contain flex-shrink-0 transition-transform duration-200",
                    !isCollapsed && ""
                  )}
                />
                {!isCollapsed && (
                  <span className="font-semibold text-sm text-white">
                    {t('nav.settings')}
                  </span>
                )}
              </NavLink>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>

        {/* Collapse Toggle */}
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleSidebar}
          className={cn(
            "w-full mt-1.5 hover:bg-muted/60 transition-all text-white/90 hover:text-white",
            isCollapsed && "px-2"
          )}
        >
          {isCollapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <>
              <ChevronLeft className="h-4 w-4 mr-1.5" />
              <span className="text-xs font-medium">{t('manager.collapse')}</span>
            </>
          )}
        </Button>

        {/* User Info */}
        {!isCollapsed && user && (
          <div className="mt-2 p-3 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent rounded-lg border border-primary/20 shadow-sm">
            <div className="flex items-center gap-2">
              <Avatar className="h-8 w-8">
                {getUserAvatarUrl(user.email) && (
                  <AvatarImage src={getUserAvatarUrl(user.email)} alt={user.fullName} />
                )}
                <AvatarFallback className="text-xs bg-primary/20 text-white">
                  {user.fullName.split(' ').map(n => n[0]).join('').slice(0, 2)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-xs truncate text-white">{user.fullName}</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <Shield className="h-3 w-3 text-white" />
                  <p className="text-[10px] text-white/70 font-semibold">{t('manager.role')}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
