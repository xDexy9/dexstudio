import { AdminLayout } from '@/components/layout/AdminLayout';
import { GlowingCard } from '@/components/effects/GlowingCard';
import { Button } from '@/components/ui/button';
import { mockRevenueData } from '@/data/mockData';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { Download } from 'lucide-react';

const Reports = () => (
  <AdminLayout>
    <section className="p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">Reports & <span className="text-gradient">Analytics</span></h1>
          <Button className="btn-glow gap-2 text-primary-foreground"><Download className="w-4 h-4" />Export CSV</Button>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <GlowingCard hover={false}>
            <h2 className="text-xl font-semibold mb-4">Monthly Revenue</h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={mockRevenueData}><XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" /><YAxis stroke="hsl(var(--muted-foreground))" /><Tooltip /><Line type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" strokeWidth={2} /></LineChart>
              </ResponsiveContainer>
            </div>
          </GlowingCard>
          <GlowingCard hover={false}>
            <h2 className="text-xl font-semibold mb-4">Appointments by Month</h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={mockRevenueData}><XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" /><YAxis stroke="hsl(var(--muted-foreground))" /><Tooltip /><Bar dataKey="appointments" fill="hsl(var(--accent))" /></BarChart>
              </ResponsiveContainer>
            </div>
          </GlowingCard>
        </div>
      </div>
    </section>
  </AdminLayout>
);

export default Reports;
