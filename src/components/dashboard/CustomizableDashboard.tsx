import React, { useEffect, useRef, useState, forwardRef, useImperativeHandle } from 'react';
import { GridStack } from 'gridstack';
import 'gridstack/dist/gridstack.min.css';
import { RotateCcw, Lock, Unlock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { getUserSettings, updateUserSettings } from '@/services/firestoreService';
import { DashboardWidget, Job, User } from '@/lib/types';
import { toast } from 'sonner';
import { JobStatsWidget } from './JobStatsWidget';
import { RecentJobsWidget } from './RecentJobsWidget';
import { UrgentJobsWidget } from './UrgentJobsWidget';
import { TodayActivityWidget } from './TodayActivityWidget';
import { QuickActionsWidget } from './QuickActionsWidget';
import { MechanicsWorkloadWidget } from './MechanicsWorkloadWidget';
import { PartsWaitingWidget } from './PartsWaitingWidget';
import { WeeklyPerformanceWidget } from './WeeklyPerformanceWidget';
import { CustomerOverviewWidget } from './CustomerOverviewWidget';

export interface WidgetInfo {
  id: string;
  labelKey: string;
  defaultW: number;
  defaultH: number;
}

export const AVAILABLE_WIDGETS: WidgetInfo[] = [
  { id: 'job-stats', labelKey: 'dashboard.widgetJobStats', defaultW: 12, defaultH: 2 },
  { id: 'recent-jobs', labelKey: 'dashboard.widgetRecentJobs', defaultW: 8, defaultH: 6 },
  { id: 'urgent-jobs', labelKey: 'dashboard.widgetUrgentJobs', defaultW: 4, defaultH: 3 },
  { id: 'today-activity', labelKey: 'dashboard.widgetTodayActivity', defaultW: 4, defaultH: 3 },
  { id: 'quick-actions', labelKey: 'dashboard.widgetQuickActions', defaultW: 4, defaultH: 3 },
  { id: 'mechanics-workload', labelKey: 'dashboard.widgetMechanicsWorkload', defaultW: 6, defaultH: 4 },
  { id: 'parts-waiting', labelKey: 'dashboard.widgetPartsWaiting', defaultW: 6, defaultH: 4 },
  { id: 'weekly-performance', labelKey: 'dashboard.widgetWeeklyPerformance', defaultW: 4, defaultH: 4 },
  { id: 'customer-overview', labelKey: 'dashboard.widgetCustomerOverview', defaultW: 6, defaultH: 4 },
];

export interface CustomizableDashboardRef {
  saveLayout: () => Promise<void>;
  resetLayout: () => Promise<void>;
  toggleWidget: (id: string) => void;
  getVisibleWidgetIds: () => string[];
}

interface CustomizableDashboardProps {
  jobs: Job[];
  mechanics: User[];
  statusCounts: {
    not_started: number;
    in_progress: number;
    waiting_for_parts: number;
    completed: number;
  };
  urgentJobs: Job[];
  recentJobs: Job[];
  onAssignMechanic?: (jobId: string, mechanicId: string) => void;
  onLockChange?: (locked: boolean) => void;
  onSave?: () => void;
  onReset?: () => void;
  externalIsLocked?: boolean;
  showControls?: boolean;
}

const DEFAULT_LAYOUT: DashboardWidget[] = [
  { id: 'job-stats', x: 0, y: 0, w: 12, h: 2 },
  { id: 'recent-jobs', x: 0, y: 2, w: 8, h: 6 },
  { id: 'urgent-jobs', x: 8, y: 2, w: 4, h: 3 },
  { id: 'today-activity', x: 8, y: 5, w: 4, h: 3 },
  { id: 'quick-actions', x: 8, y: 8, w: 4, h: 3 },
];

export const CustomizableDashboard = forwardRef<CustomizableDashboardRef, CustomizableDashboardProps>(({
  jobs,
  mechanics,
  statusCounts,
  urgentJobs,
  recentJobs,
  onAssignMechanic,
  onLockChange,
  onSave: externalOnSave,
  onReset: externalOnReset,
  externalIsLocked,
  showControls = true,
}, ref) => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const gridRef = useRef<HTMLDivElement>(null);
  const gridInstanceRef = useRef<GridStack | null>(null);
  const [internalIsLocked, setInternalIsLocked] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [layout, setLayout] = useState<DashboardWidget[]>(DEFAULT_LAYOUT);
  const [gridKey, setGridKey] = useState(0);

  const isLocked = externalIsLocked !== undefined ? externalIsLocked : internalIsLocked;

  // Load saved layout
  useEffect(() => {
    const loadLayout = async () => {
      if (!user) return;

      try {
        const settings = await getUserSettings(user.id);
        const savedLayout = settings?.dashboardLayout || DEFAULT_LAYOUT;
        setLayout(savedLayout);
        setIsLoading(false);
      } catch (error) {
        console.error('Error loading dashboard layout:', error);
        setLayout(DEFAULT_LAYOUT);
        setIsLoading(false);
      }
    };

    loadLayout();
  }, [user]);

  // Initialize GridStack (runs on first load and after widget toggle)
  useEffect(() => {
    if (isLoading || !gridRef.current || gridInstanceRef.current) return;

    // Small delay to ensure React has rendered the new DOM elements
    const timer = setTimeout(() => {
      if (!gridRef.current || gridInstanceRef.current) return;

      const grid = GridStack.init({
        column: 12,
        cellHeight: 80,
        margin: 12,
        float: false,
        disableResize: false,
        disableDrag: isLocked,
        animate: true,
        columnOpts: {
          breakpoints: [
            { w: 640, c: 1 },
            { w: 900, c: 6 },
            { w: 1200, c: 12 },
          ],
        },
        draggable: {
          handle: '.grid-stack-item-content',
        },
      }, gridRef.current);

      gridInstanceRef.current = grid;

      grid.on('change', () => {
        if (!isLocked) {
          saveLayout();
        }
      });
    }, 50);

    return () => {
      clearTimeout(timer);
      if (gridInstanceRef.current) {
        gridInstanceRef.current.destroy(false);
        gridInstanceRef.current = null;
      }
    };
  }, [isLoading, gridKey]);

  // Update widgets when layout changes
  useEffect(() => {
    if (!gridInstanceRef.current || isLoading) return;

    const grid = gridInstanceRef.current;

    // Update widget positions
    layout.forEach((widget) => {
      const element = document.querySelector(`[gs-id="${widget.id}"]`) as HTMLElement;
      if (element) {
        grid.update(element, { x: widget.x, y: widget.y, w: widget.w, h: widget.h });
      }
    });
  }, [layout, isLoading]);

  // Toggle lock/unlock
  useEffect(() => {
    if (gridInstanceRef.current) {
      if (isLocked) {
        gridInstanceRef.current.disable();
      } else {
        gridInstanceRef.current.enable();
      }
    }
  }, [isLocked]);

  const saveLayout = async () => {
    if (!user || !gridInstanceRef.current) {
      console.log('Cannot save: user or grid not ready');
      return;
    }

    try {
      const grid = gridInstanceRef.current;
      const items = grid.getGridItems();

      const newLayout: DashboardWidget[] = items.map((item) => {
        const node = item.gridstackNode;
        return {
          id: node?.id as string,
          x: node?.x || 0,
          y: node?.y || 0,
          w: node?.w || 4,
          h: node?.h || 4,
        };
      });

      console.log('Saving layout:', newLayout);

      const settings = await getUserSettings(user.id);
      await updateUserSettings(user.id, {
        ...settings,
        dashboardLayout: newLayout,
        updatedAt: new Date().toISOString(),
      });

      console.log('Layout saved successfully');
      toast.success(t('dashboard.layoutSaved'));
    } catch (error) {
      console.error('Error saving layout:', error);
      toast.error(t('dashboard.layoutSaveFailed'));
    }
  };

  const resetLayout = async () => {
    if (externalOnReset) {
      externalOnReset();
      return;
    }

    if (!user) return;

    try {
      setLayout(DEFAULT_LAYOUT);

      const settings = await getUserSettings(user.id);
      await updateUserSettings(user.id, {
        ...settings,
        dashboardLayout: DEFAULT_LAYOUT,
        updatedAt: new Date().toISOString(),
      });

      toast.success(t('dashboard.layoutReset'));
    } catch (error) {
      console.error('Error resetting layout:', error);
      toast.error(t('dashboard.layoutResetFailed'));
    }
  };

  const toggleWidget = (id: string) => {
    const exists = layout.find(w => w.id === id);
    let newLayout: DashboardWidget[];

    if (exists) {
      newLayout = layout.filter(w => w.id !== id);
    } else {
      const meta = AVAILABLE_WIDGETS.find(w => w.id === id);
      if (!meta) return;
      const defaultEntry = DEFAULT_LAYOUT.find(w => w.id === id);
      newLayout = [...layout, {
        id,
        x: defaultEntry?.x ?? 0,
        y: defaultEntry?.y ?? 0,
        w: meta.defaultW,
        h: meta.defaultH,
      }];
    }

    // Destroy current grid so it re-initializes with new widgets
    if (gridInstanceRef.current) {
      gridInstanceRef.current.destroy(false);
      gridInstanceRef.current = null;
    }

    setLayout(newLayout);
    setGridKey(k => k + 1);

    // Persist immediately
    if (user) {
      getUserSettings(user.id).then(settings => {
        updateUserSettings(user.id, {
          ...settings,
          dashboardLayout: newLayout,
          updatedAt: new Date().toISOString(),
        });
      });
    }
  };

  const getVisibleWidgetIds = () => layout.map(w => w.id);

  // Expose methods via ref
  useImperativeHandle(ref, () => ({
    saveLayout,
    resetLayout,
    toggleWidget,
    getVisibleWidgetIds,
  }));

  const handleLockToggle = () => {
    const newLocked = !isLocked;
    if (onLockChange) {
      onLockChange(newLocked);
    } else {
      setInternalIsLocked(newLocked);
    }
  };

  const handleSave = () => {
    if (externalOnSave) {
      externalOnSave();
    } else {
      saveLayout();
    }
  };

  const getWidgetComponent = (id: string) => {
    switch (id) {
      case 'job-stats':
        return <JobStatsWidget statusCounts={statusCounts} />;
      case 'recent-jobs':
        return <RecentJobsWidget jobs={recentJobs} mechanics={mechanics} onAssignMechanic={onAssignMechanic} />;
      case 'urgent-jobs':
        return <UrgentJobsWidget jobs={urgentJobs} />;
      case 'today-activity':
        return <TodayActivityWidget jobs={jobs} mechanics={mechanics} />;
      case 'quick-actions':
        return <QuickActionsWidget />;
      case 'mechanics-workload':
        return <MechanicsWorkloadWidget jobs={jobs} mechanics={mechanics} />;
      case 'parts-waiting':
        return <PartsWaitingWidget jobs={jobs} />;
      case 'weekly-performance':
        return <WeeklyPerformanceWidget jobs={jobs} />;
      case 'customer-overview':
        return <CustomerOverviewWidget jobs={jobs} />;
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">{t('common.loading')}</p>
      </div>
    );
  }

  return (
    <div className={showControls ? "space-y-4" : ""}>
      {/* Controls */}
      {showControls && (
        <div className="flex items-center gap-3">
          <Button
            variant={isLocked ? 'outline' : 'default'}
            size="sm"
            onClick={handleLockToggle}
            className="gap-2"
          >
            {isLocked ? (
              <>
                <Lock className="h-4 w-4" />
                {t('dashboard.unlockLayout')}
              </>
            ) : (
              <>
                <Unlock className="h-4 w-4" />
                {t('dashboard.lockLayout')}
              </>
            )}
          </Button>
          {!isLocked && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleSave}
              className="gap-2"
            >
              {t('common.save')}
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={resetLayout}
            className="gap-2"
          >
            <RotateCcw className="h-4 w-4" />
            {t('dashboard.resetLayout')}
          </Button>
          {!isLocked && (
            <p className="text-sm text-muted-foreground">
              {t('dashboard.dragToReorder')}
            </p>
          )}
        </div>
      )}

      {/* Grid */}
      <div ref={gridRef} className="grid-stack" key={gridKey}>
        {layout.map((widget) => (
          <div
            key={widget.id}
            className="grid-stack-item"
            gs-id={widget.id}
            gs-x={widget.x}
            gs-y={widget.y}
            gs-w={widget.w}
            gs-h={widget.h}
          >
            <div className="grid-stack-item-content overflow-hidden rounded-lg">
              {getWidgetComponent(widget.id)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
});

CustomizableDashboard.displayName = 'CustomizableDashboard';

// Export hook for external control
export function useDashboardControls() {
  const [isLocked, setIsLocked] = useState(true);
  return { isLocked, setIsLocked };
}
