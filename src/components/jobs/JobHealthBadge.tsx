import React from 'react';
import { AlertCircle, CheckCircle, AlertTriangle, Clock } from 'lucide-react';
import { Job, JobHealth } from '@/lib/types';
import { calculateJobHealth, getHealthColor, getHealthLabel } from '@/lib/jobHealth';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface JobHealthBadgeProps {
  job: Job;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function JobHealthBadge({ job, showLabel = false, size = 'md', className }: JobHealthBadgeProps) {
  const healthIndicator = calculateJobHealth(job);
  const { health, reason, daysOld, daysOverdue, isInactive } = healthIndicator;

  // Don't show badge for completed jobs if they're healthy
  if (job.status === 'completed' && health === 'healthy') {
    return null;
  }

  const getHealthIcon = (health: JobHealth) => {
    const sizeClass = size === 'sm' ? 'h-3 w-3' : size === 'lg' ? 'h-5 w-5' : 'h-4 w-4';

    switch (health) {
      case 'healthy':
        return <CheckCircle className={sizeClass} />;
      case 'warning':
        return <AlertTriangle className={sizeClass} />;
      case 'critical':
        return <AlertCircle className={sizeClass} />;
      case 'overdue':
        return <Clock className={sizeClass} />;
      default:
        return <AlertCircle className={sizeClass} />;
    }
  };

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-1',
    lg: 'text-base px-3 py-1.5',
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className={cn(
              'inline-flex items-center gap-1.5 rounded-full border font-medium',
              getHealthColor(health),
              sizeClasses[size],
              className
            )}
          >
            {getHealthIcon(health)}
            {showLabel && <span>{getHealthLabel(health)}</span>}
          </div>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs">
          <div className="space-y-1">
            <p className="font-semibold">{getHealthLabel(health)}</p>
            <p className="text-xs">{reason}</p>
            <div className="text-xs text-muted-foreground pt-1 border-t space-y-0.5">
              <p>Created {daysOld} day{daysOld !== 1 ? 's' : ''} ago</p>
              {daysOverdue > 0 && (
                <p className="text-red-400">Overdue by {daysOverdue} day{daysOverdue !== 1 ? 's' : ''}</p>
              )}
              {isInactive && job.status !== 'completed' && (
                <p className="text-yellow-400">No recent updates</p>
              )}
              {job.estimatedDuration && (
                <p>Estimated: {job.estimatedDuration} day{job.estimatedDuration !== 1 ? 's' : ''}</p>
              )}
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

/**
 * Compact variant for job cards and lists
 */
export function JobHealthDot({ job }: { job: Job }) {
  const healthIndicator = calculateJobHealth(job);
  const { health, reason } = healthIndicator;

  // Don't show for healthy completed jobs
  if (job.status === 'completed' && health === 'healthy') {
    return null;
  }

  const getDotColor = (health: JobHealth): string => {
    switch (health) {
      case 'healthy':
        return 'bg-green-500';
      case 'warning':
        return 'bg-yellow-500';
      case 'critical':
        return 'bg-orange-500';
      case 'overdue':
        return 'bg-red-500 animate-pulse';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={cn('h-2 w-2 rounded-full', getDotColor(health))} />
        </TooltipTrigger>
        <TooltipContent side="top">
          <div className="text-xs">
            <p className="font-semibold">{getHealthLabel(health)}</p>
            <p>{reason}</p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
