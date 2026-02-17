import React from 'react';
import { cn } from '@/lib/utils';

interface UnreadBadgeProps {
  count: number;
  className?: string;
}

export function UnreadBadge({ count, className }: UnreadBadgeProps) {
  if (count <= 0) return null;

  const displayCount = count > 99 ? '99+' : count.toString();

  return (
    <span className={cn("absolute inline-flex", className)}>
      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75" />
      <span className="relative inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold text-white bg-amber-500 rounded-full">
        {displayCount}
      </span>
    </span>
  );
}
