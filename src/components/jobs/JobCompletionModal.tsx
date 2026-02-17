import React, { useState, useEffect } from 'react';
import {
  CheckCircle,
  AlertCircle,
  Wrench,
  Car,
  Sparkles,
  Package,
  ChevronRight,
  ChevronLeft,
  Minus,
  Plus,
  Trash2,
  ClipboardCheck,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';
import { Job, WorkOrderFinding, WorkOrderPart } from '@/lib/types';

export interface CompletionData {
  faultsChecked: Array<{
    id: string;
    description: string;
    fixed: boolean;
    notes?: string;
  }>;
  partsConfirmed: Array<{
    id: string;
    partName: string;
    partNumber?: string;
    originalQuantity: number;
    confirmedQuantity: number;
    removed: boolean;
  }>;
  completionNotes?: string;
}

interface JobCompletionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (completionData: CompletionData) => void;
  job: Job;
}

function SuccessAnimation({ onComplete, successText, successMessage }: {
  onComplete: () => void;
  successText: string;
  successMessage: string;
}) {
  const [stage, setStage] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setStage(1), 100),
      setTimeout(() => setStage(2), 600),
      setTimeout(() => setStage(3), 1200),
      setTimeout(() => setStage(4), 1800),
      setTimeout(() => onComplete(), 3000),
    ];
    return () => timers.forEach(clearTimeout);
  }, [onComplete]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 backdrop-blur-sm">
      <div className="relative flex flex-col items-center">
        <div className="relative w-48 h-48 mb-8">
          <div className={cn(
            'absolute inset-0 flex items-center justify-center transition-all duration-500',
            stage >= 1 ? 'opacity-100 scale-100' : 'opacity-0 scale-75'
          )}>
            <Car className="h-24 w-24 text-primary" strokeWidth={1.5} />
          </div>
          <div className={cn(
            'absolute top-4 right-4 transition-all duration-300',
            stage >= 2 ? 'opacity-100 rotate-0' : 'opacity-0 -rotate-45'
          )}>
            <Wrench className="h-8 w-8 text-amber-500 animate-bounce" />
          </div>
          <div className={cn(
            'absolute bottom-8 left-4 transition-all duration-300 delay-200',
            stage >= 2 ? 'opacity-100 rotate-0' : 'opacity-0 rotate-45'
          )}>
            <Wrench className="h-6 w-6 text-amber-500 animate-bounce" style={{ animationDelay: '200ms' }} />
          </div>
          {stage >= 3 && (
            <>
              <Sparkles className="absolute top-0 left-1/2 h-6 w-6 text-yellow-400 animate-ping" style={{ animationDuration: '1s' }} />
              <Sparkles className="absolute top-8 right-0 h-5 w-5 text-yellow-400 animate-ping" style={{ animationDuration: '1.2s', animationDelay: '200ms' }} />
              <Sparkles className="absolute bottom-4 left-8 h-4 w-4 text-yellow-400 animate-ping" style={{ animationDuration: '0.8s', animationDelay: '400ms' }} />
            </>
          )}
          <div className={cn(
            'absolute -bottom-4 left-1/2 -translate-x-1/2 transition-all duration-500',
            stage >= 4 ? 'opacity-100 scale-100' : 'opacity-0 scale-0'
          )}>
            <div className="rounded-full bg-green-500 p-3 shadow-lg shadow-green-500/30">
              <CheckCircle className="h-8 w-8 text-white" />
            </div>
          </div>
        </div>
        <div className={cn(
          'text-center transition-all duration-500',
          stage >= 4 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
        )}>
          <h2 className="text-2xl font-bold text-foreground mb-2">{successText}</h2>
          <p className="text-muted-foreground">{successMessage}</p>
        </div>
      </div>
    </div>
  );
}

export function JobCompletionModal({
  open,
  onOpenChange,
  onConfirm,
  job,
}: JobCompletionModalProps) {
  const { t } = useLanguage();
  const [showSuccess, setShowSuccess] = useState(false);
  const [step, setStep] = useState(1); // 1: Faults, 2: Parts, 3: Confirm
  const [completionNotes, setCompletionNotes] = useState('');

  // Build fault checklist from work order findings + problem description
  const [faults, setFaults] = useState<Array<{
    id: string;
    description: string;
    fixed: boolean;
    notes: string;
  }>>([]);

  // Build parts list from work order parts
  const [parts, setParts] = useState<Array<{
    id: string;
    partName: string;
    partNumber?: string;
    originalQuantity: number;
    confirmedQuantity: number;
    removed: boolean;
  }>>([]);

  // Initialize data when modal opens
  useEffect(() => {
    if (open) {
      setStep(1);
      setCompletionNotes('');

      // Build faults from work order findings
      const faultItems: typeof faults = [];

      if (job.workOrderData?.findings && job.workOrderData.findings.length > 0) {
        job.workOrderData.findings.forEach(f => {
          faultItems.push({
            id: f.id,
            description: f.description,
            fixed: false,
            notes: '',
          });
        });
      } else {
        // Fallback: use problem description as single fault
        faultItems.push({
          id: 'problem-desc',
          description: job.problemDescription,
          fixed: false,
          notes: '',
        });
      }

      setFaults(faultItems);

      // Build parts from work order
      const partItems: typeof parts = [];
      if (job.workOrderData?.parts && job.workOrderData.parts.length > 0) {
        job.workOrderData.parts.forEach(p => {
          partItems.push({
            id: p.id,
            partName: p.partName,
            partNumber: p.partNumber,
            originalQuantity: p.quantity,
            confirmedQuantity: p.quantity,
            removed: false,
          });
        });
      }

      setParts(partItems);
    }
  }, [open, job]);

  const toggleFault = (id: string) => {
    setFaults(prev => prev.map(f =>
      f.id === id ? { ...f, fixed: !f.fixed } : f
    ));
  };

  const updateFaultNotes = (id: string, notes: string) => {
    setFaults(prev => prev.map(f =>
      f.id === id ? { ...f, notes } : f
    ));
  };

  const updatePartQuantity = (id: string, qty: number) => {
    setParts(prev => prev.map(p =>
      p.id === id ? { ...p, confirmedQuantity: Math.max(0, qty) } : p
    ));
  };

  const togglePartRemoved = (id: string) => {
    setParts(prev => prev.map(p =>
      p.id === id ? { ...p, removed: !p.removed } : p
    ));
  };

  const allFaultsChecked = faults.every(f => f.fixed);
  const hasFaults = faults.length > 0;
  const hasParts = parts.length > 0;

  // Determine total steps
  const totalSteps = hasParts ? 3 : 2; // Faults → Parts (if any) → Confirm
  const getStepLabel = (s: number) => {
    if (s === 1) return t('modal.completion.faultCheck');
    if (s === 2 && hasParts) return t('modal.completion.partsUsed');
    return t('modal.completion.confirmStep');
  };

  const canProceed = () => {
    if (step === 1) return true; // Can proceed even if not all checked (will show warning)
    if (step === 2 && hasParts) return true;
    return true;
  };

  const handleNext = () => {
    if (step === 1 && hasParts) {
      setStep(2);
    } else {
      setStep(hasParts ? 3 : 2);
    }
  };

  const handleBack = () => {
    if (step === 3 || (step === 2 && hasParts)) {
      setStep(step - 1);
    }
  };

  const isLastStep = hasParts ? step === 3 : step === 2;

  const handleComplete = () => {
    const completionData: CompletionData = {
      faultsChecked: faults.map(f => ({
        id: f.id,
        description: f.description,
        fixed: f.fixed,
        notes: f.notes || undefined,
      })),
      partsConfirmed: parts.map(p => ({
        id: p.id,
        partName: p.partName,
        partNumber: p.partNumber,
        originalQuantity: p.originalQuantity,
        confirmedQuantity: p.confirmedQuantity,
        removed: p.removed,
      })),
      completionNotes: completionNotes || undefined,
    };

    onConfirm(completionData);
    onOpenChange(false);
    setShowSuccess(true);
  };

  const handleAnimationComplete = () => {
    setShowSuccess(false);
  };

  if (showSuccess) {
    return (
      <SuccessAnimation
        onComplete={handleAnimationComplete}
        successText={t('modal.completion.success')}
        successMessage={t('modal.completion.successMessage')}
      />
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            {t('modal.completion.complete')}
          </DialogTitle>
          <DialogDescription>
            {t('modal.completion.stepOf').replace('{step}', String(step)).replace('{total}', String(totalSteps))}: {getStepLabel(step)}
          </DialogDescription>
        </DialogHeader>

        {/* Step indicators */}
        <div className="flex gap-1 px-1">
          {Array.from({ length: totalSteps }, (_, i) => (
            <div
              key={i}
              className={cn(
                'h-1.5 flex-1 rounded-full transition-colors',
                i < step ? 'bg-green-500' : 'bg-muted'
              )}
            />
          ))}
        </div>

        <ScrollArea className="flex-1 max-h-[50vh]">
          {/* Step 1: Fault Checklist */}
          {step === 1 && (
            <div className="space-y-4 p-1">
              <div className="flex items-center gap-2 text-sm font-medium">
                <ClipboardCheck className="h-4 w-4 text-amber-500" />
                {t('modal.completion.haveFaultsFixed')}
              </div>

              <div className="space-y-3">
                {faults.map(fault => (
                  <div
                    key={fault.id}
                    className={cn(
                      'p-3 rounded-lg border-2 transition-all',
                      fault.fixed
                        ? 'border-green-500/50 bg-green-50 dark:bg-green-950/20'
                        : 'border-border bg-card'
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <button
                        onClick={() => toggleFault(fault.id)}
                        className={cn(
                          'mt-0.5 h-5 w-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors',
                          fault.fixed
                            ? 'bg-green-500 border-green-500 text-white'
                            : 'border-muted-foreground/40'
                        )}
                      >
                        {fault.fixed && <CheckCircle className="h-3 w-3" />}
                      </button>
                      <div className="flex-1 min-w-0">
                        <p className={cn(
                          'text-sm',
                          fault.fixed && 'line-through text-muted-foreground'
                        )}>
                          {fault.description}
                        </p>
                        {!fault.fixed && (
                          <Input
                            placeholder={t('modal.completion.addNoteOptional')}
                            value={fault.notes}
                            onChange={e => updateFaultNotes(fault.id, e.target.value)}
                            className="mt-2 h-8 text-xs"
                          />
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {!allFaultsChecked && faults.length > 1 && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800">
                  <AlertCircle className="h-4 w-4 text-amber-600 shrink-0" />
                  <p className="text-xs text-amber-700 dark:text-amber-400">
                    {t('modal.completion.faultsNotFixed').replace('{count}', String(faults.filter(f => !f.fixed).length))}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Step 2: Parts Confirmation */}
          {step === 2 && hasParts && (
            <div className="space-y-4 p-1">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Package className="h-4 w-4 text-blue-500" />
                {t('modal.completion.confirmPartsUsed')}
              </div>

              <div className="space-y-3">
                {parts.map(part => (
                  <div
                    key={part.id}
                    className={cn(
                      'p-3 rounded-lg border transition-all',
                      part.removed
                        ? 'border-red-200 bg-red-50/50 dark:bg-red-950/10 opacity-60'
                        : 'border-border bg-card'
                    )}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className={cn(
                          'font-medium text-sm',
                          part.removed && 'line-through text-muted-foreground'
                        )}>
                          {part.partName}
                        </p>
                        {part.partNumber && (
                          <p className="text-xs text-muted-foreground">{part.partNumber}</p>
                        )}
                      </div>

                      {!part.removed && (
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => updatePartQuantity(part.id, part.confirmedQuantity - 1)}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <Input
                            type="number"
                            min={0}
                            value={part.confirmedQuantity}
                            onChange={e => updatePartQuantity(part.id, Number(e.target.value))}
                            className="w-16 h-7 text-center text-sm"
                          />
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => updatePartQuantity(part.id, part.confirmedQuantity + 1)}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                      )}

                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => togglePartRemoved(part.id)}
                      >
                        {part.removed ? (
                          <Plus className="h-3 w-3 text-green-600" />
                        ) : (
                          <Trash2 className="h-3 w-3 text-destructive" />
                        )}
                      </Button>
                    </div>

                    {part.confirmedQuantity !== part.originalQuantity && !part.removed && (
                      <p className="text-xs text-amber-600 mt-1">
                        {t('modal.completion.changedQuantity').replace('{original}', String(part.originalQuantity)).replace('{confirmed}', String(part.confirmedQuantity))}
                      </p>
                    )}
                  </div>
                ))}
              </div>

              {parts.some(p => p.removed) && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800">
                  <AlertCircle className="h-4 w-4 text-amber-600 shrink-0" />
                  <p className="text-xs text-amber-700 dark:text-amber-400">
                    {t('modal.completion.partsNotUsed').replace('{count}', String(parts.filter(p => p.removed).length))}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Step 3 (or 2 if no parts): Confirmation */}
          {isLastStep && (
            <div className="space-y-4 p-1">
              <div className="flex items-center gap-2 text-sm font-medium">
                <CheckCircle className="h-4 w-4 text-green-500" />
                {t('modal.completion.reviewConfirm')}
              </div>

              {/* Faults summary */}
              <div className="p-3 rounded-lg bg-muted/50 space-y-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase">{t('modal.completion.faults')}</p>
                {faults.map(f => (
                  <div key={f.id} className="flex items-center gap-2 text-sm">
                    {f.fixed ? (
                      <CheckCircle className="h-3.5 w-3.5 text-green-500 shrink-0" />
                    ) : (
                      <AlertCircle className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                    )}
                    <span className={cn(!f.fixed && 'text-amber-700 dark:text-amber-400')}>
                      {f.description}
                      {!f.fixed && ` ${t('modal.completion.notFixed')}`}
                    </span>
                  </div>
                ))}
              </div>

              {/* Parts summary */}
              {hasParts && (
                <div className="p-3 rounded-lg bg-muted/50 space-y-2">
                  <p className="text-xs font-semibold text-muted-foreground uppercase">{t('modal.completion.partsUsed')}</p>
                  {parts.filter(p => !p.removed).map(p => (
                    <div key={p.id} className="flex items-center justify-between text-sm">
                      <span>{p.partName}</span>
                      <Badge variant="secondary" className="text-xs">
                        x{p.confirmedQuantity}
                        {p.confirmedQuantity !== p.originalQuantity && (
                          <span className="text-amber-600 ml-1">(was {p.originalQuantity})</span>
                        )}
                      </Badge>
                    </div>
                  ))}
                  {parts.filter(p => p.removed).map(p => (
                    <div key={p.id} className="flex items-center justify-between text-sm text-muted-foreground line-through">
                      <span>{p.partName}</span>
                      <Badge variant="outline" className="text-xs">{t('modal.completion.removed')}</Badge>
                    </div>
                  ))}
                </div>
              )}

              {/* Completion notes */}
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">
                  {t('modal.completion.additionalNotes')}
                </p>
                <Textarea
                  value={completionNotes}
                  onChange={e => setCompletionNotes(e.target.value)}
                  placeholder={t('modal.completion.notesPlaceholder')}
                  className="h-20 text-sm"
                />
              </div>
            </div>
          )}
        </ScrollArea>

        <DialogFooter className="flex-row justify-between gap-2 pt-2 border-t">
          <div>
            {step > 1 && (
              <Button variant="outline" onClick={handleBack} size="sm">
                <ChevronLeft className="h-4 w-4 mr-1" />
                {t('modal.completion.back')}
              </Button>
            )}
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} size="sm">
              {t('modal.completion.cancel')}
            </Button>

            {!isLastStep ? (
              <Button onClick={handleNext} size="sm">
                {t('modal.completion.next')}
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            ) : (
              <Button
                onClick={handleComplete}
                className="bg-green-600 hover:bg-green-700"
                size="sm"
              >
                <CheckCircle className="h-4 w-4 mr-1" />
                {t('modal.completion.complete')}
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
