import React from 'react';
import { Package } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useLanguage } from '@/contexts/LanguageContext';
import { LicensePlate } from '@/components/ui/license-plate';
import { Job } from '@/lib/types';

interface PartsWaitingWidgetProps {
  jobs: Job[];
}

export function PartsWaitingWidget({ jobs }: PartsWaitingWidgetProps) {
  const { t } = useLanguage();
  const navigate = useNavigate();

  const waitingJobs = jobs
    .filter(j => j.status === 'waiting_for_parts')
    .sort((a, b) => new Date(a.updatedAt || a.createdAt).getTime() - new Date(b.updatedAt || b.createdAt).getTime());

  return (
    <Card className="card-glass h-full flex flex-col">
      <CardHeader className="pb-2 p-4 flex-shrink-0">
        <CardTitle className="text-base font-bold flex items-center gap-2">
          <Package className="h-7 w-7 text-rose-500" />
          {t('dashboard.partsWaiting')}
          {waitingJobs.length > 0 && (
            <span className="ml-auto text-sm font-semibold text-amber-600 bg-amber-100 dark:bg-amber-900/30 px-2 py-0.5 rounded-full">
              {waitingJobs.length}
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-0 flex-1 overflow-auto space-y-2">
        {waitingJobs.length > 0 ? waitingJobs.slice(0, 6).map((job) => (
          <div
            key={job.id}
            onClick={() => navigate(`/jobs/${job.id}`)}
            className="flex items-center justify-between p-2.5 rounded-xl bg-muted/30 cursor-pointer hover:bg-muted/50 transition-colors"
          >
            <div className="flex items-center gap-2 min-w-0">
              {job.vehicleLicensePlate ? (
                <LicensePlate plateNumber={job.vehicleLicensePlate} size="xs" />
              ) : (
                <span className="text-xs text-muted-foreground">#{job.jobNumber}</span>
              )}
              <span className="text-sm truncate text-muted-foreground">{job.customerName}</span>
            </div>
            <span className="text-xs text-muted-foreground shrink-0">
              {Math.floor((Date.now() - new Date(job.updatedAt || job.createdAt).getTime()) / (1000 * 60 * 60 * 24))}{t('dashboard.daysShort')}
            </span>
          </div>
        )) : (
          <p className="text-sm text-muted-foreground text-center py-4">{t('dashboard.noPartsWaiting')}</p>
        )}
      </CardContent>
    </Card>
  );
}
