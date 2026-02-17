import React, { useMemo, useState, useEffect } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Briefcase, 
  Users, 
  Car,
  Clock,
  Target,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  Filter,
  BarChart3,
  PieChart,
  Activity,
  Zap
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { getJobs, getVehicles, getMechanics, getUniqueCustomersFromJobs, getMechanicStats } from '@/services/firestoreService';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { StatsCard, StatsCardContainer } from '@/components/ui/stats-card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format, subDays, isWithinInterval, startOfWeek, endOfWeek, eachDayOfInterval } from 'date-fns';
import { cn } from '@/lib/utils';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart as RechartsPieChart, Pie, Cell, AreaChart, Area, Legend } from 'recharts';

// Chart colors
const COLORS = ['hsl(217, 91%, 60%)', 'hsl(142, 76%, 36%)', 'hsl(38, 92%, 50%)', 'hsl(0, 84%, 60%)', 'hsl(280, 65%, 60%)'];

// Metric Card Component
function MetricCard({ 
  title, 
  value, 
  change, 
  changeType, 
  icon: Icon,
  subtitle,
  color = 'primary'
}: { 
  title: string; 
  value: string | number; 
  change?: number;
  changeType?: 'positive' | 'negative' | 'neutral';
  icon: React.ElementType;
  subtitle?: string;
  color?: 'primary' | 'green' | 'blue' | 'amber' | 'violet';
}) {
  const colorStyles = {
    primary: 'from-primary/10 to-primary/5 text-primary',
    green: 'from-emerald-500/10 to-emerald-500/5 text-emerald-600',
    blue: 'from-blue-500/10 to-blue-500/5 text-blue-600',
    amber: 'from-amber-500/10 to-amber-500/5 text-amber-600',
    violet: 'from-violet-500/10 to-violet-500/5 text-violet-600',
  };

  return (
    <Card className="border-0 shadow-sm hover:shadow-md transition-all duration-300">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">{title}</p>
            <p className="text-3xl font-bold tracking-tight">{value}</p>
            {change !== undefined && (
              <div className="flex items-center gap-1.5">
                {changeType === 'positive' ? (
                  <ArrowUpRight className="h-4 w-4 text-emerald-500" />
                ) : changeType === 'negative' ? (
                  <ArrowDownRight className="h-4 w-4 text-red-500" />
                ) : null}
                <span className={cn(
                  "text-sm font-medium",
                  changeType === 'positive' ? 'text-emerald-600' : 
                  changeType === 'negative' ? 'text-red-600' : 'text-muted-foreground'
                )}>
                  {change > 0 ? '+' : ''}{change}%
                </span>
                {subtitle && <span className="text-xs text-muted-foreground">vs last period</span>}
              </div>
            )}
          </div>
          <div className={cn(
            "h-14 w-14 rounded-2xl bg-gradient-to-br flex items-center justify-center",
            colorStyles[color]
          )}>
            <Icon className="h-7 w-7" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function AnalyticsPage() {
  const { t } = useLanguage();
  const [timeRange, setTimeRange] = useState('7d');
  const [jobs, setJobs] = useState<any[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [mechanics, setMechanics] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [mechanicStats, setMechanicStats] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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
      } catch (error) {
        console.error('Error loading analytics data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  // Calculate analytics
  const analytics = useMemo(() => {
    const now = new Date();
    const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
    const periodStart = subDays(now, days);
    const previousPeriodStart = subDays(periodStart, days);

    const currentPeriodJobs = jobs.filter(j => 
      isWithinInterval(new Date(j.createdAt), { start: periodStart, end: now })
    );
    const previousPeriodJobs = jobs.filter(j => 
      isWithinInterval(new Date(j.createdAt), { start: previousPeriodStart, end: periodStart })
    );

    const completedJobs = jobs.filter(j => j.status === 'completed');
    const currentCompleted = currentPeriodJobs.filter(j => j.status === 'completed');
    const previousCompleted = previousPeriodJobs.filter(j => j.status === 'completed');

    // Revenue calculations (mock)
    const avgRevenuePerJob = 350;
    const currentRevenue = currentCompleted.length * avgRevenuePerJob;
    const previousRevenue = previousCompleted.length * avgRevenuePerJob;
    const revenueChange = previousRevenue > 0 
      ? Math.round(((currentRevenue - previousRevenue) / previousRevenue) * 100)
      : 0;

    // Jobs change
    const jobsChange = previousPeriodJobs.length > 0 
      ? Math.round(((currentPeriodJobs.length - previousPeriodJobs.length) / previousPeriodJobs.length) * 100)
      : 0;

    // Customer retention (returning customers)
    const returningCustomers = customers.filter(c => c.jobCount > 1);
    const retentionRate = customers.length > 0 
      ? Math.round((returningCustomers.length / customers.length) * 100)
      : 0;

    // Completion rate
    const completionRate = jobs.length > 0 
      ? Math.round((completedJobs.length / jobs.length) * 100)
      : 0;

    // Status distribution
    const statusDistribution = {
      not_started: jobs.filter(j => j.status === 'not_started').length,
      in_progress: jobs.filter(j => j.status === 'in_progress').length,
      waiting_for_parts: jobs.filter(j => j.status === 'waiting_for_parts').length,
      completed: completedJobs.length,
    };

    // Priority distribution
    const priorityDistribution = {
      urgent: jobs.filter(j => j.priority === 'urgent').length,
      normal: jobs.filter(j => j.priority === 'normal').length,
      low: jobs.filter(j => j.priority === 'low').length,
    };

    // Daily jobs trend
    const dailyJobs = eachDayOfInterval({ start: subDays(now, 6), end: now }).map(date => {
      const dayJobs = jobs.filter(j => 
        format(new Date(j.createdAt), 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')
      );
      return {
        date: format(date, 'EEE'),
        fullDate: format(date, 'dd/MM'),
        jobs: dayJobs.length,
        completed: dayJobs.filter(j => j.status === 'completed').length,
        revenue: dayJobs.filter(j => j.status === 'completed').length * avgRevenuePerJob,
      };
    });

    return {
      totalRevenue: completedJobs.length * avgRevenuePerJob,
      currentRevenue,
      revenueChange,
      totalJobs: jobs.length,
      currentJobs: currentPeriodJobs.length,
      jobsChange,
      totalCustomers: customers.length,
      retentionRate,
      completionRate,
      avgTurnaround: 4.2,
      statusDistribution,
      priorityDistribution,
      dailyJobs,
      mechanicStats,
    };
  }, [jobs, customers, mechanicStats, timeRange]);

  // Chart data
  const statusChartData = [
    { name: 'Not Started', value: analytics.statusDistribution.not_started, color: COLORS[3] },
    { name: 'In Progress', value: analytics.statusDistribution.in_progress, color: COLORS[0] },
    { name: 'Waiting Parts', value: analytics.statusDistribution.waiting_for_parts, color: COLORS[2] },
    { name: 'Completed', value: analytics.statusDistribution.completed, color: COLORS[1] },
  ].filter(d => d.value > 0);

  const priorityChartData = [
    { name: 'Urgent', value: analytics.priorityDistribution.urgent, color: COLORS[3] },
    { name: 'Normal', value: analytics.priorityDistribution.normal, color: COLORS[0] },
    { name: 'Low', value: analytics.priorityDistribution.low, color: COLORS[4] },
  ].filter(d => d.value > 0);

  const mechanicChartData = analytics.mechanicStats.map(m => ({
    name: m.name.split(' ')[0],
    completed: m.completedJobs,
    active: m.activeJobs,
    avgTime: m.avgTime,
  }));

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Loading analytics...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
          <p className="text-muted-foreground">Comprehensive insights into your workshop performance</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-36 h-9 bg-muted/30 border-0">
              <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid lg:grid-cols-3 gap-5">
        {/* Revenue Trend */}
        <Card className="lg:col-span-2 border-0 shadow-sm">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg font-semibold">Revenue & Jobs Trend</CardTitle>
                <CardDescription>Daily performance over the last 7 days</CardDescription>
              </div>
              <Badge variant="secondary" className="font-normal">
                <TrendingUp className="h-3 w-3 mr-1" />
                +{analytics.revenueChange}%
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-[280px] mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={analytics.dailyJobs}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(142, 76%, 36%)" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="hsl(142, 76%, 36%)" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorJobs" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(217, 91%, 60%)" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="hsl(217, 91%, 60%)" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                    }}
                    labelStyle={{ color: 'hsl(var(--foreground))' }}
                  />
                  <Legend />
                  <Area 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="hsl(142, 76%, 36%)" 
                    fillOpacity={1} 
                    fill="url(#colorRevenue)"
                    name="Revenue (€)"
                  />
                  <Area 
                    type="monotone" 
                    dataKey="jobs" 
                    stroke="hsl(217, 91%, 60%)" 
                    fillOpacity={1} 
                    fill="url(#colorJobs)"
                    name="Jobs"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Job Status Distribution */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-semibold">Job Status</CardTitle>
            <CardDescription>Current distribution of jobs</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsPieChart>
                  <Pie
                    data={statusChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {statusChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                </RechartsPieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-2 mt-4">
              {statusChartData.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-muted-foreground">{item.name}</span>
                  </div>
                  <span className="font-medium">{item.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Mechanic Performance & Priority */}
      <div className="grid lg:grid-cols-2 gap-5">
        {/* Mechanic Performance */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg font-semibold">Mechanic Performance</CardTitle>
                <CardDescription>Jobs completed and active per mechanic</CardDescription>
              </div>
              <Activity className="h-5 w-5 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={mechanicChartData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis dataKey="name" type="category" stroke="hsl(var(--muted-foreground))" fontSize={12} width={60} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Legend />
                  <Bar dataKey="completed" fill="hsl(142, 76%, 36%)" name="Completed" radius={[0, 4, 4, 0]} />
                  <Bar dataKey="active" fill="hsl(217, 91%, 60%)" name="Active" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg font-semibold">Quick Stats</CardTitle>
                <CardDescription>Key operational metrics</CardDescription>
              </div>
              <Zap className="h-5 w-5 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Fleet Utilization</span>
                <span className="font-semibold">{Math.round((jobs.filter(j => j.status !== 'completed').length / Math.max(vehicles.length, 1)) * 100)}%</span>
              </div>
              <Progress value={Math.round((jobs.filter(j => j.status !== 'completed').length / Math.max(vehicles.length, 1)) * 100)} className="h-2" />
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Mechanic Capacity</span>
                <span className="font-semibold">{Math.round((jobs.filter(j => j.status === 'in_progress').length / Math.max(mechanics.length * 3, 1)) * 100)}%</span>
              </div>
              <Progress value={Math.round((jobs.filter(j => j.status === 'in_progress').length / Math.max(mechanics.length * 3, 1)) * 100)} className="h-2" />
            </div>

            <div className="pt-4 border-t">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold text-primary">{vehicles.length}</p>
                  <p className="text-xs text-muted-foreground">Vehicles</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-emerald-600">{mechanics.length}</p>
                  <p className="text-xs text-muted-foreground">Mechanics</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-violet-600">{customers.length}</p>
                  <p className="text-xs text-muted-foreground">Customers</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Priority & Performance Summary */}
      <div className="grid lg:grid-cols-3 gap-5">
        {/* Priority Breakdown */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-semibold">Priority Breakdown</CardTitle>
            <CardDescription>Jobs by priority level</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  <span>Urgent</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{analytics.priorityDistribution.urgent}</span>
                  <span className="text-xs text-muted-foreground">
                    ({Math.round((analytics.priorityDistribution.urgent / Math.max(analytics.totalJobs, 1)) * 100)}%)
                  </span>
                </div>
              </div>
              <Progress 
                value={(analytics.priorityDistribution.urgent / Math.max(analytics.totalJobs, 1)) * 100} 
                className="h-2 [&>div]:bg-red-500" 
              />
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-blue-500" />
                  <span>Normal</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{analytics.priorityDistribution.normal}</span>
                  <span className="text-xs text-muted-foreground">
                    ({Math.round((analytics.priorityDistribution.normal / Math.max(analytics.totalJobs, 1)) * 100)}%)
                  </span>
                </div>
              </div>
              <Progress 
                value={(analytics.priorityDistribution.normal / Math.max(analytics.totalJobs, 1)) * 100} 
                className="h-2 [&>div]:bg-blue-500" 
              />
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-slate-400" />
                  <span>Low</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{analytics.priorityDistribution.low}</span>
                  <span className="text-xs text-muted-foreground">
                    ({Math.round((analytics.priorityDistribution.low / Math.max(analytics.totalJobs, 1)) * 100)}%)
                  </span>
                </div>
              </div>
              <Progress 
                value={(analytics.priorityDistribution.low / Math.max(analytics.totalJobs, 1)) * 100} 
                className="h-2 [&>div]:bg-slate-400" 
              />
            </div>
          </CardContent>
        </Card>

        {/* Top Performers */}
        <Card className="lg:col-span-2 border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-semibold">Top Performers</CardTitle>
            <CardDescription>Mechanic leaderboard by completed jobs</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {mechanicStats
                .sort((a, b) => b.completedJobs - a.completedJobs)
                .slice(0, 5)
                .map((mech, idx) => {
                  const efficiency = Math.min(100, 60 + Math.random() * 40);
                  return (
                    <div key={mech.id} className="flex items-center gap-4 p-4 rounded-xl bg-muted/30">
                      <div className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm",
                        idx === 0 ? 'bg-amber-100 text-amber-700' :
                        idx === 1 ? 'bg-slate-100 text-slate-700' :
                        idx === 2 ? 'bg-orange-100 text-orange-700' :
                        'bg-muted text-muted-foreground'
                      )}>
                        {idx + 1}
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold">{mech.name}</p>
                        <p className="text-sm text-muted-foreground">{mech.completedJobs} completed • {mech.avgTime}min avg</p>
                      </div>
                      <div className="text-right">
                        <p className={cn(
                          "text-lg font-bold",
                          efficiency >= 80 ? 'text-emerald-600' : efficiency >= 60 ? 'text-amber-600' : 'text-red-600'
                        )}>
                          {Math.round(efficiency)}%
                        </p>
                        <p className="text-xs text-muted-foreground">Efficiency</p>
                      </div>
                    </div>
                  );
                })}
              {mechanicStats.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No mechanic data available
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
