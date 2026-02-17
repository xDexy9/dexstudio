import { useNavigate } from 'react-router-dom';
import { PlusCircle, Settings, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';

export default function OfficeStaffHomePage() {
  const { user, logout } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/auth');
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
      {/* Logo */}
      <img
        src="/Garageprologo.png"
        alt="GaragePRO"
        className="h-16 mb-2 object-contain"
      />

      {/* User info */}
      <p className="text-sm text-muted-foreground mb-10">
        {user?.fullName}
      </p>

      {/* Create Job button */}
      <Button
        size="lg"
        className="w-full max-w-xs h-14 text-lg gap-3 mb-6"
        onClick={() => navigate('/jobs/new')}
      >
        <PlusCircle className="h-6 w-6" />
        {t('jobs.createWorkOrder')}
      </Button>

      {/* Secondary actions */}
      <div className="flex gap-4">
        <Button
          variant="outline"
          size="sm"
          className="gap-2"
          onClick={() => navigate('/office/settings')}
        >
          <Settings className="h-4 w-4" />
          {t('nav.settings')}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="gap-2 text-destructive hover:text-destructive"
          onClick={handleLogout}
        >
          <LogOut className="h-4 w-4" />
          {t('settings.logout')}
        </Button>
      </div>
    </div>
  );
}
