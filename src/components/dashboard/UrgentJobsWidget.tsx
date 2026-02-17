import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, AlertCircle, Sparkles } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useLanguage } from '@/contexts/LanguageContext';
import { Job } from '@/lib/types';
import { getTranslatedProblemDescription } from '@/lib/jobTranslation';

interface UrgentJobsWidgetProps {
  jobs: Job[];
}

export function UrgentJobsWidget({ jobs }: UrgentJobsWidgetProps) {
  const { t, language: userLanguage } = useLanguage();
  const navigate = useNavigate();

  return (
    <Card className="card-glass border-l-4 border-l-gold shadow-glow-gold/20 h-full flex flex-col">
      <CardHeader className="pb-2 p-4 flex-shrink-0">
        <CardTitle className="text-base font-bold flex items-center gap-2">
          <AlertTriangle className="h-7 w-7 text-amber-500" />
          {t('dashboard.urgentJobs')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 flex-1 overflow-auto p-4 pt-0">
        {jobs.slice(0, 4).map((job, index) => (
          <div
            key={job.id}
            className="p-4 rounded-xl glass-light cursor-pointer hover-lift group animate-slide-up"
            style={{ animationDelay: `${index * 100}ms` }}
            onClick={() => navigate(`/jobs/${job.id}`)}
          >
            <div className="flex items-start gap-2 mb-2">
              <Sparkles className="h-4 w-4 text-gold flex-shrink-0 mt-0.5 animate-pulse" />
              <p className="font-semibold text-sm">{job.customerName}</p>
            </div>
            <p className="text-xs text-muted-foreground line-clamp-2 pl-6">
              {getTranslatedProblemDescription(job, userLanguage)}
            </p>
          </div>
        ))}
        {jobs.length === 0 && (
          <div className="text-center py-8">
            <AlertCircle className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-muted-foreground text-sm">{t('dashboard.noUrgentJobs')}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
