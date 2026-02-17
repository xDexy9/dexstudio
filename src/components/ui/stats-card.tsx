import * as React from "react";
import { cn } from "@/lib/utils";

interface StatsCardProps {
  heading: string;
  value: string | number;
  icon?: React.ReactNode;
  iconSrc?: string;
  iconColor?: string;
  className?: string;
}

export function StatsCard({ heading, value, icon, iconSrc, iconColor = "text-primary", className }: StatsCardProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-start justify-between flex-1 min-w-0 h-[90px] rounded-[20px] bg-card p-3 sm:p-4",
        "shadow-[20px_20px_60px_#e6e6e6,-20px_-20px_60px_#f3f3f3]",
        "dark:shadow-[20px_20px_60px_#1a1a1a,-20px_-20px_60px_#2a2a2a]",
        className
      )}
    >
      <p className="text-[0.6em] sm:text-[0.7em] font-bold tracking-wider text-muted-foreground uppercase truncate w-full">
        {heading}
      </p>
      <div className="w-full flex items-center justify-between">
        {iconSrc ? (
          <img src={iconSrc} alt={heading} className="w-7 h-7 sm:w-9 sm:h-9 object-contain" />
        ) : (
          <div className={cn("w-7 h-7 flex items-center justify-center", iconColor)}>
            {icon}
          </div>
        )}
        <p className="text-lg sm:text-xl font-bold">{value}</p>
      </div>
    </div>
  );
}

interface StatsCardContainerProps {
  children: React.ReactNode;
  className?: string;
}

export function StatsCardContainer({ children, className }: StatsCardContainerProps) {
  return (
    <div className={cn("flex items-center justify-center gap-2 [&>*]:flex-1 [&>*]:min-w-0", className)}>
      {children}
    </div>
  );
}
