import React from 'react';
import { UserCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useLanguage } from '@/contexts/LanguageContext';
import { Job } from '@/lib/types';

interface CustomerOverviewWidgetProps {
  jobs: Job[];
}

export function CustomerOverviewWidget({ jobs }: CustomerOverviewWidgetProps) {
  const { t } = useLanguage();
  const navigate = useNavigate();

  // Group jobs by customer
  const customerMap = new Map<string, { name: string; total: number; active: number }>();
  jobs.forEach(j => {
    if (!j.customerName) return;
    const key = j.customerId || j.customerName;
    const existing = customerMap.get(key);
    if (existing) {
      existing.total++;
      if (j.status !== 'completed') existing.active++;
    } else {
      customerMap.set(key, {
        name: j.customerName,
        total: 1,
        active: j.status !== 'completed' ? 1 : 0,
      });
    }
  });

  const customers = Array.from(customerMap.values())
    .sort((a, b) => b.active - a.active || b.total - a.total)
    .slice(0, 8);

  const uniqueCount = customerMap.size;

  return (
    <Card className="card-glass h-full flex flex-col">
      <CardHeader className="pb-2 p-4 flex-shrink-0">
        <CardTitle className="text-base font-bold flex items-center gap-2">
          <UserCircle className="h-7 w-7 text-indigo-500" />
          {t('dashboard.customerOverview')}
          <span className="ml-auto text-sm font-semibold text-violet-600 bg-violet-100 dark:bg-violet-900/30 px-2 py-0.5 rounded-full">
            {uniqueCount}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-0 flex-1 overflow-auto space-y-2">
        {customers.map((c, i) => (
          <div key={i} className="flex items-center justify-between p-2.5 rounded-xl bg-muted/30">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-7 h-7 rounded-full bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center text-xs font-bold text-violet-600 shrink-0">
                {c.name.charAt(0)}
              </div>
              <span className="text-sm font-medium truncate">{c.name}</span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {c.active > 0 && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-semibold">{c.active} {t('dashboard.active')}</span>
              )}
              <span className="text-xs text-muted-foreground">{c.total} {t('dashboard.total')}</span>
            </div>
          </div>
        ))}
        {customers.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">{t('common.noData')}</p>
        )}
      </CardContent>
    </Card>
  );
}
