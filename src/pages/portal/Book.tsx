import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { MainLayout } from '@/components/layout/MainLayout';
import { GlowingCard } from '@/components/effects/GlowingCard';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Check, Car, Wrench, Calendar, MessageSquare, Bell, FileCheck } from 'lucide-react';
import { mockVehicles, mockServices } from '@/data/mockData';

const Book = () => {
  const { t } = useTranslation();
  const [step, setStep] = useState(0);
  const formRef = useRef<HTMLDivElement>(null);

  const steps = [
    t('booking.steps.vehicle'),
    t('booking.steps.services'),
    t('booking.steps.dateTime'),
    t('booking.steps.details'),
    t('booking.steps.notifications'),
    t('booking.steps.review')
  ];

  const progress = ((step + 1) / steps.length) * 100;

  useEffect(() => {
    if (formRef.current) {
      formRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, []);

  return (
    <MainLayout>
      <section className="pt-32 pb-20">
        <div ref={formRef} className="container mx-auto px-4 max-w-3xl">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8 text-center">
            <h1 className="text-3xl font-bold">{t('booking.title')} <span className="text-gradient">{t('booking.highlight')}</span></h1>
            <p className="text-muted-foreground">{t('booking.description')}</p>
          </motion.div>

          <div className="mb-8">
            <Progress value={progress} className="h-2" />
            <div className="flex justify-between mt-4">
              {steps.map((s, i) => (
                <div key={s} className={`flex flex-col items-center ${i <= step ? 'text-primary' : 'text-muted-foreground'}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${i < step ? 'bg-primary text-primary-foreground' : i === step ? 'border-2 border-primary' : 'border border-muted-foreground'}`}>
                    {i < step ? <Check className="w-4 h-4" /> : i + 1}
                  </div>
                  <span className="text-xs mt-1 hidden md:block">{s}</span>
                </div>
              ))}
            </div>
          </div>

          <GlowingCard hover={false}>
            {step === 0 && (
              <div className="space-y-4">
                <h2 className="text-xl font-semibold flex items-center gap-2"><Car className="w-5 h-5 text-primary" />{t('booking.selectVehicle')}</h2>
                {mockVehicles.slice(0, 2).map(v => (
                  <div key={v.id} className="p-4 rounded-lg bg-secondary/50 hover:bg-secondary cursor-pointer border-2 border-transparent hover:border-primary transition-colors">
                    <p className="font-medium">{v.year} {v.make} {v.model}</p>
                    <p className="text-sm text-muted-foreground">{v.plate}</p>
                  </div>
                ))}
              </div>
            )}
            {step === 1 && (
              <div className="space-y-4">
                <h2 className="text-xl font-semibold flex items-center gap-2"><Wrench className="w-5 h-5 text-primary" />{t('booking.selectServices')}</h2>
                <div className="grid grid-cols-2 gap-4">
                  {mockServices.map(s => (
                    <div key={s.id} className="p-4 rounded-lg bg-secondary/50 hover:bg-secondary cursor-pointer border-2 border-transparent hover:border-primary">
                      <p className="font-medium">{s.name}</p>
                      <p className="text-sm text-primary">{s.priceRange}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {step >= 2 && step <= 4 && (
              <div className="text-center py-12">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  {step === 2 && <Calendar className="w-8 h-8 text-primary" />}
                  {step === 3 && <MessageSquare className="w-8 h-8 text-primary" />}
                  {step === 4 && <Bell className="w-8 h-8 text-primary" />}
                </div>
                <h2 className="text-xl font-semibold">{steps[step]}</h2>
                <p className="text-muted-foreground">{t('booking.stepContent')}</p>
              </div>
            )}
            {step === 5 && (
              <div className="text-center py-12">
                <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-4">
                  <FileCheck className="w-8 h-8 text-success" />
                </div>
                <h2 className="text-xl font-semibold">{t('booking.reviewConfirm')}</h2>
                <p className="text-muted-foreground mb-4">{t('booking.appointmentDetails')}</p>
                <div className="glass-card p-4 inline-block"><p className="text-2xl font-bold text-gradient">JS-2024-005</p><p className="text-sm text-muted-foreground">{t('booking.yourJobCode')}</p></div>
              </div>
            )}
            <div className="flex justify-between mt-8">
              <Button variant="outline" onClick={() => setStep(s => Math.max(0, s - 1))} disabled={step === 0}>{t('booking.back')}</Button>
              <Button className="btn-glow text-primary-foreground" onClick={() => setStep(s => Math.min(steps.length - 1, s + 1))}>{step === steps.length - 1 ? t('booking.confirmBooking') : t('booking.continue')}</Button>
            </div>
          </GlowingCard>
        </div>
      </section>
    </MainLayout>
  );
};

export default Book;
