import { useParams } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { GlowingCard } from '@/components/effects/GlowingCard';
import { mockAppointments } from '@/data/mockData';
import { motion } from 'framer-motion';
import { CheckCircle, Clock, Wrench, Package, Car } from 'lucide-react';

const statusSteps = [
  { status: 'pending', label: 'Pending', icon: Clock },
  { status: 'approved', label: 'Approved', icon: CheckCircle },
  { status: 'in_progress', label: 'In Progress', icon: Wrench },
  { status: 'waiting_parts', label: 'Waiting Parts', icon: Package },
  { status: 'completed', label: 'Completed', icon: CheckCircle },
  { status: 'picked_up', label: 'Picked Up', icon: Car },
];

const Track = () => {
  const { id } = useParams();
  const apt = mockAppointments.find(a => a.id === id) || mockAppointments[0];
  const currentIndex = statusSteps.findIndex(s => s.status === apt.status);

  return (
    <MainLayout>
      <section className="pt-32 pb-20">
        <div className="container mx-auto px-4 max-w-3xl">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
            <h1 className="text-3xl font-bold">Track <span className="text-gradient">Job {apt.jobCode}</span></h1>
            <p className="text-muted-foreground">{apt.vehicle.year} {apt.vehicle.make} {apt.vehicle.model}</p>
          </motion.div>

          <GlowingCard hover={false} className="mb-6">
            <h2 className="text-xl font-semibold mb-6">Progress Timeline</h2>
            <div className="relative">
              <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border" />
              {statusSteps.map((step, i) => {
                const isCompleted = i <= currentIndex;
                const Icon = step.icon;
                return (
                  <div key={step.status} className={`relative flex items-center gap-4 pb-6 ${i === statusSteps.length - 1 ? 'pb-0' : ''}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center z-10 ${isCompleted ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground'}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div><p className={`font-medium ${isCompleted ? 'text-foreground' : 'text-muted-foreground'}`}>{step.label}</p></div>
                  </div>
                );
              })}
            </div>
          </GlowingCard>

          <GlowingCard hover={false}>
            <h2 className="text-xl font-semibold mb-4">Progress Notes</h2>
            {apt.progressNotes.length > 0 ? apt.progressNotes.map(note => (
              <div key={note.id} className="p-4 rounded-lg bg-secondary/50 mb-2">
                <p className="text-sm">{note.content}</p>
                <p className="text-xs text-muted-foreground mt-1">{note.author} • {new Date(note.timestamp).toLocaleString()}</p>
              </div>
            )) : <p className="text-muted-foreground">No notes yet.</p>}
          </GlowingCard>
        </div>
      </section>
    </MainLayout>
  );
};

export default Track;
