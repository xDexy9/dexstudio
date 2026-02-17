import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Zap, Plus, MessageSquare, Briefcase } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';

export function QuickActionsWidget() {
  const { t } = useLanguage();
  const navigate = useNavigate();

  return (
    <Card className="card-glass h-full flex flex-col">
      <CardHeader className="pb-2 p-4 flex-shrink-0">
        <CardTitle className="text-base font-bold flex items-center gap-2">
          <Zap className="h-7 w-7 text-emerald-500" />
          {t('dashboard.quickActions')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 flex-1 p-4 pt-0">
        <Button
          variant="outline"
          className="w-full justify-start gap-3 h-12 hover:bg-primary/10 hover:border-primary hover:text-primary transition-all"
          onClick={() => navigate('/jobs/new')}
        >
          <Plus className="h-5 w-5" />
          <span className="font-medium">{t('jobs.newJob')}</span>
        </Button>
        <Button
          variant="outline"
          className="w-full justify-start gap-3 h-12 hover:bg-primary/10 hover:border-primary hover:text-primary transition-all"
          onClick={() => navigate('/messages')}
        >
          <MessageSquare className="h-5 w-5" />
          <span className="font-medium">{t('nav.messages')}</span>
        </Button>
        <Button
          variant="outline"
          className="w-full justify-start gap-3 h-12 hover:bg-primary/10 hover:border-primary hover:text-primary transition-all"
          onClick={() => navigate('/jobs')}
        >
          <Briefcase className="h-5 w-5" />
          <span className="font-medium">{t('jobs.allJobs')}</span>
        </Button>
      </CardContent>
    </Card>
  );
}
