import React from 'react';
import { CalendarDays } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useLanguage } from '@/contexts/LanguageContext';
import { Job, User } from '@/lib/types';

interface TodayActivityWidgetProps {
  jobs: Job[];
  mechanics: User[];
}

export function TodayActivityWidget({ jobs, mechanics }: TodayActivityWidgetProps) {
  const { t } = useLanguage();

  const todayJobs = jobs.filter(j => {
    const jobDate = new Date(j.createdAt);
    const today = new Date();
    return jobDate.toDateString() === today.toDateString();
  });

  const completedToday = jobs.filter(j =>
    j.status === 'completed' &&
    j.completedAt &&
    new Date(j.completedAt).toDateString() === new Date().toDateString()
  ).length;

  return (
    <Card className="card-glass h-full flex flex-col">
      <CardHeader className="pb-2 p-4 flex-shrink-0">
        <CardTitle className="text-base font-bold flex items-center gap-2">
          <CalendarDays className="h-7 w-7 text-violet-500" />
          {t('dashboard.todayActivity')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 flex-1 p-4 pt-0">
        <div className="flex items-center justify-between p-3 rounded-xl bg-primary/5">
          <span className="text-sm font-medium text-muted-foreground">{t('dashboard.jobsCreated')}</span>
          <span className="text-2xl font-bold text-primary">{todayJobs.length}</span>
        </div>
        <div className="flex items-center justify-between p-3 rounded-xl bg-success/5">
          <span className="text-sm font-medium text-muted-foreground">{t('dashboard.completed')}</span>
          <span className="text-2xl font-bold text-success">{completedToday}</span>
        </div>
        <div className="flex items-center justify-between p-3 rounded-xl bg-gold/5">
          <span className="text-sm font-medium text-muted-foreground">{t('dashboard.activeMechanics')}</span>
          <span className="text-2xl font-bold text-gold-foreground">{mechanics.length}</span>
        </div>
      </CardContent>
    </Card>
  );
}
