import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Car, Wrench, CheckCircle, Clock, AlertTriangle } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useLanguage } from '@/contexts/LanguageContext';
import { getVehicleById, getJobsByVehicle, getUserById } from '@/services/firestoreService';
import { Job, JobStatus } from '@/lib/types';
import { getTranslatedProblemDescription } from '@/lib/jobTranslation';
import { Language } from '@/lib/i18n';

function StatusBadge({ status }: { status: JobStatus }) {
  const { t } = useLanguage();
  
  const config: Record<JobStatus, { class: string; label: string }> = {
    not_started: { class: 'status-not-started', label: t('jobs.notStarted') },
    in_progress: { class: 'status-in-progress', label: t('jobs.inProgress') },
    waiting_for_parts: { class: 'status-waiting', label: t('jobs.waitingParts') },
    completed: { class: 'status-completed', label: t('jobs.completed') },
  };

  const { class: className, label } = config[status];

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${className}`}>
      {label}
    </span>
  );
}

export default function VehicleHistoryPage() {
  const { vehicleId } = useParams();
  const navigate = useNavigate();
  const { t, language: userLanguage } = useLanguage();
  const [vehicle, setVehicle] = useState<any>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      if (!vehicleId) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        const [vehicleData, jobsData] = await Promise.all([
          getVehicleById(vehicleId),
          getJobsByVehicle(vehicleId)
        ]);

        setVehicle(vehicleData);
        const sortedJobs = jobsData.sort((a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        setJobs(sortedJobs);
      } catch (error) {
        console.error('Error loading vehicle history:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [vehicleId]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">{t('common.loading')}</p>
      </div>
    );
  }

  if (!vehicle) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">{t('common.noData')}</p>
      </div>
    );
  }

  const completedJobs = jobs.filter(j => j.status === 'completed');
  const activeJobs = jobs.filter(j => j.status !== 'completed');

  return (
    <div className="safe-top pb-8">
      {/* Header */}
      <div className="px-4 pt-4 pb-4 flex items-center gap-4 border-b">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-xl font-bold">{t('vehicle.history')}</h1>
          <p className="text-sm text-muted-foreground">
            {vehicle.brand} {vehicle.model} • {vehicle.licensePlate}
          </p>
        </div>
      </div>

      <div className="px-4 pt-4 space-y-4">
        {/* Vehicle Summary */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Car className="h-4 w-4" />
              {t('jobs.vehicleInfo')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-muted-foreground">{t('vehicle.brand')}</p>
                <p className="font-medium">{vehicle.brand}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{t('vehicle.model')}</p>
                <p className="font-medium">{vehicle.model}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{t('vehicle.year')}</p>
                <p className="font-medium">{vehicle.year}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{t('vehicle.licensePlate')}</p>
                <p className="font-medium font-mono">{vehicle.licensePlate}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Statistics */}
        <div className="grid grid-cols-3 gap-3">
          <Card className="p-3 text-center">
            <div className="text-2xl font-bold text-primary">{jobs.length}</div>
            <div className="text-xs text-muted-foreground">Total Jobs</div>
          </Card>
          <Card className="p-3 text-center">
            <div className="text-2xl font-bold text-[hsl(var(--status-completed))]">{completedJobs.length}</div>
            <div className="text-xs text-muted-foreground">Completed</div>
          </Card>
          <Card className="p-3 text-center">
            <div className="text-2xl font-bold text-[hsl(var(--status-in-progress))]">{activeJobs.length}</div>
            <div className="text-xs text-muted-foreground">Active</div>
          </Card>
        </div>

        {/* Active Jobs */}
        {activeJobs.length > 0 && (
          <div>
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
              Active Jobs
            </h2>
            <div className="space-y-3">
              {activeJobs.map((job) => (
                <JobHistoryCard key={job.id} job={job} userLanguage={userLanguage} onClick={() => navigate(`/jobs/${job.id}`)} />
              ))}
            </div>
          </div>
        )}

        {/* Completed Jobs */}
        {completedJobs.length > 0 && (
          <div>
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
              Completed Jobs
            </h2>
            <div className="space-y-3">
              {completedJobs.map((job) => (
                <JobHistoryCard key={job.id} job={job} userLanguage={userLanguage} onClick={() => navigate(`/jobs/${job.id}`)} />
              ))}
            </div>
          </div>
        )}

        {jobs.length === 0 && (
          <div className="text-center py-12">
            <Wrench className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">{t('common.noData')}</p>
          </div>
        )}
      </div>
    </div>
  );
}

function JobHistoryCard({ job, userLanguage, onClick }: { job: Job; userLanguage: Language; onClick: () => void }) {
  const mechanic = job.assignedMechanicId ? getUserById(job.assignedMechanicId) : null;
  
  return (
    <Card 
      className="cursor-pointer hover:shadow-md transition-shadow"
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-semibold">
                {new Date(job.createdAt).toLocaleDateString('en-GB')}
              </span>
              <StatusBadge status={job.status} />
            </div>
            <p className="text-sm text-muted-foreground line-clamp-2">
              {getTranslatedProblemDescription(job, userLanguage)}
            </p>
          </div>
        </div>
        <div className="mt-2 flex items-center justify-between text-xs">
          <span className={`font-medium uppercase priority-${job.priority}`}>
            {job.priority}
          </span>
          {mechanic && (
            <span className="text-muted-foreground">
              {mechanic.fullName}
            </span>
          )}
        </div>
        {job.completedAt && (
          <div className="mt-2 flex items-center gap-1 text-xs text-[hsl(var(--status-completed))]">
            <CheckCircle className="h-3 w-3" />
            Completed {new Date(job.completedAt).toLocaleDateString('en-GB')}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
