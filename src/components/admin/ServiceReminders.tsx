import { useState } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import {
  Bell,
  Calendar,
  Car,
  Clock,
  Mail,
  MessageSquare,
  Plus,
  Send,
  Settings,
  CheckCircle,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { ServiceReminder } from '@/types';
import { mockVehicles } from '@/data/mockData';

const mockReminders: ServiceReminder[] = [
  {
    id: 'rem-1',
    customerId: 'user-1',
    customerName: 'John Smith',
    vehicleId: 'vehicle-1',
    vehicle: mockVehicles[0],
    serviceType: 'Oil Change',
    dueDate: '2024-03-15',
    dueMileage: 35000,
    status: 'pending',
    lastServiceDate: '2024-01-15',
    createdAt: '2024-02-01',
  },
  {
    id: 'rem-2',
    customerId: 'user-2',
    customerName: 'Sarah Johnson',
    vehicleId: 'vehicle-3',
    vehicle: mockVehicles[2],
    serviceType: 'Tire Rotation',
    dueDate: '2024-03-01',
    status: 'sent',
    lastServiceDate: '2023-12-01',
    createdAt: '2024-02-10',
  },
  {
    id: 'rem-3',
    customerId: 'user-3',
    customerName: 'Michael Chen',
    vehicleId: 'vehicle-4',
    vehicle: mockVehicles[3],
    serviceType: 'Brake Inspection',
    dueDate: '2024-02-28',
    status: 'scheduled',
    lastServiceDate: '2023-08-15',
    createdAt: '2024-02-15',
  },
];

const serviceTypes = [
  'Oil Change',
  'Tire Rotation',
  'Brake Inspection',
  'Transmission Service',
  'Coolant Flush',
  'Air Filter',
  'Spark Plugs',
  'Belt Inspection',
];

const statusConfig = {
  pending: { label: 'Pending', className: 'bg-yellow-500/10 text-yellow-500' },
  sent: { label: 'Sent', className: 'bg-blue-500/10 text-blue-500' },
  scheduled: { label: 'Scheduled', className: 'bg-green-500/10 text-green-500' },
  dismissed: { label: 'Dismissed', className: 'bg-muted text-muted-foreground' },
};

export const ServiceReminders = () => {
  const { t } = useTranslation();
  const [reminders, setReminders] = useState<ServiceReminder[]>(mockReminders);
  const [activeTab, setActiveTab] = useState('upcoming');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Settings state
  const [settings, setSettings] = useState({
    autoReminders: true,
    emailEnabled: true,
    smsEnabled: false,
    daysBeforeDue: 7,
    oilChangeInterval: 5000,
    tireRotationInterval: 7500,
  });

  const upcomingReminders = reminders.filter(
    (r) => r.status === 'pending' || r.status === 'sent'
  );
  const scheduledReminders = reminders.filter((r) => r.status === 'scheduled');

  const sendReminder = (id: string) => {
    setReminders((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: 'sent' as const } : r))
    );
  };

  const dismissReminder = (id: string) => {
    setReminders((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: 'dismissed' as const } : r))
    );
  };

  const markScheduled = (id: string) => {
    setReminders((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: 'scheduled' as const } : r))
    );
  };

  const getDaysUntilDue = (dueDate: string) => {
    const due = new Date(dueDate);
    const now = new Date();
    const diff = due.getTime() - now.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  const statusConfig = {
    pending: { label: t('reminders.pending'), className: 'bg-yellow-500/10 text-yellow-500' },
    sent: { label: t('reminders.sentThisWeek').split(' ')[0], className: 'bg-blue-500/10 text-blue-500' },
    scheduled: { label: t('reminders.scheduled'), className: 'bg-green-500/10 text-green-500' },
    dismissed: { label: t('common.cancel'), className: 'bg-muted text-muted-foreground' },
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Bell className="h-6 w-6 text-primary" />
            {t('reminders.title')}
          </h2>
          <p className="text-muted-foreground">
            {t('reminders.subtitle')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setIsSettingsOpen(true)}>
            <Settings className="h-4 w-4 mr-1" />
            {t('reminders.settings')}
          </Button>
          <Button onClick={() => setIsCreateOpen(true)}>
            <Plus className="h-4 w-4 mr-1" />
            {t('reminders.createReminder')}
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: t('reminders.pending'), value: reminders.filter((r) => r.status === 'pending').length, icon: Clock },
          { label: t('reminders.sentThisWeek'), value: reminders.filter((r) => r.status === 'sent').length, icon: Mail },
          { label: t('reminders.scheduled'), value: scheduledReminders.length, icon: Calendar },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-primary/10">
                    <stat.icon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stat.value}</p>
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Reminders List */}
      <Card>
        <CardHeader>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="upcoming">{t('reminders.upcoming')} ({upcomingReminders.length})</TabsTrigger>
              <TabsTrigger value="scheduled">{t('reminders.scheduled')} ({scheduledReminders.length})</TabsTrigger>
            </TabsList>
          </Tabs>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {(activeTab === 'upcoming' ? upcomingReminders : scheduledReminders).map(
              (reminder) => {
                const daysUntil = getDaysUntilDue(reminder.dueDate);
                const isOverdue = daysUntil < 0;
                return (
                  <motion.div
                    key={reminder.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-secondary/50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <Car className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{reminder.customerName}</p>
                        <p className="text-sm text-muted-foreground">
                          {reminder.vehicle.year} {reminder.vehicle.make} {reminder.vehicle.model}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-center">
                        <p className="font-medium">{reminder.serviceType}</p>
                        <p className="text-xs text-muted-foreground">{t('reminders.serviceDue')}</p>
                      </div>
                      <div className="text-center">
                        <p
                          className={cn(
                            'font-medium',
                            isOverdue ? 'text-destructive' : daysUntil <= 7 ? 'text-yellow-500' : ''
                          )}
                        >
                          {isOverdue ? `${Math.abs(daysUntil)} ${t('reminders.daysOverdue')}` : `${daysUntil} ${t('reminders.days')}`}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(reminder.dueDate).toLocaleDateString()}
                        </p>
                      </div>
                      <Badge className={statusConfig[reminder.status].className}>
                        {statusConfig[reminder.status].label}
                      </Badge>
                      <div className="flex items-center gap-2">
                        {reminder.status === 'pending' && (
                          <Button size="sm" onClick={() => sendReminder(reminder.id)}>
                            <Send className="h-4 w-4 mr-1" />
                            {t('reminders.send')}
                          </Button>
                        )}
                        {(reminder.status === 'pending' || reminder.status === 'sent') && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => markScheduled(reminder.id)}
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              {t('reminders.scheduled')}
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => dismissReminder(reminder.id)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              }
            )}
            {(activeTab === 'upcoming' ? upcomingReminders : scheduledReminders).length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <Bell className="h-10 w-10 mx-auto mb-3 opacity-50" />
                <p>{t('reminders.noReminders', { type: activeTab })}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Settings Dialog */}
      <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('reminders.reminderSettings')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>{t('reminders.autoReminders')}</Label>
                <p className="text-sm text-muted-foreground">
                  {t('reminders.autoRemindersDesc')}
                </p>
              </div>
              <Switch
                checked={settings.autoReminders}
                onCheckedChange={(checked) =>
                  setSettings((s) => ({ ...s, autoReminders: checked }))
                }
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>{t('reminders.emailNotifications')}</Label>
                <p className="text-sm text-muted-foreground">{t('reminders.emailNotificationsDesc')}</p>
              </div>
              <Switch
                checked={settings.emailEnabled}
                onCheckedChange={(checked) =>
                  setSettings((s) => ({ ...s, emailEnabled: checked }))
                }
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>{t('reminders.smsNotifications')}</Label>
                <p className="text-sm text-muted-foreground">{t('reminders.smsNotificationsDesc')}</p>
              </div>
              <Switch
                checked={settings.smsEnabled}
                onCheckedChange={(checked) =>
                  setSettings((s) => ({ ...s, smsEnabled: checked }))
                }
              />
            </div>
            <div>
              <Label>{t('reminders.daysBeforeDue')}</Label>
              <Select
                value={String(settings.daysBeforeDue)}
                onValueChange={(v) => setSettings((s) => ({ ...s, daysBeforeDue: Number(v) }))}
              >
                <SelectTrigger className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="3">3 days</SelectItem>
                  <SelectItem value="7">7 days</SelectItem>
                  <SelectItem value="14">14 days</SelectItem>
                  <SelectItem value="30">30 days</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>{t('reminders.oilChangeInterval')}</Label>
                <Input
                  type="number"
                  value={settings.oilChangeInterval}
                  onChange={(e) =>
                    setSettings((s) => ({ ...s, oilChangeInterval: Number(e.target.value) }))
                  }
                  className="mt-2"
                />
              </div>
              <div>
                <Label>{t('reminders.tireRotationInterval')}</Label>
                <Input
                  type="number"
                  value={settings.tireRotationInterval}
                  onChange={(e) =>
                    setSettings((s) => ({ ...s, tireRotationInterval: Number(e.target.value) }))
                  }
                  className="mt-2"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsSettingsOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button onClick={() => setIsSettingsOpen(false)}>{t('reminders.saveSettings')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
