import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Globe, Bell, LogOut, Wrench, CheckCircle, Clock, TrendingUp, Sun, Moon, Share, Plus, ArrowLeft } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { languages, Language } from '@/lib/i18n';
import { getUserSettings, updateUserSettings, getJobsByMechanic } from '@/services/firestoreService';
import { UserSettings } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { getUserAvatarUrl } from '@/lib/avatarUtils';
import { LanguageFlag } from '@/components/ui/language-flag';

export default function SettingsPage() {
  const { user, logout } = useAuth();
  const { t, language, setLanguage } = useLanguage();
  const navigate = useNavigate();
  const { toast } = useToast();
  const installPromptRef = useRef<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showIOSModal, setShowIOSModal] = useState(false);

  useEffect(() => {
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      return;
    }
    // Capture the prompt as early as possible
    const handler = (e: Event) => {
      e.preventDefault();
      installPromptRef.current = e;
    };
    window.addEventListener('beforeinstallprompt', handler as EventListener);
    window.addEventListener('appinstalled', () => setIsInstalled(true));
    return () => window.removeEventListener('beforeinstallprompt', handler as EventListener);
  }, []);

  const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);

  const handleInstallAndroid = async () => {
    const prompt = (window as any).__pwaInstallPrompt || installPromptRef.current;
    if (prompt) {
      try {
        await prompt.prompt();
        const { outcome } = await prompt.userChoice;
        if (outcome === 'accepted') {
          (window as any).__pwaInstallPrompt = null;
          installPromptRef.current = null;
          setIsInstalled(true);
        }
        return;
      } catch {
        // fall through to instructions
      }
    }
    toast({
      title: t('settings.installAndroid'),
      description: t('settings.androidInstallFallback'),
      duration: 8000,
    });
  };

  const handleInstallIOS = () => {
    setShowIOSModal(true);
  };

  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [mechanicStats, setMechanicStats] = useState({
    totalCompleted: 0,
    activeJobs: 0,
    waitingParts: 0,
    completionRate: 0,
  });
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('theme');
    if (saved) return saved === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    const root = document.documentElement;
    if (isDarkMode) {
      root.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  // Load user settings on mount
  useEffect(() => {
    if (user?.id) {
      loadSettings();
      if (user.role === 'mechanic') {
        loadMechanicStats();
      }
    }
  }, [user?.id, user?.role]);


  const loadSettings = async () => {
    try {
      setLoading(true);
      const userSettings = await getUserSettings(user!.id);
      setSettings(userSettings);
    } catch (error) {
      console.error('Error loading settings:', error);
      toast({
        title: t('common.error'),
        description: t('settings.failedToLoad'),
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const loadMechanicStats = async () => {
    try {
      const jobs = await getJobsByMechanic(user!.id);

      // Calculate statistics
      const completed = jobs.filter(j => j.status === 'completed');
      const active = jobs.filter(j => j.status === 'in_progress');
      const waitingParts = jobs.filter(j => j.status === 'waiting_for_parts');
      const completionRate = jobs.length > 0 ? Math.round((completed.length / jobs.length) * 100) : 0;

      setMechanicStats({
        totalCompleted: completed.length,
        activeJobs: active.length,
        waitingParts: waitingParts.length,
        completionRate,
      });
    } catch (error) {
      console.error('Error loading mechanic stats:', error);
    }
  };

  const handleNotificationToggle = async (key: keyof UserSettings, value: boolean) => {
    if (!user?.id || !settings) return;

    try {
      // Update local state immediately
      setSettings({ ...settings, [key]: value });

      // Update in Firestore
      await updateUserSettings(user.id, { [key]: value });

      toast({
        title: t('settings.updated'),
        description: t('settings.savedSuccess'),
      });
    } catch (error) {
      console.error('Error updating settings:', error);
      toast({
        title: t('common.error'),
        description: t('settings.updateFailed'),
        variant: 'destructive',
      });
      // Revert local state on error
      loadSettings();
    }
  };


  const handleLogout = () => {
    logout();
    navigate('/auth');
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const currentLanguage = languages.find(l => l.code === language);

  return (
    <div className="safe-top">
      {/* Header */}
      <div className="px-4 pt-4 pb-4 flex items-center gap-3">
        {user?.role === 'office_staff' && (
          <Button variant="ghost" size="icon" onClick={() => navigate('/office')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
        )}
        <h1 className="text-2xl font-bold">{t('nav.settings')}</h1>
      </div>

      {/* Profile Card */}
      <div className="px-4 mb-6">
        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                {user?.email && getUserAvatarUrl(user.email) && (
                  <AvatarImage src={getUserAvatarUrl(user.email)} alt={user.fullName} />
                )}
                <AvatarFallback className="text-lg bg-primary text-primary-foreground">
                  {user?.fullName ? getInitials(user.fullName) : 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h3 className="font-semibold text-lg">{user?.fullName}</h3>
                <p className="text-sm text-muted-foreground">{user?.email}</p>
                <p className="text-xs text-muted-foreground capitalize">
                  {user?.role?.replace('_', ' ')}
                </p>
              </div>
              {isInstalled ? (
                <div className="flex flex-col items-center gap-1">
                  <div className="w-9 h-9 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                    <CheckCircle className="h-5 w-5 text-emerald-600" />
                  </div>
                  <span className="text-[10px] text-emerald-600 font-medium">{t('settings.installed')}</span>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {/* Android button */}
                  <button
                    onClick={handleInstallAndroid}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#3ddc84]/10 border border-[#3ddc84]/40 hover:bg-[#3ddc84]/20 transition-colors"
                    title="Install on Android"
                  >
                    <img src="/iconsimages/androidicon.png" alt="Android" className="h-4 w-4 object-contain" />
                    <span className="text-[10px] font-semibold text-[#3ddc84]">{t('settings.installAndroid')}</span>
                  </button>
                  {/* iOS button */}
                  <button
                    onClick={handleInstallIOS}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                    title="Install on iPhone / iPad"
                  >
                    <svg viewBox="0 0 24 24" className="h-4 w-4 fill-gray-700 dark:fill-gray-300" xmlns="http://www.w3.org/2000/svg">
                      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                    </svg>
                    <span className="text-[10px] font-semibold text-gray-700 dark:text-gray-300">{t('settings.installIOS')}</span>
                  </button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Settings List */}
      <div className="px-4 space-y-4">
        {/* Language Selection */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Globe className="h-5 w-5" />
              {t('settings.language')}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid grid-cols-2 gap-2">
              {languages.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => setLanguage(lang.code)}
                  className={`flex items-center gap-2 p-3 rounded-lg border-2 transition-all ${
                    language === lang.code
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <LanguageFlag code={lang.code} size="md" />
                  <span className="font-medium text-sm">{lang.label}</span>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Dark Mode */}
        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {isDarkMode ? (
                  <Moon className="h-5 w-5 text-violet-400" />
                ) : (
                  <Sun className="h-5 w-5 text-amber-500" />
                )}
                <div>
                  <p className="text-sm font-medium">{t('settings.darkMode')}</p>
                  <p className="text-xs text-muted-foreground">{t('settings.darkModeDesc')}</p>
                </div>
              </div>
              <Switch
                checked={isDarkMode}
                onCheckedChange={setIsDarkMode}
              />
            </div>
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Bell className="h-5 w-5" />
              {t('settings.notificationPreferences')}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {loading ? (
              <div className="py-4 text-center text-muted-foreground">
                {t('common.loading')}
              </div>
            ) : settings ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <label className="text-sm font-medium">
                      {t('settings.notifyJobCreated')}
                    </label>
                  </div>
                  <Switch
                    checked={settings.notifyJobCreated ?? true}
                    onCheckedChange={(checked) =>
                      handleNotificationToggle('notifyJobCreated', checked)
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <label className="text-sm font-medium">
                      {t('settings.notifyJobAssigned')}
                    </label>
                  </div>
                  <Switch
                    checked={settings.notifyJobAssigned ?? true}
                    onCheckedChange={(checked) =>
                      handleNotificationToggle('notifyJobAssigned', checked)
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <label className="text-sm font-medium">
                      {t('settings.notifyJobStatusChanged')}
                    </label>
                  </div>
                  <Switch
                    checked={settings.notifyJobStatusChanged ?? true}
                    onCheckedChange={(checked) =>
                      handleNotificationToggle('notifyJobStatusChanged', checked)
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <label className="text-sm font-medium">
                      {t('settings.notifyJobCompleted')}
                    </label>
                  </div>
                  <Switch
                    checked={settings.notifyJobCompleted ?? true}
                    onCheckedChange={(checked) =>
                      handleNotificationToggle('notifyJobCompleted', checked)
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <label className="text-sm font-medium">
                      {t('settings.notifyNewMessage')}
                    </label>
                  </div>
                  <Switch
                    checked={settings.notifyNewMessage ?? true}
                    onCheckedChange={(checked) =>
                      handleNotificationToggle('notifyNewMessage', checked)
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <label className="text-sm font-medium">
                      {t('settings.notifyPartsStatusChanged')}
                    </label>
                  </div>
                  <Switch
                    checked={settings.notifyPartsStatusChanged ?? true}
                    onCheckedChange={(checked) =>
                      handleNotificationToggle('notifyPartsStatusChanged', checked)
                    }
                  />
                </div>

                {/* Smart Notifications Section */}
                <div className="pt-4 mt-4 border-t">
                  <h4 className="text-sm font-semibold mb-3">{t('settings.smartNotifications')}</h4>

                  {/* Urgent Only Toggle */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="space-y-0.5">
                      <label className="text-sm font-medium">{t('settings.urgentJobsOnly')}</label>
                      <p className="text-xs text-muted-foreground">
                        {t('settings.urgentJobsOnlyDesc')}
                      </p>
                    </div>
                    <Switch
                      checked={settings.notifyUrgentOnly ?? false}
                      onCheckedChange={(checked) =>
                        handleNotificationToggle('notifyUrgentOnly', checked)
                      }
                    />
                  </div>

                  {/* Quiet Hours Toggle */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="space-y-0.5">
                      <label className="text-sm font-medium">{t('settings.quietHours')}</label>
                      <p className="text-xs text-muted-foreground">
                        {t('settings.quietHoursDesc')}
                      </p>
                    </div>
                    <Switch
                      checked={settings.quietHoursEnabled ?? false}
                      onCheckedChange={(checked) =>
                        handleNotificationToggle('quietHoursEnabled', checked)
                      }
                    />
                  </div>

                  {/* Quiet Hours Time Inputs */}
                  {settings.quietHoursEnabled && (
                    <div className="ml-4 mb-4 space-y-3 p-3 bg-secondary/30 rounded-lg">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <Label htmlFor="quietStart" className="text-xs">{t('settings.startTime')}</Label>
                          <Input
                            id="quietStart"
                            type="time"
                            value={settings.quietHoursStart || '22:00'}
                            onChange={(e) =>
                              handleNotificationToggle('quietHoursStart', e.target.value as any)
                            }
                            className="h-9"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor="quietEnd" className="text-xs">{t('settings.endTime')}</Label>
                          <Input
                            id="quietEnd"
                            type="time"
                            value={settings.quietHoursEnd || '08:00'}
                            onChange={(e) =>
                              handleNotificationToggle('quietHoursEnd', e.target.value as any)
                            }
                            className="h-9"
                          />
                        </div>
                      </div>

                      {/* Ignore Urgent During Quiet Hours */}
                      <div className="flex items-center justify-between pt-2">
                        <div className="space-y-0.5">
                          <label className="text-xs font-medium">{t('settings.allowUrgentNotifications')}</label>
                          <p className="text-xs text-muted-foreground">
                            {t('settings.allowUrgentNotificationsDesc')}
                          </p>
                        </div>
                        <Switch
                          checked={settings.quietHoursIgnoreUrgent ?? false}
                          onCheckedChange={(checked) =>
                            handleNotificationToggle('quietHoursIgnoreUrgent', checked)
                          }
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : null}
          </CardContent>
        </Card>

        {/* Logout */}
        <Button 
          variant="destructive" 
          className="w-full h-12"
          onClick={handleLogout}
        >
          <LogOut className="mr-2 h-5 w-5" />
          {t('settings.logout')}
        </Button>
      </div>

      {/* iOS Install Instructions Modal */}
      <Dialog open={showIOSModal} onOpenChange={setShowIOSModal}>
        <DialogContent className="max-w-sm mx-4">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <svg viewBox="0 0 24 24" className="h-5 w-5 fill-gray-700 dark:fill-gray-300" xmlns="http://www.w3.org/2000/svg">
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
              </svg>
              {t('settings.iosInstallTitle')}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-1 pb-2">
            <p className="text-xs text-muted-foreground mb-4">
              {t('settings.iosInstallDesc')}
            </p>

            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-bold text-primary">1</span>
                </div>
                <div>
                  <p className="text-sm font-medium">{t('settings.iosStep1Title')}</p>
                  <p className="text-xs text-muted-foreground">{t('settings.iosStep1Desc')}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-bold text-primary">2</span>
                </div>
                <div>
                  <p className="text-sm font-medium">{t('settings.iosStep2Title')}</p>
                  <p className="text-xs text-muted-foreground">{t('settings.iosStep2Desc')} <Share className="inline h-3 w-3" /></p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-bold text-primary">3</span>
                </div>
                <div>
                  <p className="text-sm font-medium">{t('settings.iosStep3Title')}</p>
                  <p className="text-xs text-muted-foreground">{t('settings.iosStep3Desc')} <Plus className="inline h-3 w-3" /></p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-bold text-primary">4</span>
                </div>
                <div>
                  <p className="text-sm font-medium">{t('settings.iosStep4Title')}</p>
                  <p className="text-xs text-muted-foreground">{t('settings.iosStep4Desc')}</p>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
