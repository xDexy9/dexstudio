import React from 'react';
import {
  AlertTriangle,
  LucideIcon,
} from 'lucide-react';

import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';
import { JobFormData, JobFormErrors } from '../CreateJobWizard';

interface FaultCategoryStepProps {
  formData: JobFormData;
  errors: JobFormErrors;
  onUpdate: (updates: Partial<JobFormData>) => void;
}

// Each category uses an SVG path icon rendered directly at large size with its color.
// No container box — icon sits clean on the card background.
const FAULT_CATEGORIES: {
  id: string;
  color: string;
  icon: (props: { selected: boolean; color: string }) => React.ReactNode;
}[] = [
  {
    id: 'engine',
    color: '#ef4444',
    icon: ({ selected, color }) => (
      <svg viewBox="0 0 24 24" fill="none" className="w-8 h-8" strokeWidth={1.8}>
        <path d="M3 8h2v2H3zM19 8h2v2h-2zM7 5v2M17 5v2M7 17v2M17 17v2" stroke={color} strokeLinecap="round"/>
        <rect x="5" y="7" width="14" height="10" rx="2" stroke={color} fill={selected ? `${color}20` : 'none'}/>
        <circle cx="9" cy="12" r="1.5" fill={color}/>
        <circle cx="15" cy="12" r="1.5" fill={color}/>
        <path d="M9 12h6" stroke={color} strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    id: 'brakes',
    color: '#f97316',
    icon: ({ selected, color }) => (
      <svg viewBox="0 0 24 24" fill="none" className="w-8 h-8" strokeWidth={1.8}>
        <circle cx="12" cy="12" r="9" stroke={color} fill={selected ? `${color}20` : 'none'}/>
        <circle cx="12" cy="12" r="4" stroke={color}/>
        <path d="M12 3v3M12 18v3M3 12h3M18 12h3" stroke={color} strokeLinecap="round"/>
        <circle cx="12" cy="12" r="1.5" fill={color}/>
      </svg>
    ),
  },
  {
    id: 'electrical',
    color: '#eab308',
    icon: ({ selected, color }) => (
      <svg viewBox="0 0 24 24" fill="none" className="w-8 h-8">
        <path d="M13 2L4.09 12.11A1 1 0 005 13.78h5.5l-1.5 8.22 8.91-10.11A1 1 0 0017 10.22H11.5L13 2z"
          stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"
          fill={selected ? `${color}20` : 'none'}/>
      </svg>
    ),
  },
  {
    id: 'transmission',
    color: '#84cc16',
    icon: ({ selected, color }) => (
      <svg viewBox="0 0 24 24" fill="none" className="w-8 h-8" strokeWidth={1.8}>
        <circle cx="5" cy="6" r="2" stroke={color} fill={selected ? `${color}20` : 'none'}/>
        <circle cx="19" cy="6" r="2" stroke={color} fill={selected ? `${color}20` : 'none'}/>
        <circle cx="12" cy="6" r="2" stroke={color} fill={selected ? `${color}20` : 'none'}/>
        <circle cx="12" cy="18" r="2" stroke={color} fill={selected ? `${color}20` : 'none'}/>
        <path d="M5 8v4h7M19 8v4h-7M12 12v4" stroke={color} strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    id: 'suspension',
    color: '#22c55e',
    icon: ({ selected, color }) => (
      <svg viewBox="0 0 24 24" fill="none" className="w-8 h-8" strokeWidth={1.8}>
        <path d="M12 3v4M12 17v4" stroke={color} strokeLinecap="round"/>
        <path d="M6 7h12M6 17h12" stroke={color} strokeLinecap="round"/>
        <path d="M8 7c0 2.5 2 4 4 4s4-1.5 4-4" stroke={color} fill={selected ? `${color}20` : 'none'} strokeLinecap="round"/>
        <path d="M8 17c0-2.5 2-4 4-4s4 1.5 4 4" stroke={color} fill={selected ? `${color}20` : 'none'} strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    id: 'fluids',
    color: '#06b6d4',
    icon: ({ selected, color }) => (
      <svg viewBox="0 0 24 24" fill="none" className="w-8 h-8" strokeWidth={1.8}>
        <path d="M12 2C6 9 4 13 4 16a8 8 0 0016 0c0-3-2-7-8-14z"
          stroke={color} strokeLinecap="round" strokeLinejoin="round"
          fill={selected ? `${color}30` : 'none'}/>
        <path d="M8 16.5c0 2.2 1.8 4 4 4" stroke={color} strokeLinecap="round" opacity="0.5"/>
      </svg>
    ),
  },
  {
    id: 'cooling',
    color: '#3b82f6',
    icon: ({ selected, color }) => (
      <svg viewBox="0 0 24 24" fill="none" className="w-8 h-8" strokeWidth={1.8}>
        <circle cx="12" cy="12" r="3" stroke={color} fill={selected ? `${color}30` : 'none'}/>
        <path d="M12 2v4M12 18v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M2 12h4M18 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83"
          stroke={color} strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    id: 'air_system',
    color: '#6366f1',
    icon: ({ selected, color }) => (
      <svg viewBox="0 0 24 24" fill="none" className="w-8 h-8" strokeWidth={1.8}>
        <path d="M5 8h8a4 4 0 010 8H5" stroke={color} strokeLinecap="round" fill={selected ? `${color}20` : 'none'}/>
        <path d="M3 12h6" stroke={color} strokeLinecap="round"/>
        <path d="M5 16h5a2 2 0 000-4H5" stroke={color} strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    id: 'lighting',
    color: '#f59e0b',
    icon: ({ selected, color }) => (
      <svg viewBox="0 0 24 24" fill="none" className="w-8 h-8" strokeWidth={1.8}>
        <circle cx="12" cy="12" r="5" stroke={color} fill={selected ? `${color}30` : 'none'}/>
        <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"
          stroke={color} strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    id: 'body',
    color: '#ec4899',
    icon: ({ selected, color }) => (
      <svg viewBox="0 0 24 24" fill="none" className="w-8 h-8" strokeWidth={1.8}>
        <path d="M5 17H3a2 2 0 01-2-2v-4l3-6h12l3 6v4a2 2 0 01-2 2h-2"
          stroke={color} strokeLinecap="round" strokeLinejoin="round"
          fill={selected ? `${color}20` : 'none'}/>
        <circle cx="7.5" cy="17.5" r="2.5" stroke={color} fill={selected ? `${color}30` : 'none'}/>
        <circle cx="16.5" cy="17.5" r="2.5" stroke={color} fill={selected ? `${color}30` : 'none'}/>
        <path d="M5 9h14" stroke={color} strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    id: 'gauges',
    color: '#a855f7',
    icon: ({ selected, color }) => (
      <svg viewBox="0 0 24 24" fill="none" className="w-8 h-8" strokeWidth={1.8}>
        <path d="M12 22a9 9 0 100-18 9 9 0 000 18z" stroke={color} fill={selected ? `${color}20` : 'none'}/>
        <path d="M12 7v1M7 12H6M17 12h1M8.46 8.46l.7.7" stroke={color} strokeLinecap="round"/>
        <path d="M12 12l2.5-3.5" stroke={color} strokeLinecap="round"/>
        <circle cx="12" cy="12" r="1.5" fill={color}/>
      </svg>
    ),
  },
  {
    id: 'wheels',
    color: '#64748b',
    icon: ({ selected, color }) => (
      <svg viewBox="0 0 24 24" fill="none" className="w-8 h-8" strokeWidth={1.8}>
        <circle cx="12" cy="12" r="10" stroke={color} fill={selected ? `${color}20` : 'none'}/>
        <circle cx="12" cy="12" r="3" stroke={color} fill={selected ? `${color}40` : 'none'}/>
        <path d="M12 2v7M12 15v7M2 12h7M15 12h7M5.64 5.64l4.95 4.95M13.41 13.41l4.95 4.95M5.64 18.36l4.95-4.95M13.41 10.59l4.95-4.95"
          stroke={color} strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    id: 'drivetrain',
    color: '#14b8a6',
    icon: ({ selected, color }) => (
      <svg viewBox="0 0 24 24" fill="none" className="w-8 h-8" strokeWidth={1.8}>
        <circle cx="5" cy="12" r="3" stroke={color} fill={selected ? `${color}30` : 'none'}/>
        <circle cx="19" cy="12" r="3" stroke={color} fill={selected ? `${color}30` : 'none'}/>
        <path d="M8 12h8" stroke={color} strokeLinecap="round" strokeDasharray="2 1.5"/>
        <path d="M12 9v6" stroke={color} strokeLinecap="round"/>
        <path d="M10 10l4 4M14 10l-4 4" stroke={color} strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    id: 'audio',
    color: '#0ea5e9',
    icon: ({ selected, color }) => (
      <svg viewBox="0 0 24 24" fill="none" className="w-8 h-8" strokeWidth={1.8}>
        <rect x="3" y="8" width="10" height="8" rx="1" stroke={color} fill={selected ? `${color}20` : 'none'}/>
        <path d="M13 9l4-3v12l-4-3" stroke={color} strokeLinecap="round" strokeLinejoin="round"/>
        <circle cx="8" cy="12" r="2" stroke={color} fill={selected ? `${color}30` : 'none'}/>
      </svg>
    ),
  },
  {
    id: 'accessories',
    color: '#f43f5e',
    icon: ({ selected, color }) => (
      <svg viewBox="0 0 24 24" fill="none" className="w-8 h-8" strokeWidth={1.8}>
        <path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"
          stroke={color} strokeLinecap="round" strokeLinejoin="round"
          fill={selected ? `${color}20` : 'none'}/>
        <circle cx="7" cy="7" r="1.5" fill={color}/>
      </svg>
    ),
  },
] as const;

export function FaultCategoryStep({ formData, errors, onUpdate }: FaultCategoryStepProps) {
  const { t } = useLanguage();

  const getCategoryLabel = (id: string) => t(`modal.parts.category.${id}`);

  const selectedCategories = formData.faultCategory ? formData.faultCategory.split(',') : [];

  const handleCategoryToggle = (categoryId: string) => {
    const newCategories = selectedCategories.includes(categoryId)
      ? selectedCategories.filter(id => id !== categoryId)
      : [...selectedCategories, categoryId];
    onUpdate({ faultCategory: newCategories.length > 0 ? newCategories.join(',') : undefined });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold mb-2">{t('jobs.category.title')}</h2>
        <p className="text-muted-foreground">{t('jobs.category.subtitle')}</p>
      </div>

      <Card className="glass-strong border-0 shadow-premium-lg overflow-hidden">
        <div className="absolute inset-0 gradient-royal-radial opacity-5 pointer-events-none" />
        <CardContent className="pt-6 space-y-4 relative">
          <Label className="flex items-center gap-2 text-base font-semibold">
            <AlertTriangle className="h-5 w-5 text-primary" />
            {t('jobs.category.selectTitle')}
            {selectedCategories.length > 0 && (
              <span className="text-sm font-normal text-muted-foreground">
                ({selectedCategories.length} {t('jobs.category.selected')})
              </span>
            )}
          </Label>

          <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
            {FAULT_CATEGORIES.map((category) => {
              const isSelected = selectedCategories.includes(category.id);

              return (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => handleCategoryToggle(category.id)}
                  className={cn(
                    'flex flex-col items-center gap-2 p-3 rounded-xl border transition-all duration-200 relative',
                    isSelected
                      ? 'border-2 shadow-md'
                      : 'border-border/30 hover:border-border/60 hover:bg-muted/30'
                  )}
                  style={{
                    borderColor: isSelected ? category.color : undefined,
                    backgroundColor: isSelected ? `${category.color}10` : undefined,
                  }}
                >
                  {/* Icon — no background container */}
                  {category.icon({ selected: isSelected, color: category.color })}

                  {/* Label */}
                  <span
                    className={cn(
                      'text-[10px] font-medium text-center leading-tight',
                      isSelected ? 'font-semibold' : 'text-muted-foreground'
                    )}
                    style={{ color: isSelected ? category.color : undefined }}
                  >
                    {getCategoryLabel(category.id)}
                  </span>

                  {/* Selected dot */}
                  {isSelected && (
                    <div
                      className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full"
                      style={{ backgroundColor: category.color }}
                    />
                  )}
                </button>
              );
            })}
          </div>

          {/* Clear Selection */}
          {selectedCategories.length > 0 && (
            <div className="flex justify-center pt-2">
              <button
                type="button"
                onClick={() => onUpdate({ faultCategory: undefined })}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors underline"
              >
                {t('jobs.category.clearAll')}
              </button>
            </div>
          )}

          {/* Hint */}
          <div className="mt-2 p-3 glass-light rounded-xl">
            <p className="text-xs text-muted-foreground text-center">
              💡 {t('jobs.category.hint')}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
