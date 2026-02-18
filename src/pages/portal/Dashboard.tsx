import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Calendar, Car, Clock, Plus, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MainLayout } from '@/components/layout/MainLayout';
import { GlowingCard } from '@/components/effects/GlowingCard';
import { mockAppointments, mockVehicles, mockUsers } from '@/data/mockData';

const user = mockUsers[0];
const userVehicles = mockVehicles.filter(v => v.customerId === user.id);
const userAppointments = mockAppointments.filter(a => a.customerId === user.id);

const Dashboard = () => {
  const { t } = useTranslation();

  const stats = [
    { icon: Calendar, label: t('portal.activeAppointments'), value: userAppointments.filter(a => a.status !== 'picked_up').length },
    { icon: Car, label: t('portal.myVehicles'), value: userVehicles.length },
    { icon: Clock, label: t('portal.totalVisits'), value: userAppointments.length },
  ];

  return (
    <MainLayout>
      <section className="pt-32 pb-20">
        <div className="container mx-auto px-4">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
            <h1 className="text-3xl font-bold">{t('portal.welcomeBack')} <span className="text-gradient">{user.name.split(' ')[0]}</span></h1>
            <p className="text-muted-foreground">{t('portal.manageVehicles')}</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {stats.map((stat, i) => (
              <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
                <GlowingCard>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                      <stat.icon className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{stat.value}</p>
                      <p className="text-muted-foreground text-sm">{stat.label}</p>
                    </div>
                  </div>
                </GlowingCard>
              </motion.div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <GlowingCard hover={false}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">{t('portal.upcomingAppointments')}</h2>
                <Link to="/portal/appointments"><Button variant="ghost" size="sm">{t('portal.viewAll')} <ChevronRight className="w-4 h-4" /></Button></Link>
              </div>
              {userAppointments.slice(0, 3).map(apt => (
                <Link key={apt.id} to={`/portal/track/${apt.id}`} className="block p-4 rounded-lg bg-secondary/50 hover:bg-secondary mb-2">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium">{apt.vehicle.make} {apt.vehicle.model}</p>
                      <p className="text-sm text-muted-foreground">{apt.date} {t('portal.at')} {apt.time}</p>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs capitalize status-${apt.status.replace('_', '-')}`}>{apt.status.replace('_', ' ')}</span>
                  </div>
                </Link>
              ))}
            </GlowingCard>

            <GlowingCard hover={false}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">{t('portal.quickActions')}</h2>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Link to="/portal/book"><Button className="w-full btn-glow h-20 flex-col gap-2 text-primary-foreground"><Plus className="w-6 h-6" />{t('portal.bookAppointment')}</Button></Link>
                <Link to="/portal/vehicles"><Button variant="outline" className="w-full h-20 flex-col gap-2"><Car className="w-6 h-6" />{t('portal.myVehicles')}</Button></Link>
              </div>
            </GlowingCard>
          </div>
        </div>
      </section>
    </MainLayout>
  );
};

export default Dashboard;
