import React from 'react';
import { Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useLanguage } from '@/contexts/LanguageContext';
import { getUserAvatarUrl } from '@/lib/avatarUtils';
import { Job, User } from '@/lib/types';

interface MechanicsWorkloadWidgetProps {
  jobs: Job[];
  mechanics: User[];
}

export function MechanicsWorkloadWidget({ jobs, mechanics }: MechanicsWorkloadWidgetProps) {
  const { t } = useLanguage();

  const activeJobs = jobs.filter(j => j.status !== 'completed');

  const workload = mechanics.map(m => ({
    name: m.fullName,
    email: m.email,
    active: activeJobs.filter(j => j.assignedMechanicId === m.id).length,
    completed: jobs.filter(j => j.assignedMechanicId === m.id && j.status === 'completed').length,
  })).sort((a, b) => b.active - a.active);

  return (
    <Card className="card-glass h-full flex flex-col">
      <CardHeader className="pb-2 p-4 flex-shrink-0">
        <CardTitle className="text-base font-bold flex items-center gap-2">
          <Users className="h-7 w-7 text-orange-500" />
          {t('dashboard.mechanicsWorkload')}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 overflow-auto space-y-2 p-4 pt-0">
        {workload.length > 0 ? workload.map((m, i) => (
          <div key={i} className="flex items-center justify-between p-2.5 rounded-xl bg-muted/30">
            <div className="flex items-center gap-2 min-w-0">
              <Avatar className="h-7 w-7 shrink-0">
                {getUserAvatarUrl(m.email) && (
                  <AvatarImage src={getUserAvatarUrl(m.email)} alt={m.name} />
                )}
                <AvatarFallback className="text-xs bg-primary/10 text-primary">
                  {m.name.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm font-medium truncate">{m.name}</span>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-semibold">{m.active} {t('dashboard.active')}</span>
              <span className="text-xs text-muted-foreground">{m.completed} {t('dashboard.done')}</span>
            </div>
          </div>
        )) : (
          <p className="text-sm text-muted-foreground text-center py-4">{t('common.noData')}</p>
        )}
      </CardContent>
    </Card>
  );
}
