import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageSquare, Briefcase, Clock, AlertCircle, TrendingUp, Calendar, Sparkles, Zap } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatsCard, StatsCardContainer } from '@/components/ui/stats-card';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useIsMobile } from '@/hooks/use-mobile';
import { getJobs, getAvailableJobs, getJobsByMechanic, getVehicleById, getMechanics, updateJob, subscribeToJobs, subscribeToAllMessages } from '@/services/firestoreService';
import { Job, JobStatus, JobPriority, Vehicle, User } from '@/lib/types';
import { MechanicAssignMenu } from '@/components/dashboard/MechanicAssignMenu';
import { getTranslatedProblemDescription } from '@/lib/jobTranslation';
import { Language } from '@/lib/i18n';
import { LicensePlate } from '@/components/ui/license-plate';
import { CarBrandLogo } from '@/components/ui/car-brand-logo';
import { CustomizableDashboard, CustomizableDashboardRef, useDashboardControls, AVAILABLE_WIDGETS } from '@/components/dashboard/CustomizableDashboard';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Lock, Unlock, RotateCcw, Save, LayoutGrid } from 'lucide-react';

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
    const statusDiff = statusOrder[a.status] - statusOrder[b.status];
    if (statusDiff !== 0) return statusDiff;

    const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
    if (priorityDiff !== 0) return priorityDiff;

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
    <span className={`badge-premium ${className}`}>
      {label}
    </span>
  );
}

function JobCard({ job, compact = false, userLanguage, userRole, mechanics, onAssign }: { job: Job; compact?: boolean; userLanguage: Language; userRole?: string; mechanics?: User[]; onAssign?: (jobId: string, mechanicId: string) => void }) {
  const navigate = useNavigate();
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);

  // Only fetch vehicle if denormalized fields are not present (backwards compatibility)
  useEffect(() => {
    if (job.vehicleId && !job.vehicleLicensePlate) {
      getVehicleById(job.vehicleId).then(setVehicle);
    }
  }, [job.vehicleId, job.vehicleLicensePlate]);

  // Use denormalized fields first, fallback to vehicle lookup
  const licensePlate = job.vehicleLicensePlate || vehicle?.licensePlate;
  const brand = job.vehicleBrand || vehicle?.brand;
  const model = job.vehicleModel || vehicle?.model;
  const year = job.vehicleYear || vehicle?.year;

  const { t } = useLanguage();

  const timeSince = () => {
    const diff = Date.now() - new Date(job.createdAt).getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    if (hours < 1) return t('time.justNow');
    if (hours < 24) return t('time.hoursAgo').replace('{hours}', hours.toString());
    return t('time.daysAgo').replace('{days}', Math.floor(hours / 24).toString());
  };

  const isPriority = job.priority === 'urgent';
  const canSeeCustomerInfo = userRole !== 'mechanic';

  return (
    <Card
      className={`card-premium card-interactive group ${isPriority ? 'border-l-4 border-l-gold' : ''}`}
      onClick={() => navigate(`/jobs/${job.id}`)}
    >
      <CardContent className={compact ? "p-4" : "p-5"}>
        <div className="flex items-start gap-3 mb-3">
          {/* Brand Logo */}
          <div className="w-12 h-12 flex items-center justify-center shrink-0">
            <CarBrandLogo brand={brand || ''} size="lg" className="text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              {licensePlate ? (
                <LicensePlate plateNumber={licensePlate} size="sm" />
              ) : (
                <h4 className="font-semibold text-base text-muted-foreground">{t('jobs.noVehicle')}</h4>
              )}
              {isPriority && (
                <Sparkles className="h-4 w-4 text-primary/70" />
              )}
            </div>
            {(brand || model) && (
              <p className="text-sm text-muted-foreground">
                {brand} {model} {year ? `(${year})` : ''}
              </p>
            )}
            {canSeeCustomerInfo && (
              <p className="text-xs text-muted-foreground/70 mt-1">
                {job.customerName}
              </p>
            )}
          </div>
          <div className="flex flex-col items-end gap-2 shrink-0">
            <StatusBadge status={job.status} />
            {mechanics && onAssign && userRole !== 'mechanic' && (
              <MechanicAssignMenu
                assignedMechanicId={job.assignedMechanicId}
                mechanics={mechanics}
                onAssign={(mechanicId) => onAssign(job.id, mechanicId)}
              />
            )}
          </div>
        </div>
        {!compact && (
          <p className="text-sm text-muted-foreground line-clamp-2 mb-3 leading-relaxed">
            {getTranslatedProblemDescription(job, userLanguage)}
          </p>
        )}
        <div className="flex items-center justify-between text-xs">
          <span className={`priority-${job.priority} font-semibold uppercase tracking-wide`}>
            {job.priority}
          </span>
          <span className="flex items-center gap-1.5 text-muted-foreground">
            <Clock className="h-3.5 w-3.5" />
            {timeSince()}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

function OfficeStaffDashboard() {
  const { t, language: userLanguage } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [mechanics, setMechanics] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { isLocked, setIsLocked } = useDashboardControls();
  const dashboardRef = useRef<CustomizableDashboardRef>(null);
  const [visibleWidgets, setVisibleWidgets] = useState<string[]>(AVAILABLE_WIDGETS.map(w => w.id));

  useEffect(() => {
    const loadData = async () => {
      try {
        const [jobsData, mechanicsData] = await Promise.all([
          getJobs(),
          getMechanics()
        ]);
        setJobs(jobsData);
        setMechanics(mechanicsData);
      } catch (error) {
        console.error('Error loading dashboard data:', error);
      } finally {
        setIsLoading(false);
        // Sync visible widgets after dashboard loads
        setTimeout(() => {
          const ids = dashboardRef.current?.getVisibleWidgetIds();
          if (ids) setVisibleWidgets(ids);
        }, 500);
      }
    };
    loadData();
  }, []);

  const handleAssignMechanic = async (jobId: string, mechanicId: string) => {
    try {
      await updateJob(jobId, {
        assignedMechanicId: mechanicId,
        assignedAt: new Date().toISOString(),
      }, user?.id);
      setJobs(prev => prev.map(j =>
        j.id === jobId ? { ...j, assignedMechanicId: mechanicId, assignedAt: new Date().toISOString() } : j
      ));
    } catch (error) {
      console.error('Error assigning mechanic:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64 animate-fade-in">
        <div className="text-center">
          <div className="w-16 h-16 rounded-2xl gradient-royal-radial mx-auto mb-4 flex items-center justify-center animate-pulse">
            <Briefcase className="h-8 w-8 text-white" />
          </div>
          <p className="text-muted-foreground">{t('common.loadingDashboard')}</p>
        </div>
      </div>
    );
  }

  const statusCounts = {
    not_started: jobs.filter(j => j.status === 'not_started').length,
    in_progress: jobs.filter(j => j.status === 'in_progress').length,
    waiting_for_parts: jobs.filter(j => j.status === 'waiting_for_parts').length,
    completed: jobs.filter(j => j.status === 'completed').length,
  };

  const urgentJobs = sortJobs(jobs.filter(j => j.priority === 'urgent' && j.status !== 'completed'));
  const recentJobs = sortJobs(jobs).slice(0, isMobile ? 5 : 8);

  const todayJobs = jobs.filter(j => {
    const jobDate = new Date(j.createdAt);
    const today = new Date();
    return jobDate.toDateString() === today.toDateString();
  });

  // Desktop Layout
  if (!isMobile) {
    return (
      <div className="space-y-6 animate-fade-in -ml-6">
        {/* Premium Welcome Header with Gradient */}
        <div className="relative overflow-hidden rounded-3xl p-8 glass-light border-0">
          <div className="absolute inset-0 gradient-royal-radial opacity-5" />
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />

          <div className="relative flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl lg:text-4xl font-bold mb-2 text-gradient-royal">
                {t('nav.dashboard')}
              </h1>
              <p className="text-base lg:text-lg text-muted-foreground">
                {t('dashboard.welcomeMessage')}
              </p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {/* Dashboard Controls */}
              <Button
                variant={isLocked ? 'outline' : 'default'}
                size="sm"
                onClick={() => setIsLocked(!isLocked)}
                className="gap-2 h-9"
              >
                {isLocked ? <Lock className="h-3.5 w-3.5" /> : <Unlock className="h-3.5 w-3.5" />}
                <span className="hidden xl:inline text-sm">{isLocked ? t('dashboard.unlockLayout') : t('dashboard.lockLayout')}</span>
              </Button>
              {!isLocked && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => dashboardRef.current?.saveLayout()}
                  className="gap-2 h-9"
                >
                  <Save className="h-3.5 w-3.5" />
                  <span className="hidden xl:inline text-sm">{t('common.save')}</span>
                </Button>
              )}
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2 h-9">
                    <LayoutGrid className="h-3.5 w-3.5" />
                    <span className="hidden xl:inline text-sm">{t('dashboard.widgets')}</span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="end" className="w-56 p-3">
                  <p className="text-sm font-semibold mb-2">{t('dashboard.toggleWidgets')}</p>
                  <div className="space-y-2">
                    {AVAILABLE_WIDGETS.map((widget) => {
                      const isVisible = visibleWidgets.includes(widget.id);
                      return (
                        <label key={widget.id} className="flex items-center gap-2 cursor-pointer text-sm">
                          <input
                            type="checkbox"
                            checked={isVisible}
                            onChange={() => {
                              dashboardRef.current?.toggleWidget(widget.id);
                              setVisibleWidgets(prev =>
                                isVisible ? prev.filter(id => id !== widget.id) : [...prev, widget.id]
                              );
                            }}
                            className="rounded border-border"
                          />
                          {t(widget.labelKey)}
                        </label>
                      );
                    })}
                  </div>
                </PopoverContent>
              </Popover>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  dashboardRef.current?.resetLayout();
                  // Reset visible widgets to default layout IDs
                  setTimeout(() => {
                    const ids = dashboardRef.current?.getVisibleWidgetIds();
                    if (ids) setVisibleWidgets(ids);
                  }, 200);
                }}
                className="gap-2 h-9"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span className="hidden xl:inline text-sm">{t('dashboard.resetLayout')}</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Customizable Dashboard */}
        <CustomizableDashboard
          ref={dashboardRef}
          jobs={jobs}
          mechanics={mechanics}
          statusCounts={statusCounts}
          urgentJobs={urgentJobs}
          recentJobs={recentJobs}
          onAssignMechanic={handleAssignMechanic}
          externalIsLocked={isLocked}
          onLockChange={setIsLocked}
          showControls={false}
        />
      </div>
    );
  }

  // Mobile Layout with Premium Design
  return (
    <div className="space-y-6 pb-6 animate-fade-in">
      {/* Mobile Welcome Header */}
      <div className="p-6 rounded-2xl glass-light">
        <h1 className="text-2xl font-bold mb-1 text-gradient-royal">{t('nav.dashboard')}</h1>
        <p className="text-sm text-muted-foreground">{t('dashboard.welcomeBackShort')}</p>
      </div>

      {/* Mobile Stats Grid */}
      <StatsCardContainer className="justify-start">
        <div onClick={() => navigate('/jobs?status=not_started')} className="cursor-pointer">
          <StatsCard
            heading={t('jobs.notStarted')}
            value={statusCounts.not_started}
            iconSrc="/icon-not-started.gif"
          />
        </div>
        <div onClick={() => navigate('/jobs?status=in_progress')} className="cursor-pointer">
          <StatsCard
            heading={t('jobs.inProgress')}
            value={statusCounts.in_progress}
            iconSrc="/icon-in-progress.gif"
          />
        </div>
        <div onClick={() => navigate('/jobs?status=waiting_for_parts')} className="cursor-pointer">
          <StatsCard
            heading={t('jobs.waitingParts')}
            value={statusCounts.waiting_for_parts}
            iconSrc="/icon-waiting-parts.gif"
          />
        </div>
        <div onClick={() => navigate('/jobs?status=completed')} className="cursor-pointer">
          <StatsCard
            heading={t('jobs.completed')}
            value={statusCounts.completed}
            iconSrc="/icon-completed.gif"
          />
        </div>
      </StatsCardContainer>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 gap-3">
        <Button
          variant="outline"
          className="h-14 text-base border-2 hover:bg-primary/10 hover:border-primary hover:text-primary"
          onClick={() => navigate('/messages')}
        >
          <MessageSquare className="mr-2 h-5 w-5" />
          {t('dashboard.viewMessages')}
        </Button>
      </div>

      {/* Recent Jobs */}
      <Card className="card-glass">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-bold flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg gradient-royal flex items-center justify-center">
              <TrendingUp className="h-4 w-4 text-white" />
            </div>
            {t('dashboard.todaySchedule')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {recentJobs.length > 0 ? (
            recentJobs.map((job, index) => (
              <div key={job.id} className="animate-slide-up" style={{ animationDelay: `${index * 50}ms` }}>
                <JobCard job={job} userLanguage={userLanguage} userRole="office_staff" mechanics={mechanics} onAssign={handleAssignMechanic} />
              </div>
            ))
          ) : (
            <div className="text-center py-8">
              <Briefcase className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
              <p className="text-muted-foreground">{t('common.noData')}</p>
            </div>
          )}
          <p
            onClick={() => navigate('/jobs')}
            className="text-center text-sm text-primary hover:text-primary/80 cursor-pointer pt-2 hover:underline"
          >
            {t('jobs.viewAll')}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function MechanicDashboard() {
  const { t, language: userLanguage } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [availableJobs, setAvailableJobs] = useState<Job[]>([]);
  const [myJobs, setMyJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAvailable, setShowAvailable] = useState(false);
  const [unreadChats, setUnreadChats] = useState(0);

  useEffect(() => {
    if (!user) return;

    const unsubscribe = subscribeToJobs((allJobs) => {
      const available = allJobs.filter(j => !j.assignedMechanicId && j.status === 'not_started');
      const myJobsData = allJobs.filter(j => j.assignedMechanicId === user.id);
      setAvailableJobs(sortJobs(available));
      setMyJobs(sortJobs(myJobsData));
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  // Live unread messages tracking
  useEffect(() => {
    if (!user) return;

    const unsubscribe = subscribeToAllMessages((messages) => {
      const unread = messages.filter(m =>
        m.senderId !== user.id && (!m.readBy || !m.readBy.includes(user.id))
      );
      // Count unique jobs with unread messages
      const unreadJobIds = new Set(unread.map(m => m.jobId));
      setUnreadChats(unreadJobIds.size);
    });

    return () => unsubscribe();
  }, [user]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64 animate-fade-in">
        <div className="text-center">
          <div className="w-16 h-16 rounded-2xl gradient-royal-radial mx-auto mb-4 flex items-center justify-center animate-pulse">
            <Briefcase className="h-8 w-8 text-white" />
          </div>
          <p className="text-muted-foreground">{t('common.loadingDashboard')}</p>
        </div>
      </div>
    );
  }

  const myActiveJobs = myJobs.filter(j => j.status === 'in_progress').length;
  const partsOrdered = myJobs.filter(j => j.status === 'waiting_for_parts').length;
  const completedJobs = myJobs.filter(j => j.status === 'completed').length;
  const activeJobsList = myJobs.filter(j => j.status !== 'completed');

  return (
    <div className="space-y-6 pb-6 animate-fade-in">
      {/* Premium Welcome Header */}
      <div className="relative overflow-hidden rounded-2xl p-6 glass-light">
        <div className="absolute inset-0 gradient-royal-radial opacity-5" />
        <div className="absolute top-0 right-0 w-48 h-48 bg-primary/5 rounded-full blur-3xl" />

        <div className="relative">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-14 h-14 flex items-center justify-center">
              <img src="/Garageprologo.png" alt="GaragePro Logo" className="w-full h-full object-contain" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gradient-royal">
                {t('dashboard.welcomeUser').replace('{name}', user?.fullName?.split(' ')[0] || '')}
              </h1>
              <p className="text-sm text-muted-foreground">{t('dashboard.readyToWork')}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <StatsCardContainer className="justify-start">
        <div onClick={() => navigate('/jobs?tab=available')} className="cursor-pointer hover:scale-105 transition-transform">
          <StatsCard
            heading={t('jobs.available')}
            value={availableJobs.length}
            iconSrc="/icon-not-started.gif"
          />
        </div>
        <div onClick={() => navigate('/jobs?status=in_progress')} className="cursor-pointer hover:scale-105 transition-transform">
          <StatsCard
            heading={t('jobs.active')}
            value={myActiveJobs}
            iconSrc="/icon-in-progress.gif"
          />
        </div>
        <div onClick={() => navigate('/jobs?status=waiting_for_parts')} className="cursor-pointer hover:scale-105 transition-transform">
          <StatsCard
            heading={t('jobs.ordered')}
            value={partsOrdered}
            iconSrc="/icon-waiting-parts.gif"
          />
        </div>
        <div onClick={() => navigate('/jobs?status=completed')} className="cursor-pointer hover:scale-105 transition-transform">
          <StatsCard
            heading={t('jobs.completed')}
            value={completedJobs}
            iconSrc="/icon-completed.gif"
          />
        </div>
      </StatsCardContainer>

      {/* Jobs Card with Toggle */}
      <Card className="card-glass">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg gradient-royal flex items-center justify-center">
                <Briefcase className="h-4 w-4 text-white" />
              </div>
              <CardTitle className="text-lg font-bold">{t('nav.jobs')}</CardTitle>
            </div>
            {/* Toggle Switch */}
            <div className="flex items-center gap-2">
              <Briefcase className={`h-5 w-5 transition-colors ${!showAvailable ? 'text-primary' : 'text-muted-foreground'}`} />
              <label className="switch-toggle relative inline-block">
                <input
                  type="checkbox"
                  checked={showAvailable}
                  onChange={(e) => setShowAvailable(e.target.checked)}
                  className="opacity-0 w-0 h-0 absolute"
                />
                <span
                  className={`switch-inner relative block w-[140px] h-[30px] rounded-full cursor-pointer transition-all duration-300 ${
                    showAvailable ? 'bg-foreground' : 'bg-muted'
                  }`}
                >
                  <span
                    className={`switch-label absolute text-xs font-medium top-[7px] transition-all duration-300 ${
                      showAvailable ? 'left-[15px] text-background' : 'right-[8px] left-auto text-muted-foreground'
                    }`}
                  >
                    {showAvailable ? t('jobs.active') : t('jobs.available')}
                  </span>
                  <span
                    className={`switch-slider absolute w-[70px] h-[26px] rounded-full top-[2px] text-xs font-medium flex items-center justify-center transition-all duration-300 shadow-md ${
                      showAvailable
                        ? 'left-[68px] bg-muted-foreground text-background'
                        : 'left-[2px] bg-background text-foreground'
                    }`}
                  >
                    {showAvailable ? t('jobs.available') : t('jobs.active')}
                  </span>
                </span>
              </label>
              <Sparkles className={`h-5 w-5 transition-colors ${showAvailable ? 'text-primary/70' : 'text-muted-foreground'}`} />
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {!showAvailable ? (
            <>
              {activeJobsList.length > 0 ? (
                <div className="space-y-3">
                  {activeJobsList.slice(0, 5).map((job, index) => (
                    <div key={job.id} className="animate-slide-up" style={{ animationDelay: `${index * 50}ms` }}>
                      <JobCard job={job} userLanguage={userLanguage} userRole="mechanic" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Briefcase className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                  <p className="text-muted-foreground">{t('jobs.noActiveJobs')}</p>
                </div>
              )}
              <p
                onClick={() => navigate('/jobs?tab=my-jobs')}
                className="text-center text-sm text-primary hover:text-primary/80 cursor-pointer pt-2 hover:underline"
              >
                {t('jobs.viewMyJobs')}
              </p>
            </>
          ) : (
            <>
              {availableJobs.length > 0 ? (
                <div className="space-y-3">
                  {availableJobs.slice(0, 5).map((job, index) => (
                    <div key={job.id} className="animate-slide-up" style={{ animationDelay: `${index * 50}ms` }}>
                      <JobCard job={job} userLanguage={userLanguage} userRole="mechanic" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Sparkles className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                  <p className="text-muted-foreground">{t('jobs.noAvailableJobs')}</p>
                </div>
              )}
              <p
                onClick={() => navigate('/jobs?tab=available')}
                className="text-center text-sm text-primary hover:text-primary/80 cursor-pointer pt-2 hover:underline"
              >
                {t('jobs.viewAvailableJobs')}
              </p>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();

  const { t } = useLanguage();

  if (!user) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">{t('auth.pleaseLogin')}</p>
      </div>
    );
  }

  if (user.role === 'mechanic') {
    return <MechanicDashboard />;
  }

  return <OfficeStaffDashboard />;
}
