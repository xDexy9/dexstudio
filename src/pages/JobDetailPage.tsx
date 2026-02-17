import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Car,
  Phone,
  MessageSquare,
  User,
  Clock,
  CheckCircle,
  Package,
  Play,
  AlertTriangle,
  Languages,
  FileText,
  Gauge,
  Fuel,
  Hash,
  Calendar,
  Wrench,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  X,
  Mail,
  Receipt,
  Trophy,
  Warehouse,
  ShoppingCart,
  Pencil,
  Check,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { getVehicleById, getUserById, updateJob, getJobsByVehicle, subscribeToJob, getJobById } from '@/services/firestoreService';
import { notifyJobCompleted, notifyPartsNeeded } from '@/services/notificationService';
import { deductStockForJob, adjustStock, getPartByPartNumber } from '@/services/partsService';
import { Job, JobStatus, Vehicle, ServiceType } from '@/lib/types';
import { getTranslatedProblemDescription } from '@/lib/jobTranslation';
import { JobAssignmentModal } from '@/components/jobs/JobAssignmentModal';
import { PartsWizardModal } from '@/components/jobs/PartsWizardModal';
import { JobCompletionModal, CompletionData } from '@/components/jobs/JobCompletionModal';
import { PartsNeededCard } from '@/components/jobs/PartsNeededCard';
import { JobCompletionSummary } from '@/components/jobs/JobCompletionSummary';
import { QuoteBuilderModal } from '@/components/quotes/QuoteBuilderModal';
import { WorkOrderBuilder } from '@/components/quotes/WorkOrderBuilder';
import { LicensePlate } from '@/components/ui/license-plate';
import { CarBrandLogo } from '@/components/ui/car-brand-logo';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

function StatusBadge({ status, size = 'default' }: { status: JobStatus; size?: 'default' | 'sm' }) {
  const { t } = useLanguage();

  const config: Record<JobStatus, { class: string; label: string }> = {
    not_started: { class: 'status-not-started', label: t('jobs.notStarted') },
    in_progress: { class: 'status-in-progress', label: t('jobs.inProgress') },
    waiting_for_parts: { class: 'status-waiting', label: t('jobs.waitingParts') },
    completed: { class: 'status-completed', label: t('jobs.completed') },
  };

  const { class: className, label } = config[status];

  return (
    <span className={cn(
      `inline-flex items-center rounded-full font-medium ${className}`,
      size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm'
    )}>
      {label}
    </span>
  );
}

function ServiceTypeBadge({ serviceType }: { serviceType?: ServiceType }) {
  const { t } = useLanguage();
  if (!serviceType) return null;

  const config: Record<ServiceType, { icon: any; label: string; color: string }> = {
    repair: { icon: Wrench, label: t('serviceType.repair'), color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
    maintenance: { icon: Wrench, label: t('serviceType.maintenance'), color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
    inspection: { icon: CheckCircle, label: t('serviceType.inspection'), color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
    diagnostic: { icon: AlertTriangle, label: t('serviceType.diagnostic'), color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' },
  };

  const { icon: Icon, label, color } = config[serviceType];

  return (
    <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium', color)}>
      <Icon className="h-3 w-3" />
      {label}
    </span>
  );
}

// Expandable Job History Card
function JobHistoryCard({
  job,
  isExpanded,
  onToggle,
  userLanguage
}: {
  job: Job;
  isExpanded: boolean;
  onToggle: () => void;
  userLanguage: string;
}) {
  const navigate = useNavigate();
  const { t } = useLanguage();

  return (
    <Card
      className={cn(
        "transition-all duration-300 cursor-pointer border-l-4",
        isExpanded ? "shadow-lg border-l-primary" : "hover:shadow-md border-l-muted-foreground/30"
      )}
      onClick={onToggle}
    >
      <CardContent className="p-4">
        {/* Header - always visible */}
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium text-sm">
                {format(new Date(job.createdAt), 'dd/MM/yyyy')}
              </span>
              <ServiceTypeBadge serviceType={job.serviceType} />
            </div>
            <p className={cn(
              "text-sm text-muted-foreground",
              !isExpanded && "line-clamp-1"
            )}>
              {getTranslatedProblemDescription(job, userLanguage as any)}
            </p>
          </div>
          <div className="flex items-center gap-2 ml-2">
            <StatusBadge status={job.status} size="sm" />
            {isExpanded ? (
              <ChevronUp className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            )}
          </div>
        </div>

        {/* Expanded Content */}
        {isExpanded && (
          <div className="mt-4 pt-4 border-t space-y-3 animate-in slide-in-from-top-2 duration-200">
            {/* Full Description */}
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase mb-1">{t('jobDetail.problemDescription')}</p>
              <p className="text-sm">{getTranslatedProblemDescription(job, userLanguage as any)}</p>
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-xs text-muted-foreground">{t('jobDetail.priority')}</p>
                <span className={`font-medium uppercase text-xs priority-${job.priority}`}>
                  {t(`jobs.priority.${job.priority}`)}
                </span>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{t('jobDetail.jobNumber')}</p>
                <span className="font-mono text-xs">{job.jobNumber || job.id.slice(0, 8)}</span>
              </div>
              {job.mileage && (
                <div>
                  <p className="text-xs text-muted-foreground">{t('jobDetail.kilometers')}</p>
                  <span className="text-xs">{job.mileage.toLocaleString()} km</span>
                </div>
              )}
              {job.completedAt && (
                <div>
                  <p className="text-xs text-muted-foreground">{t('jobDetail.completed')}</p>
                  <span className="text-xs">{format(new Date(job.completedAt), 'dd/MM/yyyy')}</span>
                </div>
              )}
            </div>

            {/* Fault Categories */}
            {job.faultCategory && (
              <div>
                <p className="text-xs text-muted-foreground mb-1">{t('jobDetail.affectedAreas')}</p>
                <div className="flex flex-wrap gap-1">
                  {job.faultCategory.split(',').map((cat, i) => (
                    <Badge key={i} variant="secondary" className="text-xs">
                      {t(`modal.parts.category.${cat.trim()}`)}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* View Full Details Button */}
            <Button
              variant="outline"
              size="sm"
              className="w-full mt-2"
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/jobs/${job.id}`);
              }}
            >
              {t('jobDetail.viewFullDetails')}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Fuel type display helper (moved inside component to access t() function)

export default function JobDetailPage() {
  const { jobId } = useParams();
  const { user } = useAuth();
  const { t, language: userLanguage } = useLanguage();
  const navigate = useNavigate();
  const [showOriginal, setShowOriginal] = useState(false);

  const [job, setJob] = useState<Job | null>(null);
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [vehicleHistory, setVehicleHistory] = useState<Job[]>([]);
  const [creator, setCreator] = useState<any>(null);
  const [mechanic, setMechanic] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedHistoryId, setExpandedHistoryId] = useState<string | null>(null);

  // Modal states
  const [showAssignmentModal, setShowAssignmentModal] = useState(false);
  const [showPartsWizard, setShowPartsWizard] = useState(false);
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [showQuoteBuilder, setShowQuoteBuilder] = useState(false);
  const [showInvoiceBuilder, setShowInvoiceBuilder] = useState(false);
  const [showWorkOrder, setShowWorkOrder] = useState(false);
  const [showPartsServicesModal, setShowPartsServicesModal] = useState(false);
  const [pendingStatusChange, setPendingStatusChange] = useState<JobStatus | null>(null);

  // Mileage / fuel edit
  const [editingVehicleInfo, setEditingVehicleInfo] = useState(false);
  const [editMileage, setEditMileage] = useState('');
  const [editFuelType, setEditFuelType] = useState('');

  // Problem description edit
  const [editingProblemDesc, setEditingProblemDesc] = useState(false);
  const [editProblemDesc, setEditProblemDesc] = useState('');

  // Subscribe to real-time job updates
  useEffect(() => {
    if (!jobId) {
      setError('No job ID provided');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    const unsubscribe = subscribeToJob(jobId, async (foundJob) => {
      if (foundJob) {
        setJob(foundJob);

        // Load related data (vehicle, creator, mechanic)
        try {
          const [foundVehicle, creatorData] = await Promise.all([
            getVehicleById(foundJob.vehicleId),
            getUserById(foundJob.createdBy)
          ]);

          setVehicle(foundVehicle);
          setCreator(creatorData);

          if (foundJob.assignedMechanicId) {
            const mechanicData = await getUserById(foundJob.assignedMechanicId);
            setMechanic(mechanicData);
          } else {
            setMechanic(null);
          }

          if (foundVehicle) {
            const history = await getJobsByVehicle(foundVehicle.id);
            const filteredHistory = history
              .filter(j => j.id !== jobId)
              .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
            setVehicleHistory(filteredHistory);
          }
        } catch (error) {
          console.error('Error loading related data:', error);
        }
      } else {
        setError('Job not found');
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [jobId]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">{t('common.loading')}</p>
          <p className="text-xs text-muted-foreground mt-2">Job ID: {jobId}</p>
        </div>
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-destructive font-semibold">{error || 'Job not found'}</p>
          <p className="text-sm text-muted-foreground mt-2">Job ID: {jobId}</p>
          <Button onClick={() => navigate('/jobs')} className="mt-4">
            Back to Jobs
          </Button>
        </div>
      </div>
    );
  }

  const isMechanic = user?.role === 'mechanic';
  const isOfficeOrManager = user?.role === 'office_staff' || user?.role === 'manager' || user?.role === 'admin';
  const isAssignedToMe = job.assignedMechanicId === user?.id;
  const canClaim = isMechanic && !job.assignedMechanicId && job.status === 'not_started';

  // Get vehicle info (prefer denormalized, fallback to vehicle lookup)
  const licensePlate = job.vehicleLicensePlate || vehicle?.licensePlate || '-';
  const brand = job.vehicleBrand || vehicle?.brand || '-';
  const model = job.vehicleModel || vehicle?.model || '';
  const year = job.vehicleYear || vehicle?.year;
  const vin = job.vehicleVin || vehicle?.vin;
  const fuelType = job.vehicleFuelType || vehicle?.fuelType;
  const mileage = job.mileage || vehicle?.mileage;

  // Fuel type translation helper
  const getFuelTypeLabel = (fuelTypeValue?: string): string => {
    if (!fuelTypeValue) return '-';
    const labels: Record<string, string> = {
      petrol: t('fuel.petrol'),
      diesel: t('fuel.diesel'),
      electric: t('fuel.electric'),
      hybrid: t('fuel.hybrid'),
      lpg: t('fuel.lpg'),
      other: t('fuel.other'),
    };
    return labels[fuelTypeValue] || fuelTypeValue;
  };

  const handleSaveVehicleInfo = async () => {
    if (!job) return;
    const updates: Record<string, any> = {};
    if (editMileage !== '') updates.mileage = Number(editMileage);
    if (editFuelType) updates.vehicleFuelType = editFuelType;
    if (Object.keys(updates).length > 0) await updateJob(job.id, updates);
    setEditingVehicleInfo(false);
  };

  const handleSaveProblemDesc = async () => {
    if (!job || !editProblemDesc.trim()) return;
    await updateJob(job.id, { problemDescription: editProblemDesc.trim() }, user?.id);
    setEditingProblemDesc(false);
  };

  const handleClaimJob = () => {
    setShowAssignmentModal(true);
  };

  const confirmClaimJob = async () => {
    if (!user || !job) return;

    try {
      const now = new Date().toISOString();
      await updateJob(job.id, {
        assignedMechanicId: user.id,
        assignedAt: now,
        status: 'in_progress',
      }, user.id);

      // Let subscription handle state update
      setShowAssignmentModal(false);
    } catch (error) {
      console.error('Error claiming job:', error);
    }
  };

  const handleStartJob = async () => {
    if (!user || !job) return;

    try {
      const now = new Date().toISOString();
      await updateJob(job.id, {
        status: 'in_progress',
      }, user.id);

      // Let subscription handle state update
    } catch (error) {
      console.error('Error starting job:', error);
    }
  };

  const handleStatusChange = (newStatus: JobStatus) => {
    if (!job) return;

    if (newStatus === 'waiting_for_parts') {
      setPendingStatusChange(newStatus);
      setShowPartsWizard(true);
      return;
    }

    if (newStatus === 'completed') {
      setPendingStatusChange(newStatus);
      setShowCompletionModal(true);
      return;
    }

    applyStatusChange(newStatus);
  };

  const applyStatusChange = async (newStatus: JobStatus) => {
    if (!job) return;

    try {
      const updates: Partial<Job> = {
        status: newStatus,
        ...(newStatus === 'completed' && { completedAt: new Date().toISOString() }),
      };

      await updateJob(job.id, updates, user?.id);

      if (newStatus === 'completed') {
        try {
          await notifyJobCompleted(
            job.id,
            job.problemDescription.substring(0, 50),
            user?.id
          );
        } catch (notifError) {
          console.error('Error sending completion notification:', notifError);
        }
      }

      // Let subscription handle state update to avoid race conditions
      setPendingStatusChange(null);
    } catch (error) {
      console.error('Error updating job status:', error);
    }
  };

  const handlePartsWizardComplete = async (data: { partsNeeded: Array<{ categoryId: string; status: 'order' | 'in_stock' }> }) => {
    if (!job) return;

    try {
      const existingParts = job.partsNeeded || [];
      const existingCategoryIds = existingParts.map(p => p.categoryId);
      const newParts = data.partsNeeded.filter(p => !existingCategoryIds.includes(p.categoryId));
      const mergedParts = [...existingParts, ...newParts];

      await updateJob(job.id, {
        status: 'waiting_for_parts',
        partsNeeded: mergedParts,
      }, user?.id);

      if (newParts.length > 0) {
        try {
          await notifyPartsNeeded(
            job.id,
            job.problemDescription.substring(0, 50),
            user?.id
          );
        } catch (notifError) {
          console.error('Error sending parts notification:', notifError);
        }
      }

      // Let subscription handle state update to avoid race conditions
      setPendingStatusChange(null);
      setShowPartsWizard(false);
    } catch (error) {
      console.error('Error saving parts data:', error);
    }
  };

  const handleJobCompletion = async (completionData: CompletionData) => {
    if (!job || !user) return;

    try {
      // Save completion confirmation data to work order
      const updatedWorkOrder = {
        ...(job.workOrderData || {}),
        completionConfirmation: {
          faultsChecked: completionData.faultsChecked,
          partsConfirmed: completionData.partsConfirmed,
          completionNotes: completionData.completionNotes,
          confirmedAt: new Date().toISOString(),
          confirmedBy: user.id,
        },
        // Update parts with confirmed quantities
        parts: (job.workOrderData?.parts || []).map(part => {
          const confirmed = completionData.partsConfirmed.find(p => p.id === part.id);
          if (confirmed) {
            if (confirmed.removed) return null;
            return { ...part, quantity: confirmed.confirmedQuantity };
          }
          return part;
        }).filter(Boolean),
        completedAt: new Date().toISOString(),
      };

      const cleanData = JSON.parse(JSON.stringify(updatedWorkOrder));

      await updateJob(job.id, {
        status: 'completed',
        completedAt: new Date().toISOString(),
        workOrderData: cleanData,
        workOrderStage: 6 as 1 | 2 | 3 | 4 | 5 | 6,
      }, user.id);

      // Deduct stock for parts used in this job
      const allParts = cleanData.parts || [];

      // Parts with a direct partId reference
      const catalogParts = allParts
        .filter((p: any) => p.partId)
        .map((p: any) => ({
          partId: p.partId,
          partName: p.partName,
          partNumber: p.partNumber || '',
          quantity: p.quantity,
          costPrice: p.unitPrice,
          sellingPrice: p.unitPrice,
          totalCost: p.quantity * p.unitPrice,
        }));
      if (catalogParts.length > 0) {
        try {
          await deductStockForJob(catalogParts, job.id, user.id);
        } catch (stockError) {
          console.error('Error deducting stock:', stockError);
        }
      }

      // Fallback: parts without partId but with a partNumber — look up catalog by number
      const unmatchedParts = allParts.filter((p: any) => !p.partId && p.partNumber?.trim());
      for (const p of unmatchedParts) {
        try {
          const catalogPart = await getPartByPartNumber(p.partNumber.trim());
          if (catalogPart) {
            await adjustStock(catalogPart.id, -p.quantity, 'usage', user.id, {
              jobId: job.id,
              costPerUnit: p.unitPrice,
              reason: `Used in job ${job.id}`,
              notes: `Part: ${p.partName} (${p.partNumber})`,
            });
          }
        } catch (err) {
          console.error(`Error deducting stock for part ${p.partNumber}:`, err);
        }
      }

      try {
        await notifyJobCompleted(
          job.id,
          job.problemDescription.substring(0, 50),
          user.id
        );
      } catch (notifError) {
        console.error('Error sending completion notification:', notifError);
      }

      // Let subscription handle state update
      setPendingStatusChange(null);
    } catch (error) {
      console.error('Error completing job:', error);
    }
  };

  const handleWorkOrderSave = async (workOrderData: any) => {
    if (!job) return;

    try {
      // Determine current stage based on filled data
      let stage = 1;
      if (workOrderData.workItems?.length > 0) stage = 2;
      if (workOrderData.findings?.length > 0) stage = 3;
      if (workOrderData.parts?.length > 0) stage = 4;
      if (workOrderData.completedAt) stage = 5;

      // Check if any parts are added (in stock or need ordering)
      const hasParts = workOrderData.parts && workOrderData.parts.length > 0;

      // Strip undefined values - Firestore rejects them
      const cleanData = JSON.parse(JSON.stringify(workOrderData));

      const updates: any = {
        workOrderData: cleanData,
        workOrderStage: stage as 1 | 2 | 3 | 4 | 5 | 6,
      };

      // Auto-update status based on parts usage (but don't change if completed)
      if (job.status !== 'completed') {
        if (hasParts && job.status !== 'waiting_for_parts') {
          updates.status = 'waiting_for_parts';
          // Notify if transitioning to waiting_for_parts
          try {
            await notifyPartsNeeded(
              job.id,
              job.problemDescription.substring(0, 50),
              user?.id || ''
            );
          } catch (notifyErr) {
            console.error('Failed to send notification:', notifyErr);
          }
        } else if (!hasParts && job.status === 'waiting_for_parts') {
          // If no parts and currently waiting, move back to in_progress
          updates.status = 'in_progress';
        }
      }

      await updateJob(job.id, updates, user?.id);

      // Let subscription handle state update
      setShowWorkOrder(false);
    } catch (error) {
      console.error('Error saving work order:', error);
      throw error;
    }
  };

  // Status actions only for office/manager - mechanics use work order flow
  const statusActions = isOfficeOrManager ? [
    { status: 'in_progress' as const, label: t('jobs.inProgress'), icon: Play, color: 'bg-[hsl(var(--status-in-progress))]' },
    { status: 'waiting_for_parts' as const, label: t('jobs.waitingParts'), icon: Package, color: 'bg-[hsl(var(--status-waiting))]' },
    { status: 'completed' as const, label: t('jobs.completed'), icon: CheckCircle, color: 'bg-[hsl(var(--status-completed))]' },
  ] : [];

  return (
    <div className="safe-top pb-8">
      {/* Header */}
      <div className="px-4 pt-4 pb-4 flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <StatusBadge status={job.status} />
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            {t('jobDetail.createdOn')} {format(new Date(job.createdAt), 'dd/MM/yyyy')}
          </p>
        </div>
      </div>

      <div className="px-4 space-y-4">
        {/* Completion Summary for Completed Jobs */}
        {job.status === 'completed' && (
          <JobCompletionSummary
            job={job}
            vehicle={vehicle}
            mechanic={mechanic}
            creator={creator}
            isMechanic={isMechanic}
          />
        )}

        {/* Vehicle Information - Primary Section */}
        <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 flex items-center justify-center shrink-0">
                <CarBrandLogo brand={brand || ''} size="xl" className="text-primary" />
              </div>
              <div className="flex-1">
                <LicensePlate plateNumber={licensePlate} size="lg" />
                <p className="text-sm text-muted-foreground mt-1">
                  {brand} {model} {year && `(${year})`}
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              {/* Kilometers */}
              <div className="flex items-center gap-3 p-3 rounded-lg bg-background/50">
                <Gauge className="h-5 w-5 text-muted-foreground shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground">{t('jobDetail.kilometers')}</p>
                  {editingVehicleInfo ? (
                    <Input
                      type="number"
                      value={editMileage}
                      placeholder={mileage ? String(mileage) : '0'}
                      onChange={e => setEditMileage(e.target.value)}
                      onFocus={e => e.target.select()}
                      className="h-7 text-sm mt-0.5"
                    />
                  ) : (
                    <p className="font-medium">
                      {mileage ? `${mileage.toLocaleString()} km` : t('jobDetail.notRecorded')}
                    </p>
                  )}
                </div>
              </div>

              {/* Fuel Type */}
              <div className="flex items-center gap-3 p-3 rounded-lg bg-background/50">
                <Fuel className="h-5 w-5 text-muted-foreground shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground">{t('jobDetail.fuelType')}</p>
                  {editingVehicleInfo ? (
                    <Select value={editFuelType || fuelType || ''} onValueChange={setEditFuelType}>
                      <SelectTrigger className="h-7 text-sm mt-0.5">
                        <SelectValue placeholder="-" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="petrol">{t('fuel.petrol')}</SelectItem>
                        <SelectItem value="diesel">{t('fuel.diesel')}</SelectItem>
                        <SelectItem value="electric">{t('fuel.electric')}</SelectItem>
                        <SelectItem value="hybrid">{t('fuel.hybrid')}</SelectItem>
                        <SelectItem value="lpg">{t('fuel.lpg')}</SelectItem>
                        <SelectItem value="other">{t('fuel.other')}</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <p className="font-medium">{getFuelTypeLabel(fuelType)}</p>
                  )}
                </div>
              </div>

              {/* VIN - Full width if present */}
              {vin && (
                <div className="col-span-2 flex items-center gap-3 p-3 rounded-lg bg-background/50">
                  <Hash className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">VIN</p>
                    <p className="font-mono text-sm">{vin}</p>
                  </div>
                </div>
              )}

              {/* Edit / Save vehicle info */}
              {(isMechanic || isOfficeOrManager) && job.status !== 'completed' && (
                <div className="col-span-2 flex justify-end gap-2 pt-1">
                  {editingVehicleInfo ? (
                    <>
                      <Button variant="ghost" size="sm" onClick={() => setEditingVehicleInfo(false)}>
                        <X className="h-4 w-4 mr-1" />{t('common.cancel')}
                      </Button>
                      <Button size="sm" onClick={handleSaveVehicleInfo}>
                        <Check className="h-4 w-4 mr-1" />{t('common.save')}
                      </Button>
                    </>
                  ) : (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setEditMileage(mileage ? String(mileage) : '');
                        setEditFuelType(fuelType || '');
                        setEditingVehicleInfo(true);
                      }}
                    >
                      <Pencil className="h-4 w-4 mr-1" />{t('common.edit')}
                    </Button>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Unified Action Button for Mechanics - Claim or Complete */}
        {isMechanic && job.status !== 'completed' && (
          <>
            {canClaim ? (
              <Button onClick={handleClaimJob} className="w-full h-14 text-base">
                {t('jobs.claim')}
              </Button>
            ) : isAssignedToMe && (
              <>
                {job.status === 'not_started' ? (
                  <Button
                    onClick={handleStartJob}
                    className="w-full h-14 text-base bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <Play className="h-5 w-5 mr-2" />
                    {t('jobs.startJob')}
                  </Button>
                ) : (
                  <Button
                    onClick={() => setShowCompletionModal(true)}
                    className="w-full h-14 text-base bg-green-600 hover:bg-green-700 text-white"
                  >
                    <CheckCircle className="h-5 w-5 mr-2" />
                    {t('jobs.completeJob')}
                  </Button>
                )}
              </>
            )}
          </>
        )}

        {/* Messages Button */}
        <Button
          className="w-full h-14 text-base"
          onClick={() => navigate(`/jobs/${job.id}/messages`)}
        >
          <MessageSquare className="mr-2 h-5 w-5" />
          {t('dashboard.viewMessages')}
        </Button>

        {/* Create/Edit Work Order Button */}
        <Button
          variant="default"
          className="w-full h-12"
          onClick={() => setShowWorkOrder(true)}
        >
          <FileText className="mr-2 h-5 w-5" />
          {job.workOrderData ? t('jobs.editWorkOrder') : t('jobs.createWorkOrder')}
          {job.workOrderStage && (
            <Badge variant="secondary" className="ml-2">
              {t('jobs.stage')} {job.workOrderStage}/6
            </Badge>
          )}
        </Button>

        {isOfficeOrManager && isAssignedToMe && job.status !== 'completed' && statusActions.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">{t('jobDetail.updateStatus')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-2">
                {statusActions.map(({ status, label, icon: Icon, color }) => (
                  <button
                    key={status}
                    onClick={() => handleStatusChange(status)}
                    disabled={job.status === status}
                    className={`flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-all ${
                      job.status === status
                        ? 'border-primary bg-primary/10'
                        : 'border-border hover:border-primary/50'
                    } disabled:opacity-50`}
                  >
                    <div className={`p-2 rounded-full ${color}`}>
                      <Icon className="h-4 w-4 text-white" />
                    </div>
                    <span className="text-xs font-medium text-center">{label}</span>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Customer Info - Only for Office/Manager */}
        {isOfficeOrManager && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <User className="h-4 w-4" />
                {t('jobDetail.customerInformation')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">{t('jobs.customerName')}</span>
                  <span className="font-medium">{job.customerName}</span>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">{t('jobs.customerPhone')}</span>
                  <a href={`tel:${job.customerPhone}`} className="font-medium text-primary flex items-center gap-1">
                    <Phone className="h-3 w-3" />
                    {job.customerPhone}
                  </a>
                </div>
                {job.customerEmail && (
                  <>
                    <Separator />
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">{t('jobDetail.email')}</span>
                      <a href={`mailto:${job.customerEmail}`} className="font-medium text-primary flex items-center gap-1">
                        <Mail className="h-3 w-3" />
                        {job.customerEmail}
                      </a>
                    </div>
                  </>
                )}
                {job.customerNotes && (
                  <>
                    <Separator />
                    <div>
                      <span className="text-muted-foreground text-sm">{t('jobDetail.notes')}</span>
                      <p className="text-sm mt-1">{job.customerNotes}</p>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Problem Description - Enhanced Section */}
        <Card className="border-l-4 border-l-amber-500">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-500" />
                {t('jobs.problemDescription')}
              </CardTitle>
              <div className="flex items-center gap-2">
                {job.serviceType && <ServiceTypeBadge serviceType={job.serviceType} />}
                <span className={`text-xs font-medium uppercase px-2 py-0.5 rounded-full priority-${job.priority}`}>
                  {job.priority}
                </span>
                {(user?.role === 'manager' || user?.role === 'admin') && !editingProblemDesc && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setEditProblemDesc(job.problemDescription);
                      setEditingProblemDesc(true);
                    }}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Main Description */}
            <div className="p-4 rounded-lg bg-muted/50">
              {editingProblemDesc ? (
                <div className="space-y-3">
                  <Textarea
                    value={editProblemDesc}
                    onChange={(e) => setEditProblemDesc(e.target.value)}
                    className="min-h-[120px] text-foreground"
                    placeholder={t('jobs.problemDescription')}
                  />
                  <div className="flex items-center gap-2">
                    <Button size="sm" onClick={handleSaveProblemDesc}>
                      <Check className="h-4 w-4 mr-1" />{t('common.save')}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setEditingProblemDesc(false);
                        setEditProblemDesc('');
                      }}
                    >
                      <X className="h-4 w-4 mr-1" />{t('common.cancel')}
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <p className="text-foreground leading-relaxed">
                    {showOriginal
                      ? job.problemDescription
                      : getTranslatedProblemDescription(job, userLanguage)}
                  </p>

                  {/* Translation Toggle */}
                  {job.problemDescriptionLanguage &&
                   job.problemDescriptionLanguage !== userLanguage &&
                   job.problemDescriptionTranslations?.[userLanguage] && (
                    <button
                      onClick={() => setShowOriginal(!showOriginal)}
                      className="flex items-center gap-1 mt-3 text-xs text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <Languages className="h-3 w-3" />
                      {showOriginal ? t('jobDetail.showTranslation') : t('jobDetail.showOriginal')}
                    </button>
                  )}
                </>
              )}
            </div>

            {/* Fault Categories */}
            {job.faultCategory && (
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase mb-2">{t('jobDetail.affectedAreas')}</p>
                <div className="flex flex-wrap gap-2">
                  {job.faultCategory.split(',').map((cat, i) => (
                    <Badge key={i} variant="outline" className="text-sm">
                      {t(`modal.parts.category.${cat.trim()}`)}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Assignment Info */}
            <div className="flex items-center gap-4 pt-2 border-t">
              {mechanic && (
                <div className="flex items-center gap-2 text-sm">
                  <Wrench className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">{t('jobDetail.assignedTo')}</span>
                  <span className="font-medium">{mechanic.fullName}</span>
                </div>
              )}
              {job.scheduledDate && (
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">{t('jobDetail.scheduled')}</span>
                  <span className="font-medium">{format(new Date(job.scheduledDate), 'dd/MM/yyyy')}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Comprehensive Job Timeline */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="h-4 w-4" />
              {t('jobs.timeline')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Job Created */}
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <Calendar className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-sm">{t('jobDetail.jobCreated')}</p>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(job.createdAt), 'dd/MM/yyyy HH:mm')}
                  </p>
                  {creator && <p className="text-xs text-muted-foreground">{t('jobs.createdBy')} {creator.fullName}</p>}
                </div>
              </div>

              {/* Job Assigned */}
              {job.assignedAt && (
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center shrink-0">
                    <User className="h-5 w-5 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-sm">{t('jobDetail.assignedToMechanic')}</p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(job.assignedAt), 'dd/MM/yyyy HH:mm')}
                    </p>
                    {mechanic && <p className="text-xs text-muted-foreground">{t('jobs.assignedTo')} {mechanic.fullName}</p>}
                  </div>
                </div>
              )}

              {/* Work Started */}
              {job.status !== 'not_started' && job.assignedAt && (
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-orange-500/10 flex items-center justify-center shrink-0">
                    <Play className="h-5 w-5 text-orange-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-sm">{t('jobs.startedAt')}</p>
                    <p className="text-xs text-muted-foreground">
                      {job.status === 'in_progress' || job.status === 'waiting_for_parts' || job.status === 'completed'
                        ? format(new Date(job.assignedAt), 'dd/MM/yyyy HH:mm')
                        : '-'}
                    </p>
                  </div>
                </div>
              )}

              {/* Parts/Services Added */}
              {job.workOrderData && (job.workOrderData.parts?.length > 0 || job.workOrderData.workItems?.length > 0) && (
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-purple-500/10 flex items-center justify-center shrink-0">
                    <Package className="h-5 w-5 text-purple-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-sm">
                      {job.workOrderData.parts?.length > 0 && t('jobs.partsAdded')}
                      {job.workOrderData.parts?.length > 0 && job.workOrderData.workItems?.length > 0 && ' / '}
                      {job.workOrderData.workItems?.length > 0 && t('jobs.servicesAdded')}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {job.workOrderData.parts?.length > 0 && `${job.workOrderData.parts.length} ${job.workOrderData.parts.length === 1 ? t('jobDetail.part') : t('jobDetail.parts')}`}
                      {job.workOrderData.parts?.length > 0 && job.workOrderData.workItems?.length > 0 && ', '}
                      {job.workOrderData.workItems?.length > 0 && `${job.workOrderData.workItems.length} ${job.workOrderData.workItems.length === 1 ? t('jobDetail.service') : t('jobDetail.services')}`}
                    </p>
                  </div>
                </div>
              )}

              {/* Job Completed */}
              {job.completedAt && (
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center shrink-0">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-sm text-green-600">{t('jobDetail.jobCompleted')}</p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(job.completedAt), 'dd/MM/yyyy HH:mm')}
                    </p>
                    {mechanic && <p className="text-xs text-muted-foreground">{t('jobs.completedBy')} {mechanic.fullName}</p>}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Parts & Services Preview - Clickable */}
        {job.workOrderData && (job.workOrderData.parts?.length > 0 || job.workOrderData.workItems?.length > 0) && (
          <Card
            className="cursor-pointer hover:border-primary/50 transition-colors"
            onClick={() => setShowPartsServicesModal(true)}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  {t('jobs.partsAdded')} / {t('jobs.servicesAdded')}
                </CardTitle>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {/* Services Preview */}
                {job.workOrderData.workItems && job.workOrderData.workItems.length > 0 && (
                  <div className="flex items-center gap-2 text-sm">
                    <Wrench className="h-4 w-4 text-primary" />
                    <span className="font-medium">{job.workOrderData.workItems.length} {job.workOrderData.workItems.length === 1 ? t('jobDetail.service') : t('jobDetail.services')}</span>
                  </div>
                )}
                {/* Parts Preview */}
                {job.workOrderData.parts && job.workOrderData.parts.length > 0 && (
                  <div className="flex items-center gap-2 text-sm">
                    <Package className="h-4 w-4 text-primary" />
                    <span className="font-medium">{job.workOrderData.parts.length} {job.workOrderData.parts.length === 1 ? t('jobDetail.part') : t('jobDetail.parts')}</span>
                  </div>
                )}
                <p className="text-xs text-muted-foreground mt-2">{t('jobDetail.tapToView')}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Work Performed - Mechanic Completed View */}
        {isMechanic && job.status === 'completed' && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Work Performed
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Services / Work Items from Work Order */}
              {job.workOrderData?.workItems && job.workOrderData.workItems.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground font-semibold uppercase">{t('jobDetail.services')}</p>
                  {job.workOrderData.workItems.map((item) => (
                    <div key={item.id} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                      <Wrench className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                      <div className="flex-1">
                        <p className="text-sm font-medium">{item.serviceName}</p>
                        {item.description && item.description !== item.serviceName && (
                          <p className="text-xs text-muted-foreground mt-0.5">{item.description}</p>
                        )}
                        <div className="flex items-center gap-2 mt-1">
                          {item.durationHours > 0 && (
                            <span className="text-xs text-muted-foreground">{item.durationHours}h</span>
                          )}
                          {item.isImmediate && (
                            <Badge variant="destructive" className="text-[10px] px-1.5 py-0">{t('status.immediate')}</Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Diagnostic Findings */}
              {job.workOrderData?.findings && job.workOrderData.findings.length > 0 && (
                <div className="space-y-2">
                  <Separator />
                  <p className="text-xs text-muted-foreground font-semibold uppercase">Findings</p>
                  {job.workOrderData.findings.map((finding) => (
                    <div key={finding.id} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                      <AlertTriangle className={`h-4 w-4 mt-0.5 shrink-0 ${finding.requiresReplacement ? 'text-amber-500' : 'text-muted-foreground'}`} />
                      <div className="flex-1">
                        <p className="text-sm">{finding.description}</p>
                        {finding.requiresReplacement && (
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0 mt-1 border-amber-500/50 text-amber-600">
                            Replacement Required
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Parts Used from Work Order */}
              {job.workOrderData?.parts && job.workOrderData.parts.length > 0 && (
                <div className="space-y-2">
                  <Separator />
                  <p className="text-xs text-muted-foreground font-semibold uppercase">{t('jobDetail.partsUsed')}</p>
                  {job.workOrderData.parts.map((part) => (
                    <div key={part.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                      <Package className="h-4 w-4 text-primary shrink-0" />
                      <div className="flex-1">
                        <p className="text-sm font-medium">{part.partName}</p>
                        {part.partNumber && (
                          <p className="text-xs text-muted-foreground font-mono">#{part.partNumber}</p>
                        )}
                      </div>
                      <span className="text-sm font-medium text-muted-foreground">x{part.quantity}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Fallback: show old partsNeeded if no workOrderData parts */}
              {(!job.workOrderData?.parts || job.workOrderData.parts.length === 0) &&
                job.partsNeeded && job.partsNeeded.length > 0 && (
                <div className="space-y-2">
                  <Separator />
                  <p className="text-xs text-muted-foreground font-semibold uppercase">{t('jobDetail.parts')}</p>
                  <div className="flex flex-wrap gap-2">
                    {job.partsNeeded.map((part) => (
                      <div
                        key={part.categoryId}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-xs border border-primary/30"
                      >
                        <Package className="h-3 w-3" />
                        {t(`modal.parts.category.${part.categoryId}`)}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Completion Notes */}
              {job.workOrderData?.completionConfirmation?.completionNotes && (
                <div className="space-y-2">
                  <Separator />
                  <p className="text-xs text-muted-foreground font-semibold uppercase">Completion Notes</p>
                  <p className="text-sm p-3 rounded-lg bg-muted/50">
                    {job.workOrderData.completionConfirmation.completionNotes}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Parts Needed Section */}
        {job.status === 'waiting_for_parts' && job.partsNeeded && job.partsNeeded.length > 0 && (
          <PartsNeededCard
            partsNeeded={job.partsNeeded}
            onAddMoreParts={() => setShowPartsWizard(true)}
          />
        )}

        {/* Create Quote Button - Office/Manager only */}
        {isOfficeOrManager && !job.quoteId && (
          <Button
            variant="outline"
            className="w-full h-12 border-primary/50 text-primary hover:bg-primary/10"
            onClick={() => setShowQuoteBuilder(true)}
          >
            <FileText className="mr-2 h-5 w-5" />
            {t('jobDetail.createQuote')}
          </Button>
        )}

        {/* View Quote Button - Office/Manager only */}
        {job.quoteId && isOfficeOrManager && (
          <Button
            variant="outline"
            className="w-full h-12 border-primary/50 text-primary hover:bg-primary/10"
            onClick={() => navigate(`/quotes/${job.quoteId}`)}
          >
            <FileText className="mr-2 h-5 w-5" />
            {t('jobs.viewQuote')}
          </Button>
        )}

        {/* Invoice Buttons - Office/Manager only, completed jobs */}
        {isOfficeOrManager && job.status === 'completed' && (
          <div className="flex gap-2">
            <Button
              variant="default"
              className="flex-1 h-12 bg-green-600 hover:bg-green-700"
              onClick={() => setShowInvoiceBuilder(true)}
            >
              <Receipt className="mr-2 h-5 w-5" />
              {t('jobs.processInvoice')}
              {(job.invoiceIds?.length || 0) > 0 && (
                <Badge variant="secondary" className="ml-1 text-xs">
                  +{job.invoiceIds?.length}
                </Badge>
              )}
            </Button>
            <Button
              variant="outline"
              className="flex-1 h-12 disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={() => navigate(`/invoices/${job.invoiceId}`)}
              disabled={!job.invoiceId}
            >
              <Receipt className="mr-2 h-5 w-5" />
              {t('jobs.viewInvoice')}
            </Button>
          </div>
        )}

        {/* Vehicle Service History Timeline */}
        {vehicleHistory.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  {t('jobs.serviceHistory')}
                  <Badge variant="secondary" className="ml-2">
                    {vehicleHistory.length} {t('jobs.previousJobs')}
                  </Badge>
                </CardTitle>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {t('jobs.tapForDetails')}
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {vehicleHistory.map((historyJob) => (
                  <JobHistoryCard
                    key={historyJob.id}
                    job={historyJob}
                    isExpanded={expandedHistoryId === historyJob.id}
                    onToggle={() => setExpandedHistoryId(
                      expandedHistoryId === historyJob.id ? null : historyJob.id
                    )}
                    userLanguage={userLanguage}
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Modals */}
      <JobAssignmentModal
        open={showAssignmentModal}
        onOpenChange={setShowAssignmentModal}
        job={job}
        vehicle={vehicle}
        onConfirm={confirmClaimJob}
      />

      <PartsWizardModal
        open={showPartsWizard}
        onOpenChange={(open) => {
          setShowPartsWizard(open);
          if (!open) setPendingStatusChange(null);
        }}
        onComplete={handlePartsWizardComplete}
        existingParts={job?.partsNeeded || []}
      />

      <JobCompletionModal
        open={showCompletionModal}
        onOpenChange={(open) => {
          setShowCompletionModal(open);
          if (!open) setPendingStatusChange(null);
        }}
        onConfirm={handleJobCompletion}
        job={job}
      />

      <QuoteBuilderModal
        job={job}
        isOpen={showQuoteBuilder}
        onClose={() => setShowQuoteBuilder(false)}
        onQuoteCreated={(quoteId) => {
          setShowQuoteBuilder(false);
          // No need to manually fetch - subscribeToJob will auto-update
        }}
      />

      <WorkOrderBuilder
        open={showWorkOrder}
        onClose={() => setShowWorkOrder(false)}
        job={job}
        onSave={handleWorkOrderSave}
        onProcessQuote={async (workOrderData) => {
          await handleWorkOrderSave(workOrderData);
          setShowWorkOrder(false);
          setShowQuoteBuilder(true);
        }}
      />

      {/* Invoice Builder - uses QuoteBuilderModal in invoice mode */}
      <QuoteBuilderModal
        job={job}
        isOpen={showInvoiceBuilder}
        onClose={() => setShowInvoiceBuilder(false)}
        mode="invoice"
        onQuoteCreated={(invoiceId) => {
          setShowInvoiceBuilder(false);
          // No need to manually fetch - subscribeToJob will auto-update
        }}
      />

      {/* Parts & Services Detail Modal */}
      <Dialog open={showPartsServicesModal} onOpenChange={setShowPartsServicesModal}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              {t('jobs.partsAdded')} & {t('jobs.servicesAdded')}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-6 mt-4">
            {/* Diagnostic Findings - Show first */}
            {job.workOrderData?.findings && job.workOrderData.findings.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-muted-foreground uppercase mb-3 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  {t('jobDetail.diagnosticFindings')} ({job.workOrderData.findings.length})
                </h3>
                <div className="space-y-2">
                  {job.workOrderData.findings.map((finding) => (
                    <div key={finding.id} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 border">
                      <AlertTriangle className={`h-4 w-4 mt-0.5 shrink-0 ${finding.requiresReplacement ? 'text-amber-500' : 'text-muted-foreground'}`} />
                      <div className="flex-1">
                        <p className="text-sm">{finding.description}</p>
                        {finding.requiresReplacement && (
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0 mt-1 border-amber-500/50 text-amber-600">
                            Replacement Required
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Services List - Show second */}
            {job.workOrderData?.workItems && job.workOrderData.workItems.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-muted-foreground uppercase mb-3 flex items-center gap-2">
                  <Wrench className="h-4 w-4" />
                  {t('jobDetail.services')} ({job.workOrderData.workItems.length})
                </h3>
                <div className="space-y-2">
                  {job.workOrderData.workItems.map((item) => (
                    <div key={item.id} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 border">
                      <Wrench className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{item.serviceName}</p>
                        {item.description && item.description !== item.serviceName && (
                          <p className="text-xs text-muted-foreground mt-0.5">{item.description}</p>
                        )}
                        <div className="flex items-center gap-3 mt-1 flex-wrap">
                          {item.durationHours > 0 && (
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {item.durationHours}h
                            </span>
                          )}
                          {item.isImmediate && (
                            <Badge variant="destructive" className="text-[10px] px-1.5 py-0">{t('status.immediate')}</Badge>
                          )}
                          {!isMechanic && item.fixedPrice != null && (
                            <span className="text-xs font-medium text-primary">€{item.fixedPrice.toFixed(2)}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Parts List - Show third */}
            {job.workOrderData?.parts && job.workOrderData.parts.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-muted-foreground uppercase mb-3 flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  {t('jobDetail.parts')} ({job.workOrderData.parts.length})
                </h3>
                <div className="space-y-2">
                  {job.workOrderData.parts.map((part) => (
                    <div key={part.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border">
                      <Package className="h-4 w-4 text-primary shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{part.partName}</p>
                        {part.partNumber && (
                          <p className="text-xs text-muted-foreground font-mono">#{part.partNumber}</p>
                        )}
                        {part.description && (
                          <p className="text-xs text-muted-foreground mt-0.5">{part.description}</p>
                        )}
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-medium">×{part.quantity}</p>
                        {!isMechanic && part.unitPrice > 0 && (
                          <p className="text-xs text-muted-foreground">€{part.unitPrice.toFixed(2)}</p>
                        )}
                        {part.needsOrdering && (
                          <Badge variant="outline" className="text-[10px] mt-1 text-orange-600 border-orange-600">
                            {t('status.needsOrder')}
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
