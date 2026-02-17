import React from 'react';
import { cn } from '@/lib/utils';

interface LicensePlateProps {
  plateNumber: string;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  className?: string;
}

export function LicensePlate({ plateNumber, size = 'md', className }: LicensePlateProps) {
  const sizeClasses = {
    xs: 'h-5 text-[9px]',
    sm: 'h-6 text-[11px]',
    md: 'h-8 text-[15px]',
    lg: 'h-10 text-[17px]',
  };

  const paddingClasses = {
    xs: 'pl-[14px] pr-1',
    sm: 'pl-[18px] pr-1.5',
    md: 'pl-[24px] pr-2',
    lg: 'pl-[30px] pr-3',
  };

  return (
    <div
      className={cn(
        'relative inline-flex items-center shrink-0 rounded-[3px] overflow-hidden border border-black/30',
        sizeClasses[size],
        className
      )}
    >
      {/* Background plate image */}
      <img
        src="/number-plate.png"
        alt=""
        className="absolute inset-0 w-full h-full object-fill"
        draggable={false}
      />

      {/* License plate text overlay */}
      <span
        className={cn(
          'relative z-10 tracking-wider text-black uppercase whitespace-nowrap',
          paddingClasses[size]
        )}
        style={{
          fontFamily: "'Arial Black', 'Roboto Black', sans-serif",
          fontWeight: 900,
          letterSpacing: '0.1em',
          textShadow: size === 'xs' ? 'none' : '0 0 1px rgba(0,0,0,0.2)',
          WebkitTextStroke: size === 'xs' ? '0.1px black' : '0.3px black',
        }}
      >
        {plateNumber}
      </span>
    </div>
  );
}
