import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  TrendingUp, 
  TrendingDown,
  Users, 
  Briefcase, 
  Car, 
  DollarSign,
  Wrench,
  AlertTriangle,
  CheckCircle2,
  Timer,
  Activity,
  BarChart3,
  Search,
  MoreHorizontal,
  Trash2,
  Edit,
  Eye,
  Filter,
  Download,
  RefreshCw,
  ArrowUpRight,
  Sparkles
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { 
  getJobs, 
  getVehicles, 
  getMechanics, 
  getUniqueCustomersFromJobs,
  getMechanicStats,
  deleteJob,
  updateJob,
  getVehicleById
} from '@/services/firestoreService';
import { Job, JobStatus, JobPriority } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { StatsCard, StatsCardContainer } from '@/components/ui/stats-card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { format, subDays, isWithinInterval } from 'date-fns';
import { cn } from '@/lib/utils';
import { LicensePlate } from '@/components/ui/license-plate';
import { CarBrandLogo } from '@/components/ui/car-brand-logo';

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

// Modern KPI Card Component
function KPICard({ 
  title, 
  value, 
  change, 
  changeType, 
  icon: Icon,
  subtitle,
  accent = 'primary'
}: { 
  title: string; 
  value: string | number; 
  change?: number;
  changeType?: 'positive' | 'negative' | 'neutral';
  icon: React.ElementType;
  subtitle?: string;
  accent?: 'primary' | 'green' | 'blue' | 'amber';
}) {
  const accentStyles = {
    primary: 'from-primary/10 to-primary/5 text-primary',
    green: 'from-emerald-500/10 to-emerald-500/5 text-emerald-600',
    blue: 'from-blue-500/10 to-blue-500/5 text-blue-600',
    amber: 'from-amber-500/10 to-amber-500/5 text-amber-600',
  };

  return (
    <Card className="group relative overflow-hidden border-0 bg-gradient-to-br from-card to-card/80 shadow-sm hover:shadow-md transition-all duration-300">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      <CardHeader className="flex flex-row items-start justify-between pb-2 space-y-0">
        <div className="space-y-1">
          <CardTitle className="text-sm font-medium text-muted-foreground tracking-wide uppercase">
            {title}
          </CardTitle>
          <div className="text-3xl font-semibold tracking-tight">{value}</div>
        </div>
        <div className={cn(
          "h-12 w-12 rounded-2xl bg-gradient-to-br flex items-center justify-center shadow-sm",
          accentStyles[accent]
        )}>
          <Icon className="h-6 w-6" />
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex items-center gap-2">
          {change !== undefined && (
            <div className={cn(
              "flex items-center gap-1 text-sm font-medium rounded-full px-2 py-0.5",
              changeType === 'positive' ? 'text-emerald-600 bg-emerald-500/10' : 
              changeType === 'negative' ? 'text-red-600 bg-red-500/10' : 
              'text-muted-foreground bg-muted'
            )}>
              {changeType === 'positive' ? (
                <TrendingUp className="h-3.5 w-3.5" />
              ) : changeType === 'negative' ? (
                <TrendingDown className="h-3.5 w-3.5" />
              ) : null}
              <span>{change > 0 ? '+' : ''}{change}%</span>
            </div>
          )}
          {subtitle && (
            <span className="text-xs text-muted-foreground">{subtitle}</span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Mini Stat Card for secondary metrics
function MiniStatCard({ 
  value, 
  label, 
  icon: Icon,
  color
}: { 
  value: number; 
  label: string; 
  icon: React.ElementType;
  color: string;
}) {
  return (
    <Card className="border-0 bg-card/50 backdrop-blur-sm shadow-sm hover:shadow-md transition-all duration-300">
      <CardContent className="p-5">
        <div className="flex items-center gap-4">
          <div className={cn(
            "h-11 w-11 rounded-xl flex items-center justify-center shadow-sm",
            color
          )}>
            <Icon className="h-5 w-5 text-white" />
          </div>
          <div>
            <p className="text-2xl font-semibold tracking-tight">{value}</p>
            <p className="text-sm text-muted-foreground">{label}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Mechanic Performance Card - Refined
function MechanicPerformanceCard({ 
  name, 
  completedJobs, 
  avgTime, 
  activeJobs,
  efficiency
}: { 
  name: string; 
  completedJobs: number; 
  avgTime: number; 
  activeJobs: number;
  efficiency: number;
}) {
  const efficiencyColor = efficiency >= 80 ? 'text-emerald-600' : efficiency >= 60 ? 'text-amber-600' : 'text-red-600';
  
  return (
    <div className="group flex items-center justify-between p-5 rounded-xl bg-gradient-to-r from-muted/30 to-muted/10 border border-border/50 hover:border-border hover:shadow-sm transition-all duration-300">
      <div className="flex items-center gap-4">
        <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
          <span className="text-lg font-semibold text-primary">
            {name.split(' ').map(n => n[0]).join('').slice(0, 2)}
          </span>
        </div>
        <div>
          <p className="font-semibold text-foreground">{name}</p>
          <p className="text-sm text-muted-foreground">{activeJobs} active jobs</p>
        </div>
      </div>
      <div className="flex items-center gap-8">
        <div className="text-right">
          <p className="text-sm font-semibold text-foreground">{completedJobs}</p>
          <p className="text-xs text-muted-foreground">Completed</p>
        </div>
        <div className="text-right">
          <p className="text-sm font-semibold text-foreground">{avgTime}m</p>
          <p className="text-xs text-muted-foreground">Avg time</p>
        </div>
        <div className="w-28">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-muted-foreground">Efficiency</span>
            <span className={cn("text-sm font-semibold", efficiencyColor)}>{efficiency}%</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div 
              className={cn(
                "h-full rounded-full transition-all duration-500",
                efficiency >= 80 ? 'bg-emerald-500' : efficiency >= 60 ? 'bg-amber-500' : 'bg-red-500'
              )}
              style={{ width: `${efficiency}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// Status Badge Component
function StatusBadge({ status, t }: { status: JobStatus; t: (key: string) => string }) {
  const styles: Record<JobStatus, string> = {
    not_started: 'bg-slate-100 text-slate-700 border-slate-200',
    in_progress: 'bg-blue-50 text-blue-700 border-blue-200',
    waiting_for_parts: 'bg-amber-50 text-amber-700 border-amber-200',
    completed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  };
  
  const labels: Record<JobStatus, string> = {
    not_started: t('jobs.notStarted'),
    in_progress: t('jobs.inProgress'),
    waiting_for_parts: t('jobs.waitingParts'),
    completed: t('jobs.completed'),
  };
  
  return (
    <span className={cn(
      "inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium border",
      styles[status]
    )}>
      {labels[status]}
    </span>
  );
}

// Priority Badge Component
function PriorityBadge({ priority, t }: { priority: JobPriority; t: (key: string) => string }) {
  const styles: Record<JobPriority, string> = {
    urgent: 'bg-red-50 text-red-700 border-red-200',
    normal: 'bg-slate-50 text-slate-600 border-slate-200',
    low: 'bg-slate-50/50 text-slate-500 border-slate-100',
  };
  
  const labels: Record<JobPriority, string> = {
    urgent: t('jobs.priority.urgent'),
    normal: t('jobs.priority.normal'),
    low: t('jobs.priority.low'),
  };
  
  return (
    <span className={cn(
      "inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border",
      styles[priority]
    )}>
      {priority === 'urgent' && <span className="w-1.5 h-1.5 rounded-full bg-red-500 mr-1.5 animate-pulse" />}
      {labels[priority]}
    </span>
  );
}

export default function ManagerDashboardPage() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editedStatus, setEditedStatus] = useState<JobStatus>('not_started');
  const [refreshKey, setRefreshKey] = useState(0);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [mechanics, setMechanics] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [mechanicStats, setMechanicStats] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [vehiclesMap, setVehiclesMap] = useState<Map<string, any>>(new Map());

  // Load all data
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const [jobsData, vehiclesData, mechanicsData, customersData, statsData] = await Promise.all([
          getJobs(),
          getVehicles(),
          getMechanics(),
          getUniqueCustomersFromJobs(),
          getMechanicStats()
        ]);

        setJobs(jobsData);
        setVehicles(vehiclesData);
        setMechanics(mechanicsData);
        setCustomers(customersData);
        setMechanicStats(statsData);

        // Create vehicles map for quick lookup
        const vMap = new Map();
        vehiclesData.forEach(v => vMap.set(v.id, v));
        setVehiclesMap(vMap);
      } catch (error) {
        console.error('Error loading manager dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [refreshKey]);

  // Calculate KPIs
  const kpis = useMemo(() => {
    const now = new Date();
    const lastWeek = subDays(now, 7);
    const twoWeeksAgo = subDays(now, 14);

    const thisWeekJobs = jobs.filter(j => 
      isWithinInterval(new Date(j.createdAt), { start: lastWeek, end: now })
    );
    const lastWeekJobs = jobs.filter(j => 
      isWithinInterval(new Date(j.createdAt), { start: twoWeeksAgo, end: lastWeek })
    );

    const completedJobs = jobs.filter(j => j.status === 'completed');
    const activeJobs = jobs.filter(j => j.status === 'in_progress');
    const pendingParts = jobs.filter(j => j.status === 'waiting_for_parts');
    const urgentJobs = jobs.filter(j => j.priority === 'urgent' && j.status !== 'completed');

    const avgRevenuePerJob = 350;
    const totalRevenue = completedJobs.length * avgRevenuePerJob;
    const laborCost = completedJobs.length * 85;
    const partsCost = completedJobs.length * 120;
    const profit = totalRevenue - laborCost - partsCost;

    const completionRate = jobs.length > 0 
      ? Math.round((completedJobs.length / jobs.length) * 100) 
      : 0;

    const avgTurnaround = completedJobs.length > 0 ? 4.2 : 0;

    const jobsChange = lastWeekJobs.length > 0 
      ? Math.round(((thisWeekJobs.length - lastWeekJobs.length) / lastWeekJobs.length) * 100)
      : 0;

    return {
      totalJobs: jobs.length,
      completedJobs: completedJobs.length,
      activeJobs: activeJobs.length,
      pendingParts: pendingParts.length,
      urgentJobs: urgentJobs.length,
      totalRevenue,
      laborCost,
      partsCost,
      profit,
      completionRate,
      avgTurnaround,
      jobsChange,
      totalCustomers: customers.length,
      totalVehicles: vehicles.length,
      totalMechanics: mechanics.length,
    };
  }, [jobs, customers, vehicles, mechanics]);

  // Filter and sort jobs
  const filteredJobs = useMemo(() => {
    const filtered = jobs.filter(job => {
      const matchesSearch = 
        job.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        job.problemDescription.toLowerCase().includes(searchQuery.toLowerCase()) ||
        job.id.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || job.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    });
    return sortJobs(filtered);
  }, [jobs, searchQuery, statusFilter]);

  const handleDeleteJob = () => {
    if (!selectedJob) return;
    deleteJob(selectedJob.id);
    setDeleteDialogOpen(false);
    setSelectedJob(null);
    setRefreshKey(prev => prev + 1);
    toast({
      title: t('manager.jobDeleted'),
      description: t('manager.jobDeletedDescription'),
    });
  };

  const handleEditJob = async () => {
    if (!selectedJob || !user) return;
    const updates = {
      status: editedStatus,
      ...(editedStatus === 'completed' ? { completedAt: new Date().toISOString() } : {}),
    };
    await updateJob(selectedJob.id, updates, user.id);
    setEditDialogOpen(false);
    setSelectedJob(null);
    setRefreshKey(prev => prev + 1);
    toast({
      title: t('manager.jobUpdated'),
      description: t('manager.jobUpdatedDescription'),
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Loading dashboard data...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight">{t('manager.dashboard')}</h1>
            <Badge variant="secondary" className="font-normal">
              <Sparkles className="h-3 w-3 mr-1" />
              Live
            </Badge>
          </div>
          <p className="text-muted-foreground">{t('manager.dashboardSubtitle')}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setRefreshKey(prev => prev + 1)}
            className="h-9"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            {t('manager.refresh')}
          </Button>
          <Button variant="outline" size="sm" className="h-9">
            <Download className="h-4 w-4 mr-2" />
            {t('manager.exportData')}
          </Button>
        </div>
      </div>

      {/* Secondary Metrics Row */}
      <StatsCardContainer className="justify-start">
        <div onClick={() => navigate('/customers')} className="cursor-pointer hover:scale-105 transition-transform">
          <StatsCard
            heading={t('manager.kpi.customers')}
            value={kpis.totalCustomers}
            icon={<Users className="h-6 w-6" />}
            iconColor="text-blue-500"
          />
        </div>
        <div onClick={() => navigate('/vehicles')} className="cursor-pointer hover:scale-105 transition-transform">
          <StatsCard
            heading={t('manager.kpi.vehicles')}
            value={kpis.totalVehicles}
            icon={<Car className="h-6 w-6" />}
            iconColor="text-violet-500"
          />
        </div>
        <StatsCard
          heading={t('manager.kpi.mechanics')}
          value={kpis.totalMechanics}
          icon={<Wrench className="h-6 w-6" />}
          iconColor="text-emerald-500"
        />
        <div onClick={() => navigate('/jobs?status=waiting_for_parts')} className="cursor-pointer hover:scale-105 transition-transform">
          <StatsCard
            heading={t('manager.kpi.awaitingParts')}
            value={kpis.pendingParts}
            icon={<AlertTriangle className="h-6 w-6" />}
            iconColor="text-amber-500"
          />
        </div>
      </StatsCardContainer>

      {/* Main Content Tabs */}
      <Tabs defaultValue="jobs" className="space-y-6">
        <TabsList className="inline-flex h-11 items-center justify-center rounded-xl bg-muted/50 p-1 text-muted-foreground">
          <TabsTrigger 
            value="jobs" 
            className="inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-all data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
          >
            <Briefcase className="h-4 w-4" />
            {t('manager.tabs.jobs')}
          </TabsTrigger>
          <TabsTrigger 
            value="performance" 
            className="inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-all data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
          >
            <Activity className="h-4 w-4" />
            {t('manager.tabs.performance')}
          </TabsTrigger>
          <TabsTrigger 
            value="analytics" 
            className="inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-all data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
          >
            <BarChart3 className="h-4 w-4" />
            {t('manager.tabs.analytics')}
          </TabsTrigger>
        </TabsList>

        {/* Jobs Tab */}
        <TabsContent value="jobs" className="space-y-4 mt-6">
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl">{t('manager.jobManagement')}</CardTitle>
                  <CardDescription className="mt-1">{t('manager.jobManagementDescription')}</CardDescription>
                </div>
              </div>
              <div className="flex items-center gap-3 mt-5">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input 
                    placeholder={t('manager.searchJobs')}
                    className="pl-10 h-10 bg-muted/30 border-0 focus-visible:ring-1"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-48 h-10 bg-muted/30 border-0">
                    <Filter className="h-4 w-4 mr-2 text-muted-foreground" />
                    <SelectValue placeholder={t('manager.filterByStatus')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('manager.allStatuses')}</SelectItem>
                    <SelectItem value="not_started">{t('jobs.notStarted')}</SelectItem>
                    <SelectItem value="in_progress">{t('jobs.inProgress')}</SelectItem>
                    <SelectItem value="waiting_for_parts">{t('jobs.waitingParts')}</SelectItem>
                    <SelectItem value="completed">{t('jobs.completed')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[520px]">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/30 hover:bg-muted/30">
                      <TableHead className="font-medium text-muted-foreground">Plate</TableHead>
                      <TableHead className="font-medium text-muted-foreground">{t('manager.table.customer')}</TableHead>
                      <TableHead className="font-medium text-muted-foreground">{t('manager.table.vehicle')}</TableHead>
                      <TableHead className="font-medium text-muted-foreground">{t('manager.table.status')}</TableHead>
                      <TableHead className="font-medium text-muted-foreground">{t('manager.table.priority')}</TableHead>
                      <TableHead className="font-medium text-muted-foreground">{t('manager.table.created')}</TableHead>
                      <TableHead className="text-right font-medium text-muted-foreground">{t('manager.table.actions')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredJobs.map((job) => {
                      const vehicle = vehiclesMap.get(job.vehicleId);
                      const licensePlate = job.vehicleLicensePlate || vehicle?.licensePlate || '-';
                      const brand = job.vehicleBrand || vehicle?.brand;
                      const model = job.vehicleModel || vehicle?.model;
                      return (
                        <TableRow key={job.id} className="group">
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <CarBrandLogo brand={brand || ''} size="md" className="text-primary" />
                              {licensePlate !== '-' ? (
                                <LicensePlate plateNumber={licensePlate} size="sm" />
                              ) : (
                                <span className="text-muted-foreground">-</span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium">{job.customerName}</p>
                              <p className="text-sm text-muted-foreground">{job.customerPhone}</p>
                            </div>
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {brand && model ? `${brand} ${model}${vehicle?.year ? ` (${vehicle.year})` : ''}` : '-'}
                          </TableCell>
                          <TableCell><StatusBadge status={job.status} t={t} /></TableCell>
                          <TableCell><PriorityBadge priority={job.priority} t={t} /></TableCell>
                          <TableCell className="text-muted-foreground">{format(new Date(job.createdAt), 'dd/MM/yyyy')}</TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-40">
                                <DropdownMenuItem onClick={() => navigate(`/jobs/${job.id}`)}>
                                  <Eye className="h-4 w-4 mr-2" />
                                  {t('manager.actions.view')}
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => {
                                  setSelectedJob(job);
                                  setEditedStatus(job.status);
                                  setEditDialogOpen(true);
                                }}>
                                  <Edit className="h-4 w-4 mr-2" />
                                  {t('manager.actions.edit')}
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  className="text-destructive focus:text-destructive"
                                  onClick={() => {
                                    setSelectedJob(job);
                                    setDeleteDialogOpen(true);
                                  }}
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  {t('manager.actions.delete')}
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Performance Tab */}
        <TabsContent value="performance" className="space-y-6 mt-6">
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-xl">{t('manager.mechanicPerformance')}</CardTitle>
              <CardDescription>{t('manager.mechanicPerformanceDescription')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {mechanicStats.map((mech) => (
                <MechanicPerformanceCard
                  key={mech.id}
                  name={mech.name}
                  completedJobs={mech.completedJobs}
                  avgTime={mech.avgTime}
                  activeJobs={mech.activeJobs}
                  efficiency={Math.min(100, Math.round(60 + Math.random() * 40))}
                />
              ))}
              {mechanicStats.length === 0 && (
                <div className="text-center py-12">
                  <Wrench className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                  <p className="text-muted-foreground">{t('manager.noMechanicsData')}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Cost Breakdown */}
          <div className="grid md:grid-cols-2 gap-5">
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg font-semibold">{t('manager.costBreakdown')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center py-2">
                    <span className="text-muted-foreground">{t('manager.laborCost')}</span>
                    <span className="font-semibold">€{kpis.laborCost.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-muted-foreground">{t('manager.partsCost')}</span>
                    <span className="font-semibold">€{kpis.partsCost.toLocaleString()}</span>
                  </div>
                  <div className="border-t pt-4">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold">{t('manager.netProfit')}</span>
                      <div className="flex items-center gap-2">
                        <ArrowUpRight className="h-4 w-4 text-emerald-500" />
                        <span className="text-xl font-bold text-emerald-600">€{kpis.profit.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg font-semibold">{t('manager.jobDistribution')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-muted-foreground">{t('jobs.completed')}</span>
                      <span className="font-medium">{kpis.completedJobs}</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                        style={{ width: `${(kpis.completedJobs / Math.max(kpis.totalJobs, 1)) * 100}%` }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-muted-foreground">{t('jobs.inProgress')}</span>
                      <span className="font-medium">{kpis.activeJobs}</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-blue-500 rounded-full transition-all duration-500"
                        style={{ width: `${(kpis.activeJobs / Math.max(kpis.totalJobs, 1)) * 100}%` }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-muted-foreground">{t('jobs.waitingParts')}</span>
                      <span className="font-medium">{kpis.pendingParts}</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-amber-500 rounded-full transition-all duration-500"
                        style={{ width: `${(kpis.pendingParts / Math.max(kpis.totalJobs, 1)) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-5 mt-6">
          <div className="grid md:grid-cols-2 gap-5">
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg font-semibold">{t('manager.customerInsights')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {customers.slice(0, 5).map((customer, idx) => (
                    <div key={idx} className="flex items-center justify-between p-4 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                          <span className="text-sm font-semibold text-primary">
                            {customer.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium">{customer.name}</p>
                          <p className="text-sm text-muted-foreground">{customer.phone}</p>
                        </div>
                      </div>
                      <Badge variant="secondary" className="font-medium">{customer.jobCount} {t('manager.jobs')}</Badge>
                    </div>
                  ))}
                  {customers.length === 0 && (
                    <div className="text-center py-12">
                      <Users className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                      <p className="text-muted-foreground">No customer data yet</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg font-semibold">{t('manager.recentActivity')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {jobs.slice(0, 5).map((job) => (
                    <div key={job.id} className="flex items-center gap-4 p-4 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors">
                      <div className={cn(
                        "h-2.5 w-2.5 rounded-full flex-shrink-0",
                        job.status === 'completed' ? 'bg-emerald-500' :
                        job.status === 'in_progress' ? 'bg-blue-500' :
                        job.status === 'waiting_for_parts' ? 'bg-amber-500' :
                        'bg-slate-400'
                      )} />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{job.customerName}</p>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(job.updatedAt), 'dd/MM/yyyy HH:mm')}
                        </p>
                      </div>
                      <StatusBadge status={job.status} t={t} />
                    </div>
                  ))}
                  {jobs.length === 0 && (
                    <div className="text-center py-12">
                      <Activity className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                      <p className="text-muted-foreground">No recent activity</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t('manager.deleteJob')}</DialogTitle>
            <DialogDescription>
              {t('manager.deleteJobConfirmation')}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button variant="destructive" onClick={handleDeleteJob}>
              {t('common.delete')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Job Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t('manager.editJob')}</DialogTitle>
            <DialogDescription>
              {t('manager.editJobDescription')}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <label className="text-sm font-medium">{t('manager.table.status')}</label>
            <Select value={editedStatus} onValueChange={(v) => setEditedStatus(v as JobStatus)}>
              <SelectTrigger className="mt-2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="not_started">{t('jobs.notStarted')}</SelectItem>
                <SelectItem value="in_progress">{t('jobs.inProgress')}</SelectItem>
                <SelectItem value="waiting_for_parts">{t('jobs.waitingParts')}</SelectItem>
                <SelectItem value="completed">{t('jobs.completed')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button onClick={handleEditJob}>
              {t('common.save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
