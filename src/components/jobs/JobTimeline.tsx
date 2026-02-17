import React, { useState, useEffect } from 'react';
import {
  PlusCircle,
  UserCheck,
  ArrowRightCircle,
  MessageSquare,
  ShoppingCart,
  PackageCheck,
  CheckCircle,
  FileText,
  Circle,
  Filter,
} from 'lucide-react';
import { JobActivity, JobActivityType } from '@/lib/types';
import {
  subscribeToJobActivities,
  getActivityDescription,
} from '@/services/jobActivityService';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { format, formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

interface JobTimelineProps {
  jobId: string;
}

export function JobTimeline({ jobId }: JobTimelineProps) {
  const [activities, setActivities] = useState<JobActivity[]>([]);
  const [filterType, setFilterType] = useState<JobActivityType | 'all'>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!jobId) return;

    setLoading(true);
    const unsubscribe = subscribeToJobActivities(jobId, (updatedActivities) => {
      setActivities(updatedActivities);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [jobId]);

  const getActivityIcon = (type: JobActivityType) => {
    const iconClass = 'h-5 w-5';

    switch (type) {
      case 'created':
        return <PlusCircle className={iconClass} />;
      case 'assigned':
        return <UserCheck className={iconClass} />;
      case 'status_changed':
        return <ArrowRightCircle className={iconClass} />;
      case 'message_sent':
        return <MessageSquare className={iconClass} />;
      case 'parts_ordered':
        return <ShoppingCart className={iconClass} />;
      case 'parts_received':
        return <PackageCheck className={iconClass} />;
      case 'completed':
        return <CheckCircle className={iconClass} />;
      case 'note_added':
        return <FileText className={iconClass} />;
      default:
        return <Circle className={iconClass} />;
    }
  };

  const getActivityColor = (type: JobActivityType): string => {
    switch (type) {
      case 'created':
        return 'text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-950/20';
      case 'assigned':
        return 'text-purple-600 bg-purple-50 dark:text-purple-400 dark:bg-purple-950/20';
      case 'status_changed':
        return 'text-indigo-600 bg-indigo-50 dark:text-indigo-400 dark:bg-indigo-950/20';
      case 'message_sent':
        return 'text-cyan-600 bg-cyan-50 dark:text-cyan-400 dark:bg-cyan-950/20';
      case 'parts_ordered':
        return 'text-orange-600 bg-orange-50 dark:text-orange-400 dark:bg-orange-950/20';
      case 'parts_received':
        return 'text-amber-600 bg-amber-50 dark:text-amber-400 dark:bg-amber-950/20';
      case 'completed':
        return 'text-green-600 bg-green-50 dark:text-green-400 dark:bg-green-950/20';
      case 'note_added':
        return 'text-gray-600 bg-gray-50 dark:text-gray-400 dark:bg-gray-950/20';
      default:
        return 'text-gray-600 bg-gray-50 dark:text-gray-400 dark:bg-gray-950/20';
    }
  };

  const filteredActivities = filterType === 'all'
    ? activities
    : activities.filter(activity => activity.type === filterType);

  if (loading) {
    return (
      <div className="py-8 text-center text-muted-foreground">
        Loading activity timeline...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filter Controls */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Filter className="h-4 w-4" />
          <span>Filter:</span>
        </div>
        <Select value={filterType} onValueChange={(value) => setFilterType(value as JobActivityType | 'all')}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Activities</SelectItem>
            <SelectItem value="created">Created</SelectItem>
            <SelectItem value="assigned">Assigned</SelectItem>
            <SelectItem value="status_changed">Status Changes</SelectItem>
            <SelectItem value="message_sent">Messages</SelectItem>
            <SelectItem value="parts_ordered">Parts Ordered</SelectItem>
            <SelectItem value="parts_received">Parts Received</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="note_added">Notes</SelectItem>
          </SelectContent>
        </Select>
        <span className="text-sm text-muted-foreground">
          {filteredActivities.length} {filteredActivities.length === 1 ? 'event' : 'events'}
        </span>
      </div>

      {/* Timeline */}
      {filteredActivities.length === 0 ? (
        <div className="py-8 text-center text-muted-foreground">
          {filterType === 'all' ? 'No activity yet' : 'No activities of this type'}
        </div>
      ) : (
        <div className="relative space-y-4">
          {/* Timeline line */}
          <div className="absolute left-[18px] top-8 bottom-8 w-0.5 bg-border" />

          {/* Activity items */}
          {filteredActivities.map((activity, index) => (
            <div key={activity.id} className="relative flex gap-4">
              {/* Icon */}
              <div
                className={cn(
                  'relative z-10 flex items-center justify-center rounded-full p-2',
                  getActivityColor(activity.type)
                )}
              >
                {getActivityIcon(activity.type)}
              </div>

              {/* Content */}
              <div className="flex-1 pb-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">
                      {getActivityDescription(activity)}
                    </p>

                    {/* Additional details */}
                    {activity.details?.description && activity.type !== 'message_sent' && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {activity.details.description}
                      </p>
                    )}
                  </div>

                  {/* Timestamp */}
                  <div className="flex flex-col items-end gap-0.5">
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                    </span>
                    <span className="text-xs text-muted-foreground/70">
                      {format(new Date(activity.timestamp), 'dd/MM HH:mm')}
                    </span>
                  </div>
                </div>

                {/* Status change details */}
                {activity.type === 'status_changed' && activity.details?.oldValue && activity.details?.newValue && (
                  <div className="mt-2 flex items-center gap-2 text-xs">
                    <span className="px-2 py-1 rounded-md bg-secondary text-secondary-foreground">
                      {activity.details.oldValue.replace('_', ' ')}
                    </span>
                    <ArrowRightCircle className="h-3 w-3 text-muted-foreground" />
                    <span className="px-2 py-1 rounded-md bg-primary/10 text-primary font-medium">
                      {activity.details.newValue.replace('_', ' ')}
                    </span>
                  </div>
                )}

                {/* Parts data */}
                {(activity.type === 'parts_ordered' || activity.type === 'parts_received') && activity.details?.partsData && (
                  <div className="mt-2 p-2 rounded-md bg-secondary/50 text-xs">
                    <pre className="text-muted-foreground whitespace-pre-wrap">
                      {JSON.stringify(activity.details.partsData, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
