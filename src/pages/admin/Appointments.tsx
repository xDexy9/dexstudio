import { AdminLayout } from '@/components/layout/AdminLayout';
import { GlowingCard } from '@/components/effects/GlowingCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { mockAppointments } from '@/data/mockData';
import { Search } from 'lucide-react';

const Appointments = () => (
  <AdminLayout>
    <section className="p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div><h1 className="text-3xl font-bold">Appointments <span className="text-gradient">Manager</span></h1></div>
          <div className="relative w-64"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" /><Input placeholder="Search..." className="pl-10 bg-secondary/50" /></div>
        </div>
        <GlowingCard hover={false}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Job Code</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Vehicle</TableHead>
                <TableHead>Service</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockAppointments.map(apt => (
                <TableRow key={apt.id}>
                  <TableCell className="font-mono text-primary">{apt.jobCode}</TableCell>
                  <TableCell>{apt.customerName}</TableCell>
                  <TableCell>{apt.vehicle.year} {apt.vehicle.make}</TableCell>
                  <TableCell>{apt.servicesRequested[0]?.name}</TableCell>
                  <TableCell>{apt.date}</TableCell>
                  <TableCell><span className={`px-2 py-1 rounded-full text-xs capitalize status-${apt.status.replace('_', '-')}`}>{apt.status.replace('_', ' ')}</span></TableCell>
                  <TableCell><Button size="sm" variant="outline">View</Button></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </GlowingCard>
      </div>
    </section>
  </AdminLayout>
);

export default Appointments;
