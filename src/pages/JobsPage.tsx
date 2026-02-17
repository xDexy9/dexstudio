import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Plus, Search, MessageSquare, Filter, LayoutGrid, List, Calendar, Trash2, X, CheckSquare } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useIsMobile } from '@/hooks/use-mobile';
import { getVehicleById, getUnreadMessageCount, getUserById, subscribeToJobs, deleteJob } from '@/services/firestoreService';
import { Job, JobStatus, JobPriority } from '@/lib/types';
import { PullToRefresh } from '@/components/PullToRefresh';
import { UnreadBadge } from '@/components/UnreadBadge';
import { cn } from '@/lib/utils';
import { getTranslatedProblemDescription } from '@/lib/jobTranslation';
import { LicensePlate } from '@/components/ui/license-plate';
import { CarBrandLogo } from '@/components/ui/car-brand-logo';
import { Language } from '@/lib/i18n';
import { JobHealthDot } from '@/components/jobs/JobHealthBadge';
import { PaginationControls, usePagination } from '@/components/Pagination';
import { toast } from 'sonner';

// Sort jobs by: status priority, then priority level, then most recent
function sortJobs(jobs: Job[]): Job[] {
  const statusOrder: Record<JobStatus, number> = {
    not_started: 0,
    in_progress: 1,
    waiting_for_parts: 2,
    completed: 3,
  };
  
  const priorityOrder: Record<JobPriority, number> = {
    urgent: 0,
    normal: 1,
    low: 2,
  };
  
  return [...jobs].sort((a, b) => {
    // First sort by status
    const statusDiff = statusOrder[a.status] - statusOrder[b.status];
    if (statusDiff !== 0) return statusDiff;
    
    // Then by priority (urgent first)
    const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
    if (priorityDiff !== 0) return priorityDiff;
    
    // Finally by creation date (most recent first)
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
}

function StatusBadge({ status }: { status: JobStatus }) {
  const { t } = useLanguage();
  
  const config: Record<JobStatus, { class: string; label: string }> = {
    not_started: { class: 'status-not-started', label: t('jobs.notStarted') },
    in_progress: { class: 'status-in-progress', label: t('jobs.inProgress') },
    waiting_for_parts: { class: 'status-waiting', label: t('jobs.waitingParts') },
    completed: { class: 'status-completed', label: t('jobs.completed') },
  };

  const { class: className, label } = config[status];

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium whitespace-nowrap shrink-0 ${className}`}>
      {label}
    </span>
  );
}

function JobListItem({ job, userId, userLanguage, vehicle, mechanic, unreadCount, userRole }: { job: Job; userId?: string; userLanguage: Language; vehicle?: any; mechanic?: any; unreadCount?: number; userRole?: string }) {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const canSeeCustomerInfo = userRole !== 'mechanic';

  // Use denormalized fields first, fallback to vehicle lookup
  const licensePlate = job.vehicleLicensePlate || vehicle?.licensePlate;
  const brand = job.vehicleBrand || vehicle?.brand;
  const model = job.vehicleModel || vehicle?.model;
  const year = job.vehicleYear || vehicle?.year;

  return (
    <Card
      className="cursor-pointer hover:shadow-md transition-shadow"
      onClick={() => navigate(`/jobs/${job.id}`)}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <CarBrandLogo brand={brand || ''} size="md" className="text-primary shrink-0" />
              {licensePlate ? (
                <LicensePlate plateNumber={licensePlate} size="sm" />
              ) : (
                <span className="font-semibold text-muted-foreground">{t('jobs.noVehicle')}</span>
              )}
              <JobHealthDot job={job} />
              {unreadCount && unreadCount > 0 && (
                <div className="relative flex items-center shrink-0">
                  <MessageSquare className="h-4 w-4 text-muted-foreground" />
                  <UnreadBadge count={unreadCount} className="-top-1 -right-2" />
                </div>
              )}
            </div>
            {(brand || model) && (
              <p className="text-sm text-muted-foreground">
                {brand} {model} {year ? `(${year})` : ''}
              </p>
            )}
            {canSeeCustomerInfo && (
              <p className="text-xs text-muted-foreground/70">
                {job.customerName}
              </p>
            )}
          </div>
          <StatusBadge status={job.status} />
        </div>
        <p className="text-sm text-muted-foreground line-clamp-2">
          {getTranslatedProblemDescription(job, userLanguage)}
        </p>
        <div className="mt-2 flex items-center justify-between">
          <span className={`text-xs font-medium uppercase priority-${job.priority}`}>
            {t(`jobs.priority.${job.priority}`)}
          </span>
          <span className="text-xs text-muted-foreground">
            {new Date(job.createdAt).toLocaleDateString('en-GB')}
          </span>
        </div>
        {canSeeCustomerInfo && (
          <p className="mt-1 text-xs">
            {mechanic?.fullName
              ? <span className="text-primary/80 font-medium">{mechanic.fullName}</span>
              : <span className="text-muted-foreground/50">{t('jobs.unassigned')}</span>
            }
          </p>
        )}
      </CardContent>
    </Card>
  );
}

// Desktop Table Row
function JobTableRow({
  job,
  userId,
  userLanguage,
  vehicle,
  mechanic,
  unreadCount,
  userRole,
  isSelected,
  onSelect,
  selectionMode
}: {
  job: Job;
  userId?: string;
  userLanguage: Language;
  vehicle?: any;
  mechanic?: any;
  unreadCount?: number;
  userRole?: string;
  isSelected?: boolean;
  onSelect?: (jobId: string, selected: boolean) => void;
  selectionMode?: boolean;
}) {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const canSeeCustomerInfo = userRole !== 'mechanic';

  // Use denormalized fields first, fallback to vehicle lookup
  const licensePlate = job.vehicleLicensePlate || vehicle?.licensePlate;
  const brand = job.vehicleBrand || vehicle?.brand;
  const model = job.vehicleModel || vehicle?.model;
  const year = job.vehicleYear || vehicle?.year;

  const handleRowClick = () => {
    if (selectionMode && onSelect) {
      onSelect(job.id, !isSelected);
    } else {
      navigate(`/jobs/${job.id}`);
    }
  };

  return (
    <tr
      className={cn(
        "border-b hover:bg-muted/50 cursor-pointer transition-colors",
        isSelected && "bg-primary/10"
      )}
      onClick={handleRowClick}
    >
      {selectionMode && (
        <td className="p-4 w-12" onClick={(e) => e.stopPropagation()}>
          <Checkbox
            checked={isSelected}
            onCheckedChange={(checked) => onSelect?.(job.id, checked as boolean)}
          />
        </td>
      )}
      <td className="p-4">
        <div className="flex items-center gap-3">
          <CarBrandLogo brand={brand || ''} size="md" className="text-primary" />
          <div>
            <div className="flex items-center gap-2">
              {licensePlate ? (
                <LicensePlate plateNumber={licensePlate} size="sm" />
              ) : (
                <span className="font-medium text-muted-foreground">{t('jobs.noVehicle')}</span>
              )}
              <JobHealthDot job={job} />
              {unreadCount && unreadCount > 0 && (
                <Badge variant="destructive" className="h-5 w-5 p-0 flex items-center justify-center text-[10px]">
                  {unreadCount}
                </Badge>
              )}
            </div>
            {(brand || model) && (
              <p className="text-sm text-muted-foreground">{brand} {model} {year ? `(${year})` : ''}</p>
            )}
          </div>
        </div>
        {canSeeCustomerInfo && (
          <p className="text-xs text-muted-foreground/70">{job.customerName}</p>
        )}
      </td>
      <td className="p-4">
        <p className="line-clamp-2 text-sm max-w-xs">{getTranslatedProblemDescription(job, userLanguage)}</p>
      </td>
      <td className="p-4">
        <StatusBadge status={job.status} />
      </td>
      <td className="p-4">
        <span className={`text-xs font-medium uppercase priority-${job.priority} px-2 py-1 rounded-full`}>
          {t(`jobs.priority.${job.priority}`)}
        </span>
      </td>
      <td className="p-4 text-sm text-muted-foreground">
        {mechanic?.fullName || <span className="text-muted-foreground/50">{t('jobs.unassigned')}</span>}
      </td>
      <td className="p-4 text-sm text-muted-foreground">
        {new Date(job.createdAt).toLocaleDateString('en-GB')}
      </td>
    </tr>
  );
}

export default function JobsPage() {
  const { user } = useAuth();
  const { t, language: userLanguage } = useLanguage();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [searchParams] = useSearchParams();

  const [searchQuery, setSearchQuery] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('table');
  const [statusFilter, setStatusFilter] = useState<string>(searchParams.get('status') || 'all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [allJobs, setAllJobs] = useState<Job[]>([]);
  const [myJobs, setMyJobs] = useState<Job[]>([]);
  const [availableJobs, setAvailableJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [vehicles, setVehicles] = useState<Map<string, any>>(new Map());
  const [mechanics, setMechanics] = useState<Map<string, any>>(new Map());

  // Selection state for bulk delete
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedJobs, setSelectedJobs] = useState<Set<string>>(new Set());
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Update status filter when URL changes
  useEffect(() => {
    const status = searchParams.get('status');
    if (status) {
      setStatusFilter(status);
    }
  }, [searchParams]);

  // Subscribe to real-time job updates
  useEffect(() => {
    setIsLoading(true);

    const unsubscribe = subscribeToJobs((jobs) => {
      setAllJobs(jobs);

      // Derive myJobs and availableJobs from allJobs
      if (user) {
        const myJobsData = jobs.filter(j => j.assignedMechanicId === user.id);
        setMyJobs(myJobsData);

        const availableJobsData = jobs.filter(j =>
          !j.assignedMechanicId && j.status === 'not_started'
        );
        setAvailableJobs(availableJobsData);
      }

      // Load vehicles for all jobs using functional update to avoid stale closure
      const loadVehicles = async () => {
        const vehicleIds = [...new Set(jobs.map(j => j.vehicleId).filter(Boolean))];

        // Fetch all vehicles in parallel
        const vehiclePromises = vehicleIds.map(async (vehicleId) => {
          const vehicle = await getVehicleById(vehicleId);
          return { vehicleId, vehicle };
        });

        const results = await Promise.all(vehiclePromises);

        setVehicles(prevVehicles => {
          const newMap = new Map(prevVehicles);
          results.forEach(({ vehicleId, vehicle }) => {
            if (vehicle) newMap.set(vehicleId, vehicle);
          });
          return newMap;
        });
      };

      // Load mechanics for assigned jobs
      const loadMechanics = async () => {
        const mechanicIds = [...new Set(jobs.map(j => j.assignedMechanicId).filter(Boolean))] as string[];
        const results = await Promise.all(mechanicIds.map(async (id) => ({ id, user: await getUserById(id) })));
        setMechanics(prev => {
          const map = new Map(prev);
          results.forEach(({ id, user }) => { if (user) map.set(id, user); });
          return map;
        });
      };

      loadVehicles();
      loadMechanics();
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const handleRefresh = useCallback(async () => {
    await new Promise(resolve => setTimeout(resolve, 500));
    setRefreshKey(prev => prev + 1);
  }, []);

  const filterAndSortJobs = useCallback((jobs: Job[]) => {
    let filtered = jobs;

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(job => {
        const vehicle = vehicles.get(job.vehicleId);
        // Use denormalized fields first, fallback to vehicle lookup
        const licensePlate = job.vehicleLicensePlate || vehicle?.licensePlate || '';
        const brand = job.vehicleBrand || vehicle?.brand || '';
        const model = job.vehicleModel || vehicle?.model || '';
        return (
          job.jobNumber?.toLowerCase().includes(query) ||
          job.customerName.toLowerCase().includes(query) ||
          job.problemDescription.toLowerCase().includes(query) ||
          licensePlate.toLowerCase().includes(query) ||
          brand.toLowerCase().includes(query) ||
          model.toLowerCase().includes(query)
        );
      });
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(job => job.status === statusFilter);
    }

    // Priority filter
    if (priorityFilter !== 'all') {
      filtered = filtered.filter(job => job.priority === priorityFilter);
    }

    // Sort the filtered jobs
    return sortJobs(filtered);
  }, [searchQuery, statusFilter, priorityFilter, vehicles]);

  // Memoize filtered jobs for pagination
  const filteredJobs = useMemo(() => filterAndSortJobs(allJobs), [filterAndSortJobs, allJobs]);

  // Use pagination hook at top level (React hooks rules) - must be before handleSelectAll
  const pagination = usePagination(filteredJobs, 20);

  // Selection handlers (must be after pagination is defined)
  const handleSelectJob = useCallback((jobId: string, selected: boolean) => {
    setSelectedJobs(prev => {
      const newSet = new Set(prev);
      if (selected) {
        newSet.add(jobId);
      } else {
        newSet.delete(jobId);
      }
      return newSet;
    });
  }, []);

  const handleSelectAll = useCallback((checked: boolean) => {
    if (checked) {
      const allIds = pagination.paginatedItems.map(job => job.id);
      setSelectedJobs(new Set(allIds));
    } else {
      setSelectedJobs(new Set());
    }
  }, [pagination.paginatedItems]);

  const toggleSelectionMode = useCallback(() => {
    setSelectionMode(prev => !prev);
    setSelectedJobs(new Set());
  }, []);

  const handleBulkDelete = useCallback(async () => {
    if (selectedJobs.size === 0) return;

    setIsDeleting(true);
    try {
      const deletePromises = Array.from(selectedJobs).map(jobId => deleteJob(jobId));
      await Promise.all(deletePromises);
      toast.success(`Successfully deleted ${selectedJobs.size} job${selectedJobs.size > 1 ? 's' : ''}`);
      setSelectedJobs(new Set());
      setSelectionMode(false);
    } catch (error) {
      console.error('Error deleting jobs:', error);
      toast.error('Failed to delete some jobs');
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
    }
  }, [selectedJobs]);

  const isMechanic = user?.role === 'mechanic';
  const isOfficeOrAdmin = user?.role === 'office_staff' || user?.role === 'admin' || user?.role === 'manager';

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">{t('jobs.loadingJobs')}</p>
      </div>
    );
  }

  // Desktop Layout for Office Staff
  if (!isMobile && isOfficeOrAdmin) {
    
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">{t('nav.jobs')}</h1>
            <p className="text-muted-foreground">{allJobs.length} total jobs</p>
          </div>
          <div className="flex items-center gap-3">
            {selectionMode ? (
              <>
                <Badge variant="secondary" className="text-base px-4 py-2">
                  {selectedJobs.size} selected
                </Badge>
                <Button
                  variant="destructive"
                  onClick={() => setDeleteDialogOpen(true)}
                  disabled={selectedJobs.size === 0}
                  className="gap-2"
                >
                  <Trash2 className="h-4 w-4" />
                  {t('jobs.deleteSelected')}
                </Button>
                <Button variant="outline" onClick={toggleSelectionMode} className="gap-2">
                  <X className="h-4 w-4" />
                  {t('common.cancel')}
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" onClick={toggleSelectionMode} className="gap-2">
                  <CheckSquare className="h-4 w-4" />
                  {t('jobs.selectJobs')}
                </Button>
                <Button size="lg" onClick={() => navigate('/jobs/new')} className="gap-2">
                  <Plus className="h-5 w-5" />
                  {t('dashboard.createJob')}
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Filters Bar */}
        <div className="flex items-center gap-4 flex-wrap">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t('jobs.searchPlaceholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder={t('jobs.statusPlaceholder')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('jobs.allStatuses')}</SelectItem>
              <SelectItem value="not_started">{t('jobs.notStarted')}</SelectItem>
              <SelectItem value="in_progress">{t('jobs.inProgress')}</SelectItem>
              <SelectItem value="waiting_for_parts">{t('jobs.waitingParts')}</SelectItem>
              <SelectItem value="completed">{t('jobs.completed')}</SelectItem>
            </SelectContent>
          </Select>

          <Select value={priorityFilter} onValueChange={setPriorityFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder={t('jobs.priorityPlaceholder')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('jobs.allPriority')}</SelectItem>
              <SelectItem value="urgent">{t('priority.urgent')}</SelectItem>
              <SelectItem value="normal">{t('priority.normal')}</SelectItem>
              <SelectItem value="low">{t('priority.low')}</SelectItem>
            </SelectContent>
          </Select>

          <div className="flex items-center border rounded-lg p-1">
            <Button
              variant={viewMode === 'table' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('table')}
            >
              <List className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('grid')}
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Results Count */}
        <div className="flex items-center gap-2">
          <Badge variant="secondary">{pagination.totalItems} jobs</Badge>
          {(statusFilter !== 'all' || priorityFilter !== 'all' || searchQuery) && (
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => {
                setStatusFilter('all');
                setPriorityFilter('all');
                setSearchQuery('');
              }}
            >
              Clear filters
            </Button>
          )}
        </div>

        {/* Content */}
        {viewMode === 'table' ? (
          <Card>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/50 border-b">
                  <tr>
                    {selectionMode && (
                      <th className="p-4 w-12">
                        <Checkbox
                          checked={pagination.paginatedItems.length > 0 && pagination.paginatedItems.every(job => selectedJobs.has(job.id))}
                          onCheckedChange={handleSelectAll}
                        />
                      </th>
                    )}
                    <th className="p-4 text-left font-medium text-sm">Vehicle</th>
                    <th className="p-4 text-left font-medium text-sm">Problem</th>
                    <th className="p-4 text-left font-medium text-sm">Status</th>
                    <th className="p-4 text-left font-medium text-sm">Priority</th>
                    <th className="p-4 text-left font-medium text-sm">Assigned</th>
                    <th className="p-4 text-left font-medium text-sm">Created</th>
                  </tr>
                </thead>
                <tbody>
                  {pagination.paginatedItems.length > 0 ? (
                    pagination.paginatedItems.map(job => (
                      <JobTableRow
                        key={job.id}
                        job={job}
                        userId={user?.id}
                        userLanguage={userLanguage}
                        vehicle={vehicles.get(job.vehicleId)}
                        mechanic={job.assignedMechanicId ? mechanics.get(job.assignedMechanicId) : undefined}
                        userRole={user?.role}
                        isSelected={selectedJobs.has(job.id)}
                        onSelect={handleSelectJob}
                        selectionMode={selectionMode}
                      />
                    ))
                  ) : (
                    <tr>
                      <td colSpan={selectionMode ? 7 : 6} className="p-8 text-center text-muted-foreground">
                        No jobs found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            {/* Pagination */}
            <div className="border-t px-4">
              <PaginationControls
                currentPage={pagination.currentPage}
                totalPages={pagination.totalPages}
                totalItems={pagination.totalItems}
                pageSize={pagination.pageSize}
                onPageChange={pagination.onPageChange}
                onPageSizeChange={pagination.onPageSizeChange}
                pageSizeOptions={[10, 20, 50, 100]}
              />
            </div>
          </Card>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {pagination.paginatedItems.map(job => (
                <JobListItem key={job.id} job={job} userId={user?.id} userLanguage={userLanguage} vehicle={vehicles.get(job.vehicleId)} mechanic={job.assignedMechanicId ? mechanics.get(job.assignedMechanicId) : undefined} userRole={user?.role} />
              ))}
            </div>
            {/* Pagination for grid view */}
            <PaginationControls
              currentPage={pagination.currentPage}
              totalPages={pagination.totalPages}
              totalItems={pagination.totalItems}
              pageSize={pagination.pageSize}
              onPageChange={pagination.onPageChange}
              onPageSizeChange={pagination.onPageSizeChange}
              pageSizeOptions={[12, 24, 48, 96]}
            />
          </>
        )}

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete {selectedJobs.size} Job{selectedJobs.size > 1 ? 's' : ''}?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the selected job{selectedJobs.size > 1 ? 's' : ''} and all associated data including messages and activity logs.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleBulkDelete}
                disabled={isDeleting}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {isDeleting ? 'Deleting...' : `Delete ${selectedJobs.size} Job${selectedJobs.size > 1 ? 's' : ''}`}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    );
  }

  // Mobile Layout
  return (
    <PullToRefresh onRefresh={handleRefresh} className="safe-top min-h-screen">
      {/* Header */}
      <div className="px-4 pt-4 pb-2 flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t('nav.jobs')}</h1>
        {!isMechanic && (
          <Button size="icon" onClick={() => navigate('/jobs/new')}>
            <Plus className="h-5 w-5" />
          </Button>
        )}
      </div>

      {/* Search */}
      <div className="px-4 pb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t('common.search')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Tabs */}
      {isMechanic ? (
        <Tabs defaultValue={searchParams.get('tab') || 'my-jobs'} className="px-4">
          <TabsList className="w-full grid grid-cols-2">
            <TabsTrigger value="my-jobs">{t('dashboard.myJobs')}</TabsTrigger>
            <TabsTrigger value="available">{t('dashboard.availableJobs')}</TabsTrigger>
          </TabsList>

          <TabsContent value="my-jobs" className="space-y-3 mt-4">
            {filterAndSortJobs(myJobs).length > 0 ? (
              filterAndSortJobs(myJobs).map(job => <JobListItem key={job.id} job={job} userId={user?.id} userLanguage={userLanguage} vehicle={vehicles.get(job.vehicleId)} mechanic={job.assignedMechanicId ? mechanics.get(job.assignedMechanicId) : undefined} userRole={user?.role} />)
            ) : (
              <p className="text-center text-muted-foreground py-8">
                {t('common.noData')}
              </p>
            )}
          </TabsContent>

          <TabsContent value="available" className="space-y-3 mt-4">
            {filterAndSortJobs(availableJobs).length > 0 ? (
              filterAndSortJobs(availableJobs).map(job => <JobListItem key={job.id} job={job} userId={user?.id} userLanguage={userLanguage} vehicle={vehicles.get(job.vehicleId)} mechanic={job.assignedMechanicId ? mechanics.get(job.assignedMechanicId) : undefined} userRole={user?.role} />)
            ) : (
              <p className="text-center text-muted-foreground py-8">
                {t('common.noData')}
              </p>
            )}
          </TabsContent>
        </Tabs>
      ) : (
        <Tabs defaultValue="all" className="px-4">
          <TabsList className="w-full grid grid-cols-4">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="active">{t('jobs.inProgress')}</TabsTrigger>
            <TabsTrigger value="waiting">{t('jobs.waitingParts')}</TabsTrigger>
            <TabsTrigger value="done">{t('jobs.completed')}</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-3 mt-4">
            {(() => {
              const activeJobs = sortJobs(allJobs.filter(j => j.status !== 'completed'));
              return activeJobs.length > 0 ? (
                activeJobs.map(job => <JobListItem key={job.id} job={job} userId={user?.id} userLanguage={userLanguage} vehicle={vehicles.get(job.vehicleId)} mechanic={job.assignedMechanicId ? mechanics.get(job.assignedMechanicId) : undefined} userRole={user?.role} />)
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  {t('common.noData')}
                </p>
              );
            })()}
          </TabsContent>

          <TabsContent value="active" className="space-y-3 mt-4">
            {(() => {
              const inProgressJobs = sortJobs(allJobs.filter(j => j.status === 'in_progress' || j.status === 'waiting_for_parts'));
              return inProgressJobs.length > 0 ? (
                inProgressJobs.map(job => <JobListItem key={job.id} job={job} userId={user?.id} userLanguage={userLanguage} vehicle={vehicles.get(job.vehicleId)} mechanic={job.assignedMechanicId ? mechanics.get(job.assignedMechanicId) : undefined} userRole={user?.role} />)
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  {t('common.noData')}
                </p>
              );
            })()}
          </TabsContent>

          <TabsContent value="waiting" className="space-y-3 mt-4">
            {(() => {
              const waitingJobs = sortJobs(allJobs.filter(j => j.status === 'waiting_for_parts'));
              return waitingJobs.length > 0 ? (
                waitingJobs.map(job => <JobListItem key={job.id} job={job} userId={user?.id} userLanguage={userLanguage} vehicle={vehicles.get(job.vehicleId)} mechanic={job.assignedMechanicId ? mechanics.get(job.assignedMechanicId) : undefined} userRole={user?.role} />)
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  {t('common.noData')}
                </p>
              );
            })()}
          </TabsContent>

          <TabsContent value="done" className="space-y-3 mt-4">
            {(() => {
              const completedJobs = allJobs
                .filter(j => j.status === 'completed')
                .sort((a, b) => {
                  const aTime = a.completedAt ? new Date(a.completedAt).getTime() : 0;
                  const bTime = b.completedAt ? new Date(b.completedAt).getTime() : 0;
                  return bTime - aTime;
                });
              return completedJobs.length > 0 ? (
                completedJobs.map(job => <JobListItem key={job.id} job={job} userId={user?.id} userLanguage={userLanguage} vehicle={vehicles.get(job.vehicleId)} mechanic={job.assignedMechanicId ? mechanics.get(job.assignedMechanicId) : undefined} userRole={user?.role} />)
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  {t('common.noData')}
                </p>
              );
            })()}
          </TabsContent>
        </Tabs>
      )}
    </PullToRefresh>
  );
}
