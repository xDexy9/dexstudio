import React, { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import BottomNav from './BottomNav';
import { OfficeSidebar } from './OfficeSidebar';
import { ManagerSidebar } from './ManagerSidebar';
import { NotificationToast } from '@/components/notifications/NotificationToast';
import { OfflineIndicator } from '@/components/OfflineIndicator';
import { useAuth } from '@/contexts/AuthContext';
import { useIsMobile } from '@/hooks/use-mobile';
import { SidebarProvider } from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';

interface AppLayoutProps {
  children: ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const { user, isLoading } = useAuth();
  const isMobile = useIsMobile();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // Office staff only gets their minimal page — redirect away from AppLayout routes
  if (user.role === 'office_staff') {
    return <Navigate to="/office" replace />;
  }

  // Mechanics always get mobile layout
  const isMechanic = user.role === 'mechanic';

  // Manager and admin get special sidebar
  const isManager = user.role === 'manager' || user.role === 'admin';

  // Office staff, admin, and manager get desktop sidebar on larger screens
  const useDesktopLayout = !isMechanic && !isMobile;

  if (useDesktopLayout) {
    return (
      <SidebarProvider defaultOpen={true}>
        <div className="min-h-screen flex w-full bg-background">
          {isManager ? <ManagerSidebar /> : <OfficeSidebar />}
          <main className="flex-1 overflow-auto">
            {/* Toast Notifications */}
            <NotificationToast />
            {/* Offline Indicator */}
            <OfflineIndicator />
            <div className="p-6 max-w-7xl mx-auto">
              {children}
            </div>
          </main>
        </div>
      </SidebarProvider>
    );
  }

  // Mobile layout for mechanics or small screens
  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Toast Notifications */}
      <NotificationToast />
      {/* Offline Indicator */}
      <OfflineIndicator />
      <main className="max-w-lg mx-auto">{children}</main>
      <BottomNav />
    </div>
  );
}
