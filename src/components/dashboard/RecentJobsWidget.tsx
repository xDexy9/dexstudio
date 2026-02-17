import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { TrendingUp, Briefcase } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { Job, Vehicle, User } from '@/lib/types';
import { getVehicleById } from '@/services/firestoreService';
import { getTranslatedProblemDescription } from '@/lib/jobTranslation';
import { LicensePlate } from '@/components/ui/license-plate';
import { CarBrandLogo } from '@/components/ui/car-brand-logo';
import { MechanicAssignMenu } from './MechanicAssignMenu';
import { Language } from '@/lib/i18n';

interface RecentJobsWidgetProps {
  jobs: Job[];
  mechanics?: User[];
  onAssignMechanic?: (jobId: string, mechanicId: string) => void;
}

function JobCard({ job, userLanguage, mechanics, onAssignMechanic }: { job: Job; userLanguage: Language; mechanics?: User[]; onAssignMechanic?: (jobId: string, mechanicId: string) => void }) {
  const navigate = useNavigate();
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const { t } = useLanguage();

  useEffect(() => {
    if (job.vehicleId && !job.vehicleLicensePlate) {
      getVehicleById(job.vehicleId).then(setVehicle);
    }
  }, [job.vehicleId, job.vehicleLicensePlate]);

  const licensePlate = job.vehicleLicensePlate || vehicle?.licensePlate;
  const brand = job.vehicleBrand || vehicle?.brand;
  const model = job.vehicleModel || vehicle?.model;

  const statusConfig: Record<string, { class: string; label: string }> = {
    not_started: { class: 'status-not-started', label: t('jobs.notStarted') },
    in_progress: { class: 'status-in-progress', label: t('jobs.inProgress') },
    waiting_for_parts: { class: 'status-waiting', label: t('jobs.waitingParts') },
    completed: { class: 'status-completed', label: t('jobs.completed') },
    ready_for_pickup: { class: 'status-completed', label: t('jobs.completed') },
  };

  const status = statusConfig[job.status] || { class: '', label: job.status };

  return (
    <Card
      className="cursor-pointer hover:shadow-md transition-shadow"
      onClick={() => navigate(`/jobs/${job.id}`)}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <CarBrandLogo brand={brand || ''} size="sm" className="text-primary shrink-0" />
              {licensePlate ? (
                <LicensePlate plateNumber={licensePlate} size="xs" />
              ) : (
                <span className="text-xs text-muted-foreground">{t('jobs.noVehicle')}</span>
              )}
            </div>
            {(brand || model) && (
              <p className="text-xs text-muted-foreground mt-1 truncate">
                {brand} {model}
              </p>
            )}
          </div>
          <div className="flex flex-col items-end gap-1.5 shrink-0">
            <span className={`badge-premium ${status.class} text-xs px-2 py-0.5 whitespace-nowrap`}>
              {status.label}
            </span>
            {mechanics && onAssignMechanic && (
              <MechanicAssignMenu
                assignedMechanicId={job.assignedMechanicId}
                mechanics={mechanics}
                onAssign={(mechanicId) => onAssignMechanic(job.id, mechanicId)}
              />
            )}
          </div>
        </div>
        <p className="text-xs text-muted-foreground line-clamp-1">
          {getTranslatedProblemDescription(job, userLanguage)}
        </p>
      </CardContent>
    </Card>
  );
}

export function RecentJobsWidget({ jobs, mechanics, onAssignMechanic }: RecentJobsWidgetProps) {
  const { t, language: userLanguage } = useLanguage();
  const navigate = useNavigate();

  return (
    <Card className="card-glass h-full flex flex-col">
      <CardHeader className="pb-2 p-4 flex flex-row items-center justify-between flex-shrink-0">
        <CardTitle className="text-xl font-bold flex items-center gap-3">
          <TrendingUp className="h-7 w-7 text-blue-500" />
          {t('dashboard.recentJobs')}
        </CardTitle>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/jobs')}
          className="hover:bg-primary/10 hover:text-primary"
        >
          {t('common.viewAll')}
        </Button>
      </CardHeader>
      <CardContent className="p-4 pt-0 flex-1 overflow-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {jobs.slice(0, 6).map((job, index) => (
            <div key={job.id} className="animate-slide-up" style={{ animationDelay: `${index * 50}ms` }}>
              <JobCard job={job} userLanguage={userLanguage} mechanics={mechanics} onAssignMechanic={onAssignMechanic} />
            </div>
          ))}
        </div>
        {jobs.length === 0 && (
          <div className="text-center py-8">
            <Briefcase className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-muted-foreground text-sm">{t('jobs.noRecentJobs')}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
