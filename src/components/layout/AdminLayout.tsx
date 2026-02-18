import { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { 
  LayoutDashboard, 
  Calendar, 
  Users, 
  Receipt, 
  BarChart3, 
  Settings, 
  LogOut,
  Wrench,
  Bell,
  MapPin
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { NotificationCenter } from '@/components/admin/NotificationCenter';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';

interface AdminLayoutProps {
  children: ReactNode;
}

export const AdminLayout = ({ children }: AdminLayoutProps) => {
  const { t } = useTranslation();
  const location = useLocation();

  const navItems = [
    { icon: LayoutDashboard, label: t('admin.dashboard'), path: '/admin/dashboard' },
    { icon: Calendar, label: t('admin.appointments'), path: '/admin/appointments' },
    { icon: Users, label: t('admin.customers'), path: '/admin/customers' },
    { icon: Receipt, label: t('admin.billing'), path: '/admin/billing' },
    { icon: Bell, label: t('admin.reminders'), path: '/admin/reminders' },
    { icon: MapPin, label: t('admin.locations'), path: '/admin/locations' },
    { icon: BarChart3, label: t('admin.reports'), path: '/admin/reports' },
    { icon: Settings, label: t('admin.settings'), path: '/admin/settings' },
  ];

  return (
    <div className="min-h-screen bg-background flex">
      <aside className="w-64 bg-card border-r border-border flex flex-col">
        <div className="p-6 border-b border-border">
          <Link to="/admin/dashboard" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-glow-gradient flex items-center justify-center shadow-glow">
              <Wrench className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-bold text-lg">Joe Service</h1>
              <p className="text-xs text-muted-foreground">{t('admin.adminPanel')}</p>
            </div>
          </Link>
        </div>

        <div className="p-4 border-b border-border flex justify-between items-center">
          <LanguageSwitcher />
          <NotificationCenter />
        </div>

        <nav className="flex-1 p-4">
          <ul className="space-y-2">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    className={cn(
                      'flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200',
                      isActive
                        ? 'bg-primary text-primary-foreground shadow-glow'
                        : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
                    )}
                  >
                    <item.icon className="w-5 h-5" />
                    <span className="font-medium">{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="p-4 border-t border-border">
          <Link
            to="/"
            className="flex items-center gap-3 px-4 py-3 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-all duration-200"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">{t('admin.backToWebsite')}</span>
          </Link>
        </div>
      </aside>

      <main className="flex-1 overflow-auto">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {children}
        </motion.div>
      </main>
    </div>
  );
};
