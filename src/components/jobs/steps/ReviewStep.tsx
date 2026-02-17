import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import {
  Eye,
  User,
  Car,
  FileText,
  Pencil,
  Mail,
  Phone,
  StickyNote,
  Calendar,
  Clock,
  UserCog,
  Wrench,
  Gauge,
  Sparkles,
  AlertTriangle
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useLanguage } from '@/contexts/LanguageContext';
import { getUserById } from '@/services/firestoreService';
import { JobFormData } from '../CreateJobWizard';
import { Vehicle } from '@/lib/types';

interface ReviewStepProps {
  formData: JobFormData;
  selectedVehicle: Vehicle | null;
  onEdit: (step: number) => void;
  hideScheduling?: boolean;
}

export function ReviewStep({ formData, selectedVehicle, onEdit, hideScheduling }: ReviewStepProps) {
  const { t } = useLanguage();

  const serviceTypeLabels = {
    repair: t('serviceType.repair'),
    maintenance: t('serviceType.maintenance'),
    inspection: t('serviceType.inspection'),
    diagnostic: t('serviceType.diagnostic'),
  };

  const durationLabels: Record<number, string> = {
    30: t('duration.30min'),
    60: t('duration.1hour'),
    90: t('duration.1-5hours'),
    120: t('duration.2hours'),
    180: t('duration.3hours'),
    240: t('duration.4hours'),
    480: t('duration.fullDay'),
  };
  const [assignedMechanic, setAssignedMechanic] = useState<any>(null);

  const priorityColors = {
    low: 'hsl(var(--priority-low))',
    normal: 'hsl(var(--priority-normal))',
    urgent: 'hsl(var(--priority-urgent))',
  };

  useEffect(() => {
    const loadMechanic = async () => {
      if (formData.assignedMechanicId) {
        const mechanic = await getUserById(formData.assignedMechanicId);
        setAssignedMechanic(mechanic);
      } else {
        setAssignedMechanic(null);
      }
    };
    loadMechanic();
  }, [formData.assignedMechanicId]);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold mb-2">{t('jobs.review.title')}</h2>
        <p className="text-muted-foreground">
          {t('jobs.review.subtitle')}
        </p>
      </div>

      {/* Vehicle Card - Step 0 */}
      <Card className="glass-strong border-0 shadow-premium-lg overflow-hidden group hover-lift">
        <div className="absolute inset-0 gradient-royal-radial opacity-5 pointer-events-none" />
        <CardHeader className="pb-3 flex flex-row items-center justify-between relative border-b border-border/30">
          <CardTitle className="text-base flex items-center gap-2 font-semibold">
            <div className="p-2 rounded-lg bg-primary/10">
              <Car className="h-5 w-5 text-primary" />
            </div>
            {t('jobs.review.vehicle')}
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEdit(0)}
            className="hover:bg-primary/10 hover:text-primary transition-all"
          >
            <Pencil className="h-4 w-4 mr-1" />
            {t('jobs.review.edit')}
          </Button>
        </CardHeader>
        <CardContent className="pt-4 relative">
          {selectedVehicle && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 gradient-royal rounded-xl flex items-center justify-center shadow-glow">
                  <Car className="h-6 w-6 text-white" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-lg text-foreground">
                    {selectedVehicle.brand} {selectedVehicle.model}
                  </p>
                  <p className="text-sm text-muted-foreground font-medium">
                    {selectedVehicle.year} • {selectedVehicle.licensePlate}
                  </p>
                </div>
              </div>

              {(selectedVehicle.vin || formData.mileage) && (
                <div className="grid grid-cols-2 gap-3 pt-2">
                  {selectedVehicle.vin && (
                    <div className="p-3 glass-light rounded-lg">
                      <span className="text-xs text-muted-foreground block mb-1">VIN</span>
                      <span className="font-mono text-xs font-medium">{selectedVehicle.vin}</span>
                    </div>
                  )}
                  {formData.mileage && (
                    <div className="flex items-center gap-2 p-3 glass-light rounded-lg">
                      <Gauge className="h-5 w-5 text-primary" />
                      <div>
                        <span className="text-xs text-muted-foreground block">{t('jobs.review.kilometers')}</span>
                        <span className="font-semibold">{parseInt(formData.mileage).toLocaleString()} km</span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Customer Card - Step 1 */}
      <Card className="glass-strong border-0 shadow-premium-lg overflow-hidden group hover-lift">
        <div className="absolute inset-0 gradient-royal-radial opacity-5 pointer-events-none" />
        <CardHeader className="pb-3 flex flex-row items-center justify-between relative border-b border-border/30">
          <CardTitle className="text-base flex items-center gap-2 font-semibold">
            <div className="p-2 rounded-lg bg-primary/10">
              <User className="h-5 w-5 text-primary" />
            </div>
            {t('jobs.review.customer')}
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEdit(1)}
            className="hover:bg-primary/10 hover:text-primary transition-all"
          >
            <Pencil className="h-4 w-4 mr-1" />
            {t('jobs.review.edit')}
          </Button>
        </CardHeader>
        <CardContent className="space-y-4 pt-4 relative">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 gradient-royal rounded-xl flex items-center justify-center shadow-glow">
              <User className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-lg text-foreground">{formData.customerName}</p>
              {formData.isReturningCustomer && (
                <Badge className="text-xs bg-gold/10 text-gold-foreground border-gold/30 mt-1">
                  <Sparkles className="h-3 w-3 mr-1" />
                  {t('jobs.review.returningCustomer')}
                </Badge>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-2">
            <div className="flex items-center gap-2 p-3 glass-light rounded-lg">
              <Phone className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">{formData.customerPhone}</span>
            </div>
            {formData.customerEmail && (
              <div className="flex items-center gap-2 p-3 glass-light rounded-lg">
                <Mail className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium truncate">{formData.customerEmail}</span>
              </div>
            )}
          </div>

          {formData.customerNotes && (
            <>
              <Separator />
              <div className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg">
                <StickyNote className="h-4 w-4 text-primary mt-0.5" />
                <span className="text-sm text-foreground">{formData.customerNotes}</span>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Job Details Card - Step 2 */}
      <Card className="glass-strong border-0 shadow-premium-lg overflow-hidden group hover-lift">
        <div className="absolute inset-0 gradient-royal-radial opacity-5 pointer-events-none" />
        <CardHeader className="pb-3 flex flex-row items-center justify-between relative border-b border-border/30">
          <CardTitle className="text-base flex items-center gap-2 font-semibold">
            <div className="p-2 rounded-lg bg-primary/10">
              <FileText className="h-5 w-5 text-primary" />
            </div>
            {t('jobs.review.jobDetails')}
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEdit(2)}
            className="hover:bg-primary/10 hover:text-primary transition-all"
          >
            <Pencil className="h-4 w-4 mr-1" />
            {t('jobs.review.edit')}
          </Button>
        </CardHeader>
        <CardContent className="space-y-5 pt-4 relative">
          {/* Service Type & Priority Badges */}
          <div className="flex flex-wrap gap-3">
            <Badge className="flex items-center gap-2 px-4 py-2 text-sm bg-primary/10 text-primary border-primary/30">
              <Wrench className="h-4 w-4" />
              {serviceTypeLabels[formData.serviceType]}
            </Badge>
            <Badge
              className="flex items-center gap-2 px-4 py-2 text-sm font-semibold"
              style={{
                backgroundColor: `${priorityColors[formData.priority]}20`,
                color: priorityColors[formData.priority],
                borderColor: priorityColors[formData.priority],
              }}
            >
              <span
                className="w-3 h-3 rounded-full animate-pulse"
                style={{ backgroundColor: priorityColors[formData.priority] }}
              />
              {t(`jobs.priority.${formData.priority}`)}
            </Badge>
          </div>

          {/* Fault Categories */}
          {formData.faultCategory && (
            <div className="p-4 glass-light rounded-xl">
              <p className="text-xs text-muted-foreground font-semibold mb-3 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                {t('jobDetail.affectedAreas')}
              </p>
              <div className="flex flex-wrap gap-2">
                {formData.faultCategory.split(',').map((cat, i) => (
                  <Badge key={i} variant="outline" className="text-sm">
                    {t(`modal.parts.category.${cat.trim()}`)}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Description */}
          <div className="p-4 glass-light rounded-xl">
            <p className="text-xs text-muted-foreground font-semibold mb-2">{t('jobs.review.problemDescription')}</p>
            <p className="text-sm text-foreground leading-relaxed">{formData.problemDescription}</p>
          </div>

          {!hideScheduling && (
          <>
          <Separator />

          {/* Schedule & Assignment Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-3 p-4 glass-light rounded-xl">
              <div className="p-2 rounded-lg bg-primary/10">
                <Calendar className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium">{t('jobs.review.scheduled')}</p>
                <p className="font-semibold text-sm">
                  {formData.scheduledDate
                    ? format(formData.scheduledDate, "dd/MM/yyyy")
                    : t('jobs.review.notScheduled')
                  }
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 glass-light rounded-xl">
              <div className="p-2 rounded-lg bg-primary/10">
                <Clock className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium">{t('jobs.review.duration')}</p>
                <p className="font-semibold text-sm">{durationLabels[formData.estimatedDuration] || `${formData.estimatedDuration} min`}</p>
              </div>
            </div>
          </div>

          {assignedMechanic && (
            <div className="flex items-center gap-3 p-4 gradient-royal rounded-xl shadow-glow min-h-[72px]">
              <UserCog className="h-6 w-6 text-white flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-white/80 font-medium">{t('jobs.review.assignedTo')}</p>
                <p className="font-semibold text-white break-words">{assignedMechanic.fullName}</p>
              </div>
            </div>
          )}
          </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
