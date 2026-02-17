import React from 'react';
import { BarChart3 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useLanguage } from '@/contexts/LanguageContext';
import { Job } from '@/lib/types';

interface WeeklyPerformanceWidgetProps {
  jobs: Job[];
}

export function WeeklyPerformanceWidget({ jobs }: WeeklyPerformanceWidgetProps) {
  const { t } = useLanguage();

  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

  const thisWeekCreated = jobs.filter(j => new Date(j.createdAt) >= weekAgo).length;
  const lastWeekCreated = jobs.filter(j => {
    const d = new Date(j.createdAt);
    return d >= twoWeeksAgo && d < weekAgo;
  }).length;

  const thisWeekCompleted = jobs.filter(j =>
    j.status === 'completed' && j.completedAt && new Date(j.completedAt) >= weekAgo
  ).length;
  const lastWeekCompleted = jobs.filter(j =>
    j.status === 'completed' && j.completedAt && new Date(j.completedAt) >= twoWeeksAgo && new Date(j.completedAt) < weekAgo
  ).length;

  const trend = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? '+100%' : '0%';
    const pct = Math.round(((current - previous) / previous) * 100);
    return pct >= 0 ? `+${pct}%` : `${pct}%`;
  };

  const trendColor = (current: number, previous: number, higherIsGood: boolean) => {
    if (current === previous) return 'text-muted-foreground';
    return (current > previous) === higherIsGood ? 'text-green-600' : 'text-red-500';
  };

  return (
    <Card className="card-glass h-full flex flex-col">
      <CardHeader className="pb-2 p-4 flex-shrink-0">
        <CardTitle className="text-base font-bold flex items-center gap-2">
          <BarChart3 className="h-7 w-7 text-teal-500" />
          {t('dashboard.weeklyPerformance')}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-0 flex-1 space-y-3">
        <div className="p-3 rounded-xl bg-primary/5">
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm text-muted-foreground">{t('dashboard.jobsCreated')}</span>
            <span className={`text-xs font-semibold ${trendColor(thisWeekCreated, lastWeekCreated, true)}`}>
              {trend(thisWeekCreated, lastWeekCreated)} {t('dashboard.vsLastWeek')}
            </span>
          </div>
          <span className="text-2xl font-bold">{thisWeekCreated}</span>
        </div>
        <div className="p-3 rounded-xl bg-success/5">
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm text-muted-foreground">{t('dashboard.jobsCompleted')}</span>
            <span className={`text-xs font-semibold ${trendColor(thisWeekCompleted, lastWeekCompleted, true)}`}>
              {trend(thisWeekCompleted, lastWeekCompleted)} {t('dashboard.vsLastWeek')}
            </span>
          </div>
          <span className="text-2xl font-bold">{thisWeekCompleted}</span>
        </div>
        <div className="p-3 rounded-xl bg-muted/30">
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm text-muted-foreground">{t('dashboard.activeJobs')}</span>
          </div>
          <span className="text-2xl font-bold">
            {jobs.filter(j => j.status === 'in_progress').length}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
