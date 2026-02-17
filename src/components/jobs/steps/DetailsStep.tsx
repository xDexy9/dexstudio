import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { 
  FileText, 
  AlertTriangle, 
  Wrench, 
  UserCog, 
  Calendar, 
  Clock,
  Search,
  Gauge,
  Shield,
  Settings
} from 'lucide-react';

import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';
import { getMechanics } from '@/services/firestoreService';
import { JobFormData, JobFormErrors } from '../CreateJobWizard';
import { ServiceType } from '@/lib/types';

interface DetailsStepProps {
  formData: JobFormData;
  errors: JobFormErrors;
  onUpdate: (updates: Partial<JobFormData>) => void;
  hideScheduling?: boolean;
}

const serviceTypesBase: {
  value: ServiceType;
  icon: React.ElementType;
  color: string;
  bgGradient: string;
}[] = [
  {
    value: 'repair',
    icon: Wrench,
    color: 'hsl(14, 100%, 57%)', // Orange/Red
    bgGradient: 'linear-gradient(135deg, hsl(14, 100%, 57%) 0%, hsl(14, 100%, 47%) 100%)'
  },
  {
    value: 'maintenance',
    icon: Settings,
    color: 'hsl(217, 91%, 60%)', // Blue
    bgGradient: 'linear-gradient(135deg, hsl(217, 91%, 60%) 0%, hsl(217, 91%, 50%) 100%)'
  },
  {
    value: 'inspection',
    icon: Search,
    color: 'hsl(271, 81%, 56%)', // Purple
    bgGradient: 'linear-gradient(135deg, hsl(271, 81%, 56%) 0%, hsl(271, 81%, 46%) 100%)'
  },
  {
    value: 'diagnostic',
    icon: Gauge,
    color: 'hsl(168, 76%, 42%)', // Teal
    bgGradient: 'linear-gradient(135deg, hsl(168, 76%, 42%) 0%, hsl(168, 76%, 32%) 100%)'
  },
];

export function DetailsStep({ formData, errors, onUpdate, hideScheduling }: DetailsStepProps) {
  const { t } = useLanguage();

  const serviceTypes = serviceTypesBase.map(type => ({
    ...type,
    label: t(`serviceType.${type.value}`),
    description: t(`serviceType.${type.value}Desc`)
  }));

  const durationOptions = [
    { value: 30, label: t('duration.30min') },
    { value: 60, label: t('duration.1hour') },
    { value: 90, label: t('duration.1-5hours') },
    { value: 120, label: t('duration.2hours') },
    { value: 180, label: t('duration.3hours') },
    { value: 240, label: t('duration.4hours') },
    { value: 480, label: t('duration.fullDay') },
  ];
  const [mechanics, setMechanics] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadMechanics = async () => {
      setIsLoading(true);
      try {
        const mechanicsData = await getMechanics();
        setMechanics(mechanicsData);
      } catch (error) {
        console.error('Error loading mechanics:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadMechanics();
  }, []);

  const priorities = [
    { value: 'low', label: t('jobs.priority.low'), color: 'hsl(var(--priority-low))' },
    { value: 'normal', label: t('jobs.priority.normal'), color: 'hsl(var(--priority-normal))' },
    { value: 'urgent', label: t('jobs.priority.urgent'), color: 'hsl(var(--priority-urgent))' },
  ] as const;

  if (isLoading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="text-center py-16">
          <p className="text-muted-foreground text-lg">{t('jobs.details.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold mb-2">{t('jobs.details.title')}</h2>
        <p className="text-muted-foreground">
          {t('jobs.details.subtitle') || 'Configure the service type, schedule, and assignment'}
        </p>
      </div>

      {/* Premium Colorful Service Type Card */}
      <Card className="glass-strong border-0 shadow-premium-lg overflow-hidden">
        <div className="absolute inset-0 gradient-royal-radial opacity-5 pointer-events-none" />
        <CardContent className="pt-6 space-y-4 relative">
          <Label className="flex items-center gap-2 text-base font-semibold">
            <Wrench className="h-5 w-5 text-primary" />
            {t('jobs.details.serviceType')}
          </Label>
          <div className="grid grid-cols-2 gap-4">
            {serviceTypes.map((service) => {
              const Icon = service.icon;
              const isSelected = formData.serviceType === service.value;
              return (
                <button
                  key={service.value}
                  type="button"
                  onClick={() => onUpdate({ serviceType: service.value })}
                  className={cn(
                    "p-5 rounded-xl border-2 text-left transition-all duration-300 group relative overflow-hidden",
                    isSelected
                      ? "scale-[1.05] shadow-xl"
                      : "border-border/30 hover:scale-[1.02] hover:shadow-lg"
                  )}
                  style={{
                    borderColor: isSelected ? service.color : undefined,
                    backgroundColor: isSelected ? `${service.color}10` : undefined,
                  }}
                >
                  {/* Animated gradient background for selected state */}
                  {isSelected && (
                    <div
                      className="absolute inset-0 opacity-10 pointer-events-none"
                      style={{
                        background: service.bgGradient,
                      }}
                    />
                  )}

                  <div className="flex items-center gap-3 mb-2 relative z-10">
                    <div
                      className={cn(
                        "p-2.5 rounded-xl transition-all duration-300 shadow-lg",
                        isSelected && "scale-110"
                      )}
                      style={{
                        background: isSelected ? service.bgGradient : 'hsl(var(--muted))',
                      }}
                    >
                      <Icon
                        className={cn(
                          "h-5 w-5 transition-colors",
                          isSelected ? "text-white" : "text-muted-foreground group-hover:opacity-70"
                        )}
                      />
                    </div>
                    <span
                      className={cn(
                        "font-semibold transition-colors text-foreground",
                        isSelected && "font-bold"
                      )}
                      style={{
                        color: isSelected ? service.color : undefined,
                      }}
                    >
                      {service.label}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground dark:text-muted-foreground/90 relative z-10 leading-relaxed">{service.description}</p>

                  {/* Animated pulse indicator for selected state */}
                  {isSelected && (
                    <div className="absolute top-3 right-3 flex gap-1">
                      <div
                        className="w-2 h-2 rounded-full animate-pulse"
                        style={{ backgroundColor: service.color }}
                      />
                      <div
                        className="w-2 h-2 rounded-full animate-pulse"
                        style={{
                          backgroundColor: service.color,
                          animationDelay: '0.2s'
                        }}
                      />
                    </div>
                  )}

                  {/* Hover gradient effect */}
                  {!isSelected && (
                    <div
                      className="absolute inset-0 opacity-0 group-hover:opacity-5 transition-opacity pointer-events-none"
                      style={{
                        background: service.bgGradient,
                      }}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Premium Problem Description Card */}
      <Card className="glass-strong border-0 shadow-premium-lg overflow-hidden">
        <div className="absolute inset-0 gradient-royal-radial opacity-5 pointer-events-none" />
        <CardContent className="pt-6 space-y-5 relative">
          <div className="space-y-3">
            <Label htmlFor="problemDescription" className="flex items-center gap-2 text-base font-semibold">
              <FileText className="h-5 w-5 text-primary" />
              {t('jobs.problemDescription')} *
            </Label>
            <Textarea
              id="problemDescription"
              value={formData.problemDescription}
              onChange={(e) => onUpdate({ problemDescription: e.target.value })}
              placeholder={t('jobs.details.problemDescPlaceholder')}
              rows={5}
              className={cn(
                "text-base resize-none rounded-xl border-2 transition-all",
                errors.problemDescription
                  ? "border-destructive focus:border-destructive"
                  : "border-border/30 focus:border-primary"
              )}
            />
            {errors.problemDescription && (
              <p className="text-sm text-destructive flex items-center gap-1">
                <span className="text-lg">⚠</span> {errors.problemDescription}
              </p>
            )}
            <div className="flex justify-between items-center">
              <p className="text-xs text-muted-foreground">
                {formData.problemDescription.length >= 10 ? `✓ ${t('jobs.details.goodDescription')}` : t('jobs.details.minChars')}
              </p>
              <p className="text-xs text-muted-foreground">
                {t('jobs.details.charCount').replace('{count}', formData.problemDescription.length.toString())}
              </p>
            </div>
          </div>

          {/* Premium Priority Selection */}
          <div className="space-y-4 pt-2">
            <Label className="flex items-center gap-2 text-base font-semibold">
              <AlertTriangle className="h-5 w-5 text-primary" />
              {t('jobs.priority')}
            </Label>
            <div className="grid grid-cols-3 gap-4">
              {priorities.map((priority) => (
                <button
                  key={priority.value}
                  type="button"
                  onClick={() => onUpdate({ priority: priority.value })}
                  className={cn(
                    "relative p-5 rounded-xl border-2 transition-all duration-300 group",
                    formData.priority === priority.value
                      ? "border-current shadow-glow scale-105"
                      : "border-border/30 hover:border-current/50 hover:scale-[1.02]"
                  )}
                  style={{
                    color: formData.priority === priority.value ? priority.color : undefined,
                    backgroundColor: formData.priority === priority.value ? `${priority.color}15` : undefined,
                  }}
                >
                  <div className="text-center">
                    <div
                      className={cn(
                        "w-6 h-6 rounded-full mx-auto mb-3 transition-all",
                        formData.priority === priority.value && "ring-4 ring-current/30 scale-110"
                      )}
                      style={{ backgroundColor: priority.color }}
                    />
                    <span className={cn(
                      "text-sm font-semibold transition-colors",
                      formData.priority !== priority.value && "text-foreground group-hover:text-current"
                    )}>
                      {priority.label}
                    </span>
                  </div>
                  {formData.priority === priority.value && (
                    <div className="absolute top-2 right-2 w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: priority.color }} />
                  )}
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Premium Scheduling Card — hidden for office staff */}
      {!hideScheduling && (
      <Card className="glass-strong border-0 shadow-premium-lg overflow-hidden">
        <div className="absolute inset-0 gradient-royal-radial opacity-5 pointer-events-none" />
        <CardContent className="pt-6 space-y-5 relative">
          <Label className="flex items-center gap-2 text-base font-semibold">
            <Calendar className="h-5 w-5 text-primary" />
            {t('jobs.details.scheduling')}
          </Label>

          <div className="grid grid-cols-2 gap-4">
            {/* Premium Appointment Date */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">{t('jobs.details.appointmentDate')}</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full h-14 justify-start text-left font-normal rounded-xl border-2 border-border/30 hover:border-primary transition-all",
                      !formData.scheduledDate && "text-muted-foreground"
                    )}
                  >
                    <Calendar className="mr-2 h-5 w-5 text-primary" />
                    {formData.scheduledDate
                      ? format(formData.scheduledDate, "dd/MM/yyyy")
                      : t('jobs.details.selectDate')
                    }
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 z-50 glass-strong shadow-premium-xl border-0" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={formData.scheduledDate}
                    onSelect={(date) => onUpdate({ scheduledDate: date })}
                    disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                    initialFocus
                    className="p-3 pointer-events-auto rounded-xl"
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Premium Estimated Duration */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">{t('jobs.details.estDuration')}</Label>
              <Select
                value={formData.estimatedDuration.toString()}
                onValueChange={(value) => onUpdate({ estimatedDuration: parseInt(value) })}
              >
                <SelectTrigger className="h-14 rounded-xl border-2 border-border/30 hover:border-primary transition-all">
                  <Clock className="mr-2 h-5 w-5 text-primary" />
                  <SelectValue placeholder="Duration" />
                </SelectTrigger>
                <SelectContent className="glass-strong border-0 shadow-premium-lg">
                  {durationOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value.toString()}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Premium Assign Mechanic */}
          <div className="space-y-3 pt-2">
            <Label className="flex items-center gap-2 text-sm font-semibold">
              <UserCog className="h-5 w-5 text-primary" />
              {t('jobs.details.assignMechanic')}
            </Label>
            <Select
              value={formData.assignedMechanicId || "_unassigned"}
              onValueChange={(value) => onUpdate({ assignedMechanicId: value === "_unassigned" ? "" : value })}
            >
              <SelectTrigger className="h-14 rounded-xl border-2 border-border/30 hover:border-primary transition-all">
                <SelectValue placeholder="Select a mechanic..." />
              </SelectTrigger>
              <SelectContent className="glass-strong border-0 shadow-premium-lg">
                <SelectItem value="_unassigned">{t('jobs.details.unassigned')}</SelectItem>
                {mechanics.map((mechanic) => (
                  <SelectItem key={mechanic.id} value={mechanic.id}>
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4" />
                      {mechanic.fullName}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {mechanics.length === 0 && (
              <p className="text-xs text-muted-foreground bg-muted/50 p-3 rounded-lg">
                No mechanics available. Add mechanics in settings.
              </p>
            )}
          </div>
        </CardContent>
      </Card>
      )}
    </div>
  );
}
