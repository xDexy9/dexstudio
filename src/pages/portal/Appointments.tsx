import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { MainLayout } from '@/components/layout/MainLayout';
import { GlowingCard } from '@/components/effects/GlowingCard';
import { mockAppointments } from '@/data/mockData';
import { motion } from 'framer-motion';

const Appointments = () => {
  const { t } = useTranslation();

  return (
    <MainLayout>
      <section className="pt-32 pb-20">
        <div className="container mx-auto px-4">
          <div className="mb-8"><h1 className="text-3xl font-bold">{t('portal.myAppointments').split(' ')[0]} <span className="text-gradient">{t('portal.myAppointments').split(' ').slice(1).join(' ')}</span></h1></div>
          <div className="space-y-4">
            {mockAppointments.map((apt, i) => (
              <motion.div key={apt.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
                <Link to={`/portal/track/${apt.id}`}>
                  <GlowingCard>
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-semibold">{apt.vehicle.year} {apt.vehicle.make} {apt.vehicle.model}</p>
                        <p className="text-muted-foreground text-sm">{apt.servicesRequested.map(s => s.name).join(', ')}</p>
                        <p className="text-sm text-muted-foreground mt-1">{apt.date} {t('portal.at')} {apt.time} • {t('portal.code')}: {apt.jobCode}</p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-sm capitalize status-${apt.status.replace('_', '-')}`}>{apt.status.replace('_', ' ')}</span>
                    </div>
                  </GlowingCard>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </MainLayout>
  );
};

export default Appointments;
