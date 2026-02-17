import React from 'react';
import { useNavigate } from 'react-router-dom';
import { StatsCard, StatsCardContainer } from '@/components/ui/stats-card';
import { useLanguage } from '@/contexts/LanguageContext';

interface JobStatsWidgetProps {
  statusCounts: {
    not_started: number;
    in_progress: number;
    waiting_for_parts: number;
    completed: number;
  };
}

export function JobStatsWidget({ statusCounts }: JobStatsWidgetProps) {
  const { t } = useLanguage();
  const navigate = useNavigate();

  return (
    <StatsCardContainer className="justify-start">
      <div onClick={() => navigate('/jobs?status=not_started')} className="cursor-pointer hover:scale-105 transition-transform">
        <StatsCard
          heading={t('jobs.notStarted')}
          value={statusCounts.not_started}
          iconSrc="/icon-not-started.gif"
        />
      </div>
      <div onClick={() => navigate('/jobs?status=in_progress')} className="cursor-pointer hover:scale-105 transition-transform">
        <StatsCard
          heading={t('jobs.inProgress')}
          value={statusCounts.in_progress}
          iconSrc="/icon-in-progress.gif"
        />
      </div>
      <div onClick={() => navigate('/jobs?status=waiting_for_parts')} className="cursor-pointer hover:scale-105 transition-transform">
        <StatsCard
          heading={t('jobs.waitingParts')}
          value={statusCounts.waiting_for_parts}
          iconSrc="/icon-waiting-parts.gif"
        />
      </div>
      <div onClick={() => navigate('/jobs?status=completed')} className="cursor-pointer hover:scale-105 transition-transform">
        <StatsCard
          heading={t('jobs.completed')}
          value={statusCounts.completed}
          iconSrc="/icon-completed.gif"
        />
      </div>
    </StatsCardContainer>
  );
}
