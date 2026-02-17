import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import { toast } from 'sonner';

export type SyncStatus = 'synced' | 'syncing' | 'pending';

interface OfflineContextType {
  isOnline: boolean;
  syncStatus: SyncStatus;
  pendingChanges: number;
  lastSyncTime: Date | null;
  setSyncStatus: (status: SyncStatus) => void;
  setPendingChanges: (count: number) => void;
  setLastSyncTime: (time: Date) => void;
}

const OfflineContext = createContext<OfflineContextType | undefined>(undefined);

export function OfflineProvider({ children }: { children: ReactNode }) {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('synced');
  const [pendingChanges, setPendingChanges] = useState(0);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const isInitialLoadRef = useRef(true);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setSyncStatus('syncing');

      // Show notification when coming back online
      toast.success('Back online', {
        description: 'Your connection has been restored. Syncing changes...',
        duration: 4000,
      });

      // Simulate sync completion after a short delay
      setTimeout(() => {
        setSyncStatus('synced');
        setLastSyncTime(new Date());
        setPendingChanges(0);
      }, 1500);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setSyncStatus('pending');

      // Show notification when going offline
      toast.warning('You are offline', {
        description: 'You are currently not connected to the internet. Working in offline mode.',
        duration: 6000,
      });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial sync time if online
    if (navigator.onLine && !lastSyncTime) {
      setLastSyncTime(new Date());
    }

    // Show initial offline notification if starting offline (after first render)
    if (isInitialLoadRef.current) {
      isInitialLoadRef.current = false;
      if (!navigator.onLine) {
        // Delay to avoid showing during initial app load
        setTimeout(() => {
          toast.warning('You are offline', {
            description: 'You are currently not connected to the internet. Working in offline mode.',
            duration: 6000,
          });
        }, 1000);
      }
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [lastSyncTime]);

  return (
    <OfflineContext.Provider
      value={{
        isOnline,
        syncStatus,
        pendingChanges,
        lastSyncTime,
        setSyncStatus,
        setPendingChanges,
        setLastSyncTime,
      }}
    >
      {children}
    </OfflineContext.Provider>
  );
}

export function useOffline() {
  const context = useContext(OfflineContext);
  if (context === undefined) {
    throw new Error('useOffline must be used within an OfflineProvider');
  }
  return context;
}
