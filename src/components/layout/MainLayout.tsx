import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { Navbar } from './Navbar';
import { Footer } from './Footer';
import { ParticleField } from '@/components/effects/ParticleField';

interface MainLayoutProps {
  children: ReactNode;
  showParticles?: boolean;
}

export const MainLayout = ({ children, showParticles = true }: MainLayoutProps) => {
  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {showParticles && <ParticleField count={30} />}
      
      {/* Radial gradient overlay */}
      <div className="fixed inset-0 radial-gradient pointer-events-none z-0" />
      
      <Navbar />
      
      <motion.main
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        className="relative z-10"
      >
        {children}
      </motion.main>
      
      <Footer />
    </div>
  );
};
