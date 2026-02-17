import React from 'react';
import { WifiOff, Loader2, Check, AlertCircle } from 'lucide-react';
import { useOffline } from '@/contexts/OfflineContext';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

export function OfflineIndicator() {
  const { isOnline, syncStatus, pendingChanges, lastSyncTime } = useOffline();

  // Don't show anything if online and synced with no pending changes
  if (isOnline && syncStatus === 'synced' && pendingChanges === 0) {
    return null;
  }

  const getStatusInfo = () => {
    if (!isOnline) {
      return {
        icon: WifiOff,
        text: 'Offline Mode',
        className: 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950 dark:text-orange-300 dark:border-orange-800',
      };
    }

    if (syncStatus === 'syncing') {
      return {
        icon: Loader2,
        text: 'Syncing...',
        className: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800',
        spin: true,
      };
    }

    if (pendingChanges > 0) {
      return {
        icon: AlertCircle,
        text: `${pendingChanges} pending change${pendingChanges !== 1 ? 's' : ''}`,
        className: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800',
      };
    }

    return {
      icon: Check,
      text: 'All synced',
      className: 'bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-300 dark:border-green-800',
    };
  };

  const status = getStatusInfo();
  const Icon = status.icon;

  return (
    <div
      className={cn(
        'fixed bottom-20 right-4 md:bottom-4 flex items-center gap-2 px-3 py-2 rounded-lg text-sm border shadow-lg z-40',
        status.className
      )}
    >
      <Icon className={cn('h-4 w-4', status.spin && 'animate-spin')} />
      <div className="flex flex-col">
        <span className="font-medium">{status.text}</span>
        {isOnline && syncStatus === 'synced' && lastSyncTime && (
          <span className="text-xs opacity-75">
            {formatDistanceToNow(lastSyncTime, { addSuffix: true })}
          </span>
        )}
      </div>
    </div>
  );
}
