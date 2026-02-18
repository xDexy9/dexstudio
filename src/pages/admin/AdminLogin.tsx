import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Wrench, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ParticleField } from '@/components/effects/ParticleField';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { useToast } from '@/hooks/use-toast';

const AdminLogin = () => {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (email === 'admin' && password === 'admin') {
      localStorage.setItem('isAdminAuthenticated', 'true');
      navigate('/admin/dashboard');
    } else {
      toast({
        title: "Invalid credentials",
        description: "Please use admin / admin to login",
        variant: "destructive",
      });
    }
  };

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
            <div className="w-16 h-16 rounded-xl bg-glow-gradient flex items-center justify-center shadow-glow mx-auto mb-4 relative">
              <Wrench className="w-8 h-8 text-primary-foreground" />
              <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-warning flex items-center justify-center"><Shield className="w-3 h-3 text-warning-foreground" /></div>
            </div>
            <h1 className="text-2xl font-bold">{t('auth.adminPortal')}</h1>
            <p className="text-muted-foreground">{t('auth.authorizedOnly')}</p>
            <p className="text-xs text-muted-foreground mt-2">{t('auth.testCredentials')}</p>
          </div>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label>{t('contact.email')}</Label>
              <Input 
                type="text" 
                placeholder="admin" 
                className="bg-secondary/50" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required 
              />
            </div>
            <div className="space-y-2">
              <Label>{t('auth.password')}</Label>
              <Input 
                type="password" 
                placeholder="••••••••" 
                className="bg-secondary/50" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required 
              />
            </div>
            <Button type="submit" className="w-full btn-glow text-primary-foreground">{t('auth.accessDashboard')}</Button>
          </form>
          <Link to="/" className="block text-center mt-6 text-muted-foreground hover:text-primary text-sm">{t('auth.backToWebsite')}</Link>
        </div>
      </motion.div>
    </div>
  );
};

export default AdminLogin;
