import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { AlertCircle, X } from 'lucide-react';
import { User } from '@/lib/types';
import { getUserAvatarUrl } from '@/lib/avatarUtils';
import { cn } from '@/lib/utils';

interface MechanicAssignMenuProps {
  assignedMechanicId?: string;
  mechanics: User[];
  onAssign: (mechanicId: string) => void;
}

export function MechanicAssignMenu({ assignedMechanicId, mechanics, onAssign }: MechanicAssignMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [center, setCenter] = useState({ x: 0, y: 0 });

  const assignedMechanic = assignedMechanicId
    ? mechanics.find(m => m.id === assignedMechanicId)
    : null;

  // Compute trigger center in viewport when opening
  useEffect(() => {
    if (!isOpen || !triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    setCenter({
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
    });
  }, [isOpen]);

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: MouseEvent) => {
      if (
        menuRef.current && !menuRef.current.contains(e.target as Node) &&
        triggerRef.current && !triggerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [isOpen]);

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsOpen(!isOpen);
  };

  const handleSelect = (e: React.MouseEvent, mechanicId: string) => {
    e.stopPropagation();
    onAssign(mechanicId);
    setIsOpen(false);
  };

  const avatarUrl = assignedMechanic
    ? getUserAvatarUrl(assignedMechanic.email) || undefined
    : undefined;

  // Filter out dexanu
  const filteredMechanics = mechanics.filter(m =>
    !m.fullName.toLowerCase().includes('dexanu') &&
    !m.email.toLowerCase().includes('dexanu')
  );

  // Full circle radial positions
  const getRadialPosition = (index: number, total: number) => {
    const angleStep = 360 / total;
    const angle = -90 + angleStep * index;
    const radius = 70;
    const rad = (angle * Math.PI) / 180;
    return {
      x: Math.cos(rad) * radius,
      y: Math.sin(rad) * radius,
    };
  };

  return (
    <>
      {/* Trigger button */}
      <button
        ref={triggerRef}
        onClick={handleToggle}
        className={cn(
          "relative w-9 h-9 rounded-full flex items-center justify-center transition-all duration-300 border-2",
          assignedMechanic
            ? "border-primary/30 bg-primary/5 hover:border-primary/60"
            : "border-destructive/50 bg-destructive/10 hover:border-destructive/80"
        )}
        title={assignedMechanic ? assignedMechanic.fullName : 'Unassigned'}
      >
        {assignedMechanic ? (
          avatarUrl ? (
            <img
              src={avatarUrl}
              alt={assignedMechanic.fullName}
              className="w-7 h-7 rounded-full object-cover"
            />
          ) : (
            <span className="text-xs font-bold text-primary">
              {assignedMechanic.fullName.split(' ').map(n => n[0]).join('').slice(0, 2)}
            </span>
          )
        ) : (
          <>
            <AlertCircle className="h-4 w-4 text-destructive" />
            <span className="absolute inset-0 rounded-full border-2 border-destructive/60 animate-ping opacity-40" />
          </>
        )}
      </button>

      {/* Portal: render radial menu at document body level so it floats over everything */}
      {isOpen && createPortal(
        <>
          {/* Invisible click-away layer */}
          <div
            className="fixed inset-0"
            style={{ zIndex: 9998 }}
            onClick={(e) => { e.stopPropagation(); setIsOpen(false); }}
          />
          {/* Radial menu centered on trigger */}
          <div
            ref={menuRef}
            className="fixed"
            style={{
              left: center.x,
              top: center.y,
              zIndex: 9999,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Center close button */}
            <button
              onClick={(e) => { e.stopPropagation(); setIsOpen(false); }}
              className="absolute w-10 h-10 rounded-full bg-background border-2 border-border shadow-lg flex items-center justify-center hover:bg-muted transition-colors"
              style={{ left: -20, top: -20, zIndex: 10 }}
            >
              <X className="h-4 w-4 text-muted-foreground" />
            </button>

            {/* Mechanic items */}
            {filteredMechanics.map((mechanic, index) => {
              const pos = getRadialPosition(index, filteredMechanics.length);
              const mechAvatarUrl = getUserAvatarUrl(mechanic.email);
              const isAssigned = mechanic.id === assignedMechanicId;

              return (
                <button
                  key={mechanic.id}
                  onClick={(e) => handleSelect(e, mechanic.id)}
                  className={cn(
                    "absolute flex flex-col items-center gap-0.5 transition-all duration-300 group",
                    "animate-scale-in"
                  )}
                  style={{
                    left: pos.x - 24,
                    top: pos.y - 24,
                    animationDelay: `${index * 50}ms`,
                  }}
                >
                  <div className={cn(
                    "w-11 h-11 rounded-full flex items-center justify-center border-2 shadow-md transition-all",
                    "hover:scale-110 hover:shadow-lg",
                    isAssigned
                      ? "border-primary bg-primary/10 ring-2 ring-primary/30"
                      : "border-border bg-background hover:border-primary/50"
                  )}>
                    {mechAvatarUrl ? (
                      <img
                        src={mechAvatarUrl}
                        alt={mechanic.fullName}
                        className="w-9 h-9 rounded-full object-cover"
                      />
                    ) : (
                      <span className="text-xs font-bold text-foreground">
                        {mechanic.fullName.split(' ').map(n => n[0]).join('').slice(0, 2)}
                      </span>
                    )}
                  </div>
                  <span className={cn(
                    "text-[10px] font-medium px-1.5 py-0.5 rounded-full whitespace-nowrap max-w-[80px] truncate",
                    "bg-background/95 shadow-sm border border-border/50",
                    isAssigned ? "text-primary font-bold" : "text-foreground"
                  )}>
                    {mechanic.fullName.split(' ')[0]}
                  </span>
                </button>
              );
            })}
          </div>
        </>,
        document.body
      )}
    </>
  );
}
