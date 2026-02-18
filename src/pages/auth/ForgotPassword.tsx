import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Wrench, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ParticleField } from '@/components/effects/ParticleField';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';

const ForgotPassword = () => {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
      <ParticleField count={30} />
      <div className="absolute inset-0 radial-gradient" />
      
      <div className="absolute top-4 right-4 z-20">
        <LanguageSwitcher />
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md relative z-10">
        <div className="glass-card p-8">
          <div className="text-center mb-8">
            <div className="w-12 h-12 rounded-xl bg-glow-gradient flex items-center justify-center shadow-glow mx-auto mb-4">
              <Wrench className="w-6 h-6 text-primary-foreground" />
            </div>
            <h1 className="text-2xl font-bold">{t('auth.resetPassword')}</h1>
            <p className="text-muted-foreground">{t('auth.resetInstructions')}</p>
          </div>
          <form className="space-y-4">
            <div className="space-y-2"><Label>{t('contact.email')}</Label><Input type="email" placeholder={t('contact.emailPlaceholder')} className="bg-secondary/50" required /></div>
            <Button type="submit" className="w-full btn-glow text-primary-foreground">{t('auth.sendResetLink')}</Button>
          </form>
          <Link to="/login" className="flex items-center justify-center gap-2 mt-6 text-muted-foreground hover:text-primary">
            <ArrowLeft className="w-4 h-4" /> {t('auth.backToLogin')}
          </Link>
        </div>
      </motion.div>
    </div>
  );
};

export default ForgotPassword;
