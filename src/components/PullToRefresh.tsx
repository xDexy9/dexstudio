import React, { ReactNode } from 'react';
import { Loader2 } from 'lucide-react';
import { usePullToRefresh } from '@/hooks/usePullToRefresh';
import { cn } from '@/lib/utils';

interface PullToRefreshProps {
  children: ReactNode;
  onRefresh: () => Promise<void> | void;
  className?: string;
}

export function PullToRefresh({ children, onRefresh, className }: PullToRefreshProps) {
  const { isRefreshing, pullDistance, handlers } = usePullToRefresh({ onRefresh });

  const showIndicator = pullDistance > 10 || isRefreshing;
  const isTriggered = pullDistance >= 80 || isRefreshing;

  return (
    <div className={cn("relative", className)} {...handlers}>
      {/* Pull indicator */}
      <div 
        className="absolute left-0 right-0 flex justify-center transition-opacity duration-200 z-10"
        style={{ 
          top: Math.min(pullDistance - 40, 40),
          opacity: showIndicator ? 1 : 0,
        }}
      >
        <div className={cn(
          "w-10 h-10 rounded-full bg-background border shadow-lg flex items-center justify-center transition-transform",
          isTriggered && "scale-110"
        )}>
          <Loader2 
            className={cn(
              "h-5 w-5 text-primary transition-transform",
              isRefreshing && "animate-spin"
            )} 
            style={{ 
              transform: !isRefreshing ? `rotate(${pullDistance * 3}deg)` : undefined 
            }}
          />
        </div>
      </div>

      {/* Content */}
      <div 
        style={{ 
          transform: `translateY(${pullDistance}px)`,
          transition: pullDistance === 0 ? 'transform 0.2s ease-out' : 'none'
        }}
      >
        {children}
      </div>
    </div>
  );
}
