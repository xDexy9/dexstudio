import { motion } from 'framer-motion';
import { Calendar, Car, DollarSign, Clock, TrendingUp } from 'lucide-react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { GlowingCard } from '@/components/effects/GlowingCard';
import { AnimatedCounter } from '@/components/effects/AnimatedCounter';
import { mockDashboardStats, mockRevenueData } from '@/data/mockData';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const stats = [
  { icon: Calendar, label: "Today's Appointments", value: mockDashboardStats.todaysAppointments, color: 'text-primary' },
  { icon: Car, label: 'Cars In Service', value: mockDashboardStats.carsInService, color: 'text-accent' },
  { icon: DollarSign, label: 'Monthly Revenue', value: mockDashboardStats.monthlyRevenue, prefix: '$', color: 'text-success' },
  { icon: Clock, label: 'Pending', value: mockDashboardStats.pendingAppointments, color: 'text-warning' },
];

const pieData = [
  { name: 'Oil Change', value: 35, color: 'hsl(217, 91%, 60%)' },
  { name: 'Brakes', value: 25, color: 'hsl(190, 95%, 50%)' },
  { name: 'Diagnostics', value: 20, color: 'hsl(142, 76%, 46%)' },
  { name: 'Other', value: 20, color: 'hsl(38, 92%, 50%)' },
];

const Dashboard = () => (
  <AdminLayout>
    <section className="p-8">
      <div className="max-w-7xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="text-3xl font-bold">Admin <span className="text-gradient">Dashboard</span></h1>
          <p className="text-muted-foreground">Overview of your garage operations</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, i) => (
            <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
              <GlowingCard>
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center`}>
                    <stat.icon className={`w-6 h-6 ${stat.color}`} />
                  </div>
                  <div>
                    <p className="text-2xl font-bold"><AnimatedCounter target={stat.value} prefix={stat.prefix} /></p>
                    <p className="text-muted-foreground text-sm">{stat.label}</p>
                  </div>
                </div>
              </GlowingCard>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <GlowingCard hover={false}>
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2"><TrendingUp className="w-5 h-5 text-primary" />Revenue Trend</h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={mockRevenueData}>
                  <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }} />
                  <Line type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </GlowingCard>

          <GlowingCard hover={false}>
            <h2 className="text-xl font-semibold mb-4">Services Breakdown</h2>
            <div className="h-64 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                    {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </GlowingCard>
        </div>
      </div>
    </section>
  </AdminLayout>
);

export default Dashboard;
