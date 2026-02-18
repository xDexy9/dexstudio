import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Wrench } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ParticleField } from '@/components/effects/ParticleField';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';

const Register = () => {
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
            <Link to="/" className="inline-flex items-center gap-2 mb-4">
              <div className="w-12 h-12 rounded-xl bg-glow-gradient flex items-center justify-center shadow-glow">
                <Wrench className="w-6 h-6 text-primary-foreground" />
              </div>
            </Link>
            <h1 className="text-2xl font-bold">{t('auth.createAccount')}</h1>
            <p className="text-muted-foreground">{t('auth.joinUs')}</p>
          </div>
          <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); window.location.href = '/portal'; }}>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>{t('auth.firstName')}</Label><Input placeholder="John" className="bg-secondary/50" required /></div>
              <div className="space-y-2"><Label>{t('auth.lastName')}</Label><Input placeholder="Smith" className="bg-secondary/50" required /></div>
            </div>
            <div className="space-y-2"><Label>{t('contact.email')}</Label><Input type="email" placeholder={t('contact.emailPlaceholder')} className="bg-secondary/50" required /></div>
            <div className="space-y-2"><Label>{t('contact.phone')}</Label><Input type="tel" placeholder={t('contact.phonePlaceholder')} className="bg-secondary/50" /></div>
            <div className="space-y-2"><Label>{t('auth.password')}</Label><Input type="password" placeholder="••••••••" className="bg-secondary/50" required /></div>
            <Button type="submit" className="w-full btn-glow text-primary-foreground">{t('auth.createAccountBtn')}</Button>
          </form>
          <p className="text-center mt-6 text-muted-foreground">{t('auth.alreadyHaveAccount')} <Link to="/login" className="text-primary hover:underline">{t('auth.signIn')}</Link></p>
        </div>
      </motion.div>
    </div>
  );
};

export default Register;
