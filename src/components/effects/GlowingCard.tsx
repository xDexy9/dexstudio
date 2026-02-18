import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface GlowingCardProps {
  children: ReactNode;
  className?: string;
  glowColor?: 'primary' | 'accent';
  hover?: boolean;
}

export const GlowingCard = ({ 
  children, 
  className = '', 
  glowColor = 'primary',
  hover = true 
}: GlowingCardProps) => {
  const glowStyles = {
    primary: 'hover:shadow-glow-lg hover:border-primary/50',
    accent: 'hover:shadow-glow-accent hover:border-accent/50',
  };

  return (
    <motion.div
      whileHover={hover ? { y: -5, scale: 1.02 } : undefined}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className={cn(
        'glass-card p-6 transition-all duration-500',
        hover && glowStyles[glowColor],
        className
      )}
    >
      {children}
    </motion.div>
  );
};
