import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Check, User, Car, FileText, Eye, X, Loader2, Sparkles, AlertTriangle } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useIsMobile } from '@/hooks/use-mobile';
import { addJob, generateId, findOrCreateCustomer, linkVehicleToCustomer, updateVehicle, findCustomerByPhone } from '@/services/firestoreService';
import { notifyJobAssigned } from '@/services/notificationService';
import { JobPriority, Vehicle, ServiceType, Job, CustomerComplaint } from '@/lib/types';
import { cn, generateJobNumber } from '@/lib/utils';
import { translateJobProblemDescription } from '@/lib/jobTranslation';

import { CustomerStep } from './steps/CustomerStep';
import { VehicleStep } from './steps/VehicleStep';
import { DetailsStep } from './steps/DetailsStep';
import { FaultCategoryStep } from './steps/FaultCategoryStep';
import { ReviewStep } from './steps/ReviewStep';
import { CustomerComplaintWarningModal } from '@/components/customer/CustomerComplaintWarningModal';

export interface JobFormData {
  // Customer fields
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  customerNotes: string;
  customerPostCode: string;
  customerRegion: string;
  isReturningCustomer: boolean;
  customerId?: string;
  // Vehicle fields
  vehicleId: string;
  mileage: string;
  // Job details
  problemDescription: string;
  priority: JobPriority;
  serviceType: ServiceType;
  faultCategory?: string;
  assignedMechanicId: string;
  scheduledDate: Date | undefined;
  estimatedDuration: number;
}

export type JobFormErrors = Partial<Record<keyof JobFormData, string>>;

const steps = [
  { id: 'vehicle', labelKey: 'jobs.steps.vehicle', icon: Car },
  { id: 'customer', labelKey: 'jobs.steps.customer', icon: User },
  { id: 'details', labelKey: 'jobs.steps.details', icon: FileText },
  { id: 'category', labelKey: 'jobs.steps.category', icon: AlertTriangle },
  { id: 'review', labelKey: 'jobs.steps.review', icon: Eye },
];

export default function CreateJobWizard() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [currentStep, setCurrentStep] = useState(0);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isSubmittingRef = useRef(false); // Ref for immediate blocking of duplicate submissions
  const [complaintWarningOpen, setComplaintWarningOpen] = useState(false);
  const [pendingComplaints, setPendingComplaints] = useState<CustomerComplaint[]>([]);
  const [complaintCheckDone, setComplaintCheckDone] = useState(false);
  const [formData, setFormData] = useState<JobFormData>({
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    customerNotes: '',
    customerPostCode: '',
    customerRegion: '',
    isReturningCustomer: false,
    vehicleId: '',
    mileage: '',
    problemDescription: '',
    priority: 'normal',
    serviceType: 'repair',
    assignedMechanicId: '',
    scheduledDate: undefined,
    estimatedDuration: 60,
  });
  const [errors, setErrors] = useState<JobFormErrors>({});

  const updateFormData = (updates: Partial<JobFormData>) => {
    setFormData(prev => ({ ...prev, ...updates }));
    // Clear errors for updated fields
    const clearedErrors = { ...errors };
    Object.keys(updates).forEach(key => {
      delete clearedErrors[key as keyof JobFormData];
    });
    setErrors(clearedErrors);
    // Reset complaint check when customer phone changes
    if ('customerPhone' in updates) {
      setComplaintCheckDone(false);
      setPendingComplaints([]);
    }
  };

  const validateStep = (step: number): boolean => {
    const newErrors: JobFormErrors = {};

    switch (step) {
      case 0: // Vehicle (now first)
        if (!formData.vehicleId) {
          newErrors.vehicleId = t('validation.selectVehicle');
        }
        break;
      case 1: // Customer (now second)
        if (!formData.customerName.trim()) {
          newErrors.customerName = t('validation.customerNameRequired');
        }
        if (!formData.customerPhone.trim()) {
          newErrors.customerPhone = t('validation.phoneRequired');
        }
        if (formData.customerEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.customerEmail)) {
          newErrors.customerEmail = t('validation.invalidEmail');
        }
        break;
      case 2: // Details
        if (formData.problemDescription.length < 10) {
          newErrors.problemDescription = t('validation.descriptionMinLength');
        }
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const checkCustomerComplaints = async () => {
    if (!formData.customerPhone.trim()) return;
    try {
      const customer = await findCustomerByPhone(formData.customerPhone.trim());
      if (customer?.complaints && customer.complaints.length > 0 && !complaintCheckDone) {
        setPendingComplaints(customer.complaints);
        setComplaintWarningOpen(true);
        return true; // has complaints, modal shown
      }
    } catch (error) {
      console.error('Error checking customer complaints:', error);
    }
    return false; // no complaints or already acknowledged
  };

  const nextStep = async () => {
    if (validateStep(currentStep)) {
      // Check for complaints when leaving customer step
      if (currentStep === 1 && !complaintCheckDone) {
        const hasComplaints = await checkCustomerComplaints();
        if (hasComplaints) return; // wait for modal acknowledgement
      }
      setCurrentStep(prev => Math.min(prev + 1, steps.length - 1));
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 0));
  };

  const goToStep = (step: number) => {
    if (step < currentStep) {
      setCurrentStep(step);
    }
  };

  const handleSubmit = async () => {
    // Use ref for immediate blocking (synchronous check)
    if (!user || isSubmittingRef.current) return;

    // Set both ref (immediate) and state (for UI)
    isSubmittingRef.current = true;
    setIsSubmitting(true);

    try {
      // Auto-save customer to customers collection (like vehicles pattern)
      const customerId = await findOrCreateCustomer(
        formData.customerName,
        formData.customerPhone,
        formData.customerEmail || undefined,
        formData.customerPostCode || undefined,
        formData.customerRegion || undefined
      );

      // Link vehicle to customer
      if (formData.vehicleId && customerId) {
        await linkVehicleToCustomer(customerId, formData.vehicleId);
        // Also set customerId on vehicle if not already set
        if (selectedVehicle && !selectedVehicle.customerId) {
          await updateVehicle(selectedVehicle.id, { customerId });
        }
      }

      const newJob = {
        jobNumber: generateJobNumber(),
        vehicleId: formData.vehicleId,
        // Denormalized vehicle fields for display
        ...(selectedVehicle && {
          vehicleLicensePlate: selectedVehicle.licensePlate,
          vehicleBrand: selectedVehicle.brand,
          vehicleModel: selectedVehicle.model,
          vehicleYear: selectedVehicle.year,
          ...(selectedVehicle.vin && { vehicleVin: selectedVehicle.vin }),
          ...(selectedVehicle.fuelType && { vehicleFuelType: selectedVehicle.fuelType }),
        }),
        customerId,
        customerName: formData.customerName,
        customerPhone: formData.customerPhone,
        ...(formData.customerPostCode && { customerPostCode: formData.customerPostCode }),
        ...(formData.customerRegion && { customerRegion: formData.customerRegion }),
        problemDescription: formData.problemDescription,
        priority: formData.priority,
        serviceType: formData.serviceType,
        status: 'not_started' as const,
        estimatedDuration: formData.estimatedDuration,
        createdBy: user.id,
        ...(formData.scheduledDate && { scheduledDate: formData.scheduledDate.toISOString() }),
        ...(formData.customerEmail && { customerEmail: formData.customerEmail }),
        ...(formData.customerNotes && { customerNotes: formData.customerNotes }),
        ...(formData.faultCategory && { faultCategory: formData.faultCategory }),
        ...(formData.assignedMechanicId && { assignedMechanicId: formData.assignedMechanicId }),
        ...(formData.mileage && { mileage: parseInt(formData.mileage) }),
      };

      // Translate problem description before saving
      const translatedJob = await translateJobProblemDescription(newJob);
      const jobId = await addJob(translatedJob, user.id);
      console.log('Created job with ID:', jobId);

      // Send notification if job is assigned to a mechanic
      if (formData.assignedMechanicId) {
        try {
          await notifyJobAssigned(
            jobId,
            formData.assignedMechanicId,
            `${formData.customerName} - ${translatedJob.jobNumber}`
          );
        } catch (notifError) {
          console.error('Error sending assignment notification:', notifError);
          // Don't fail the job creation if notification fails
        }
      }

      toast({
        title: t('jobs.newJob'),
        description: t('jobs.createdSuccess'),
      });

      // Navigate after successful creation - use window.location for reliable navigation
      window.location.href = user.role === 'office_staff' ? '/office' : '/jobs';
    } catch (error) {
      console.error('Error creating job:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to create job. Please try again.',
      });
      // Only reset on error so user can retry
      isSubmittingRef.current = false;
      setIsSubmitting(false);
    }
  };

  const handleVehicleSelect = (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle);
    updateFormData({ vehicleId: vehicle.id });
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0: // Vehicle first
        return (
          <VehicleStep
            formData={formData}
            selectedVehicle={selectedVehicle}
            error={errors.vehicleId}
            onVehicleSelect={handleVehicleSelect}
            onClearVehicle={() => {
              setSelectedVehicle(null);
              updateFormData({ vehicleId: '', mileage: '' });
            }}
            onUpdate={updateFormData}
          />
        );
      case 1: // Customer second
        return (
          <CustomerStep
            formData={formData}
            errors={errors}
            onUpdate={updateFormData}
            selectedVehicle={selectedVehicle}
          />
        );
      case 2:
        return (
          <DetailsStep
            formData={formData}
            errors={errors}
            onUpdate={updateFormData}
            hideScheduling={user?.role === 'office_staff'}
          />
        );
      case 3:
        return (
          <FaultCategoryStep
            formData={formData}
            errors={errors}
            onUpdate={updateFormData}
          />
        );
      case 4:
        return (
          <ReviewStep
            formData={formData}
            selectedVehicle={selectedVehicle}
            onEdit={goToStep}
            hideScheduling={user?.role === 'office_staff'}
          />
        );
      default:
        return null;
    }
  };

  const isMobile = useIsMobile();

  // Desktop Layout
  if (!isMobile) {
    return (
      <div className="min-h-screen bg-background relative overflow-hidden">
        {/* Premium Gradient Background with Animated Orbs */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute inset-0 gradient-royal-radial opacity-5" />
          <div className="absolute top-0 right-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse-subtle" />
          <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-gold/10 rounded-full blur-3xl animate-pulse-subtle" style={{ animationDelay: '1s' }} />
        </div>

        {/* Premium Glassmorphic Header */}
        <div className="relative border-b glass-light backdrop-blur-xl">
          <div className="max-w-6xl mx-auto px-6 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-6">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => navigate(user?.role === 'office_staff' ? '/office' : -1 as any)}
                  className="hover:bg-primary/10 hover:text-primary transition-all"
                >
                  <ArrowLeft className="h-5 w-5" />
                </Button>
                <div>
                  <h1 className="text-3xl font-bold text-gradient-royal flex items-center gap-2">
                    {t('jobs.newJob')}
                    {currentStep === steps.length - 1 && (
                      <Sparkles className="h-6 w-6 text-gold animate-pulse" />
                    )}
                  </h1>
                  <p className="text-sm text-muted-foreground mt-1 flex items-center gap-2">
                    <span className="px-3 py-1 rounded-full bg-primary/10 text-primary font-medium">
                      Step {currentStep + 1} of {steps.length}
                    </span>
                    <span className="text-foreground/60">—</span>
                    <span>{steps[currentStep].label}</span>
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                onClick={() => navigate(user?.role === 'office_staff' ? '/office' : '/jobs')}
                className="hover:bg-destructive/10 hover:text-destructive transition-all"
              >
                <X className="h-5 w-5 mr-2" />
                {t('common.cancel')}
              </Button>
            </div>
          </div>
        </div>

        <div className="max-w-6xl mx-auto p-8 relative">
          <div className="grid grid-cols-4 gap-8">
            {/* Premium Glassmorphic Left Sidebar - Steps */}
            <div className="col-span-1">
              <Card className="glass-strong border-0 shadow-premium-lg sticky top-8 overflow-hidden">
                <div className="absolute inset-0 gradient-royal-radial opacity-5" />
                <div className="relative p-6 space-y-2">
                  {steps.map((step, index) => {
                    const Icon = step.icon;
                    const isCompleted = index < currentStep;
                    const isCurrent = index === currentStep;

                    return (
                      <button
                        key={step.id}
                        onClick={() => goToStep(index)}
                        disabled={index > currentStep}
                        className={cn(
                          "w-full flex items-center gap-4 p-4 rounded-xl text-left transition-all duration-300 group relative overflow-hidden",
                          isCompleted && "text-primary hover:bg-primary/5",
                          isCurrent && "glass-light text-primary shadow-glow",
                          !isCompleted && !isCurrent && "text-muted-foreground hover:bg-muted/50",
                          index > currentStep && "opacity-40 cursor-not-allowed"
                        )}
                      >
                        {/* Premium icon circle with gradient */}
                        <div
                          className={cn(
                            "relative w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 text-sm shrink-0",
                            isCompleted && "gradient-royal shadow-glow",
                            isCurrent && "gradient-royal shadow-glow scale-110",
                            !isCompleted && !isCurrent && "bg-muted group-hover:bg-muted-foreground/20"
                          )}
                        >
                          {isCompleted ? (
                            <Check className="h-5 w-5 text-white" />
                          ) : (
                            <Icon className={cn(
                              "h-5 w-5",
                              isCurrent && "text-white",
                              !isCurrent && !isCompleted && "text-muted-foreground"
                            )} />
                          )}
                          {isCurrent && index === steps.length - 1 && (
                            <Sparkles className="absolute -top-1 -right-1 h-4 w-4 text-gold animate-pulse" />
                          )}
                        </div>
                        <div className="flex-1">
                          <p className={cn(
                            "font-semibold text-sm mb-0.5 transition-colors",
                            isCurrent && "text-primary"
                          )}>
                            {t(step.labelKey)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {index === 0 && t('jobs.steps.vehicleDesc')}
                            {index === 1 && t('jobs.steps.customerDesc')}
                            {index === 2 && t('jobs.steps.detailsDesc')}
                            {index === 3 && t('jobs.steps.categoryDesc')}
                            {index === 4 && t('jobs.steps.reviewDesc')}
                          </p>
                        </div>
                        {/* Animated progress indicator */}
                        {isCurrent && (
                          <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-primary to-gold rounded-r-full" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </Card>
            </div>

            {/* Premium Main Content Area */}
            <div className="col-span-3">
              {/* Content with slide animation */}
              <div className="animate-slide-up" key={currentStep}>
                {renderStepContent()}
              </div>

              {/* Premium Desktop Navigation with glassmorphism */}
              <div className="flex justify-between items-center mt-8 pt-6 glass-light rounded-2xl px-6 py-4 border-0 shadow-premium">
                <Button
                  type="button"
                  variant="outline"
                  onClick={currentStep > 0 ? prevStep : () => navigate(user?.role === 'office_staff' ? '/office' : '/jobs')}
                  size="lg"
                  className="hover:bg-muted hover:border-primary/50 transition-all hover-lift h-12 px-6"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  {currentStep > 0 ? t('common.back') : t('common.cancel')}
                </Button>

                {currentStep < steps.length - 1 ? (
                  <Button
                    type="button"
                    onClick={nextStep}
                    size="lg"
                    className="gradient-royal hover:shadow-glow transition-all h-12 px-8 font-semibold"
                  >
                    {t('common.continue')}
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                ) : (
                  <Button
                    type="button"
                    onClick={handleSubmit}
                    size="lg"
                    disabled={isSubmitting}
                    className="gradient-gold hover:shadow-glow-gold transition-all h-12 px-8 font-semibold text-gold-foreground"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        {t('jobs.creatingJob')}
                      </>
                    ) : (
                      <>
                        <Check className="mr-2 h-5 w-5" />
                        {t('dashboard.createJob')}
                        <Sparkles className="ml-2 h-4 w-4 animate-pulse" />
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Customer Complaint Warning Modal */}
        <CustomerComplaintWarningModal
          open={complaintWarningOpen}
          onOpenChange={setComplaintWarningOpen}
          customerName={formData.customerName}
          complaints={pendingComplaints}
          onContinue={() => {
            setComplaintWarningOpen(false);
            setComplaintCheckDone(true);
            setCurrentStep(prev => Math.min(prev + 1, steps.length - 1));
          }}
          onGoBack={() => {
            setComplaintWarningOpen(false);
          }}
        />
      </div>
    );
  }

  // Mobile Layout
  return (
    <div className="safe-top min-h-screen bg-background relative overflow-hidden">
      {/* Premium Mobile Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 gradient-royal-radial opacity-5" />
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl animate-pulse-subtle" />
        <div className="absolute bottom-1/3 left-0 w-64 h-64 bg-gold/10 rounded-full blur-3xl animate-pulse-subtle" style={{ animationDelay: '1s' }} />
      </div>

      {/* Premium Glassmorphic Header */}
      <div className="relative px-4 pt-4 pb-3 flex items-center gap-4 glass-light border-b backdrop-blur-xl">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate(user?.role === 'office_staff' ? '/office' : -1 as any)}
          className="hover:bg-primary/10 hover:text-primary transition-all"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-gradient-royal flex items-center gap-2">
            {t('jobs.newJob')}
            {currentStep === steps.length - 1 && (
              <Sparkles className="h-5 w-5 text-gold animate-pulse" />
            )}
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium text-xs">
              Step {currentStep + 1}/{steps.length}
            </span>
          </p>
        </div>
      </div>

      {/* Premium Step Indicator with Glassmorphism */}
      <div className="relative px-4 py-6">
        <div className="glass-light rounded-2xl p-4 border-0 shadow-premium">
          <div className="flex items-center justify-between relative">
            {/* Premium Animated Progress Line */}
            <div className="absolute top-5 left-0 right-0 h-1 bg-muted/50 rounded-full mx-8">
              <div
                className="h-full gradient-royal rounded-full transition-all duration-500 ease-out shadow-glow"
                style={{ width: `${(currentStep / (steps.length - 1)) * 100}%` }}
              />
            </div>

            {steps.map((step, index) => {
              const Icon = step.icon;
              const isCompleted = index < currentStep;
              const isCurrent = index === currentStep;

              return (
                <button
                  key={step.id}
                  onClick={() => goToStep(index)}
                  disabled={index > currentStep}
                  className="relative z-10 flex flex-col items-center gap-2 transition-all touch-manipulation"
                >
                  <div
                    className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 relative",
                      isCompleted && "gradient-royal shadow-glow scale-105",
                      isCurrent && "gradient-royal shadow-glow scale-110 ring-4 ring-primary/20",
                      !isCompleted && !isCurrent && "bg-muted text-muted-foreground"
                    )}
                  >
                    {isCompleted ? (
                      <Check className="h-5 w-5 text-white" />
                    ) : (
                      <Icon className={cn(
                        "h-5 w-5",
                        isCurrent && "text-white",
                        !isCurrent && !isCompleted && "text-muted-foreground"
                      )} />
                    )}
                    {isCurrent && index === steps.length - 1 && (
                      <Sparkles className="absolute -top-1 -right-1 h-3 w-3 text-gold animate-pulse" />
                    )}
                  </div>
                  <span
                    className={cn(
                      "text-xs font-medium transition-colors",
                      isCurrent && "text-primary font-semibold",
                      !isCurrent && "text-muted-foreground"
                    )}
                  >
                    {t(step.labelKey)}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Premium Step Content with slide animation */}
      <div className="relative px-4 pb-32 animate-slide-up" key={currentStep}>
        {renderStepContent()}
      </div>

      {/* Premium Navigation Buttons - Fixed at bottom with glassmorphism */}
      <div className="fixed bottom-0 left-0 right-0 glass-strong backdrop-blur-xl border-t border-border/50 p-4 safe-bottom shadow-premium-xl">
        <div className="flex gap-3 max-w-lg mx-auto">
          {currentStep > 0 && (
            <Button
              type="button"
              variant="outline"
              onClick={prevStep}
              className="flex-1 h-12 hover:bg-muted hover:border-primary/50 transition-all font-medium"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t('common.back')}
            </Button>
          )}

          {currentStep < steps.length - 1 ? (
            <Button
              type="button"
              onClick={nextStep}
              className="flex-1 h-12 gradient-royal hover:shadow-glow transition-all font-semibold"
            >
              {t('common.continue')}
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          ) : (
            <Button
              type="button"
              onClick={handleSubmit}
              className="flex-1 h-12 gradient-gold hover:shadow-glow-gold transition-all font-semibold text-gold-foreground"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  {t('jobs.creatingJob')}
                </>
              ) : (
                <>
                  <Check className="mr-2 h-5 w-5" />
                  {t('dashboard.createJob')}
                  <Sparkles className="ml-2 h-4 w-4 animate-pulse" />
                </>
              )}
            </Button>
          )}
        </div>
      </div>

      {/* Customer Complaint Warning Modal */}
      <CustomerComplaintWarningModal
        open={complaintWarningOpen}
        onOpenChange={setComplaintWarningOpen}
        customerName={formData.customerName}
        complaints={pendingComplaints}
        onContinue={() => {
          setComplaintWarningOpen(false);
          setComplaintCheckDone(true);
          setCurrentStep(prev => Math.min(prev + 1, steps.length - 1));
        }}
        onGoBack={() => {
          setComplaintWarningOpen(false);
        }}
      />
    </div>
  );
}
