/**
 * Job Status Guard Component
 *
 * Provides confirmation dialogs and warnings for job status changes
 * to prevent accidental workflow mistakes.
 */

import React from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, CheckCircle2, Info } from 'lucide-react';
import { JobStatus } from '@/lib/types';

interface JobStatusGuardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentStatus: JobStatus;
  newStatus: JobStatus;
  onConfirm: () => void;
  isLoading?: boolean;
}

/**
 * Get status change warning/info based on transition
 */
function getStatusChangeInfo(currentStatus: JobStatus, newStatus: JobStatus): {
  title: string;
  description: string;
  variant: 'info' | 'warning' | 'success';
  requiresConfirmation: boolean;
} {
  // Completing a job
  if (newStatus === 'completed') {
    return {
      title: 'Complete this job?',
      description:
        'Marking this job as completed will:\n\n' +
        '• Lock the job from further edits (except by managers)\n' +
        '• Deduct parts from inventory\n' +
        '• Update job completion records\n\n' +
        'Make sure all work is finished and documented before proceeding.',
      variant: 'warning',
      requiresConfirmation: true,
    };
  }

  // Moving to ready for pickup
  if (newStatus === 'ready_for_pickup') {
    return {
      title: 'Mark as ready for pickup?',
      description:
        'This indicates that all work is complete and the vehicle is ready for the customer to collect. ' +
        'The customer will be notified that their vehicle is ready.',
      variant: 'success',
      requiresConfirmation: true,
    };
  }

  // Waiting for parts
  if (newStatus === 'waiting_for_parts') {
    return {
      title: 'Waiting for parts?',
      description:
        'This will pause the job until parts arrive. Make sure you have documented which parts are needed in the job notes.',
      variant: 'info',
      requiresConfirmation: false,
    };
  }

  // Starting work
  if (currentStatus === 'not_started' && newStatus === 'in_progress') {
    return {
      title: 'Start working on this job?',
      description: 'This will mark the job as in progress and assign it to you.',
      variant: 'info',
      requiresConfirmation: false,
    };
  }

  // Resuming work after parts arrived
  if (currentStatus === 'waiting_for_parts' && newStatus === 'in_progress') {
    return {
      title: 'Resume work?',
      description: 'Parts have arrived and work can continue.',
      variant: 'success',
      requiresConfirmation: false,
    };
  }

  // Default
  return {
    title: 'Change job status?',
    description: `Change status from "${currentStatus}" to "${newStatus}"`,
    variant: 'info',
    requiresConfirmation: false,
  };
}

/**
 * Dialog that shows warnings/confirmations before changing job status
 */
export function JobStatusGuard({
  open,
  onOpenChange,
  currentStatus,
  newStatus,
  onConfirm,
  isLoading = false,
}: JobStatusGuardProps) {
  const info = getStatusChangeInfo(currentStatus, newStatus);

  // If no confirmation required, auto-confirm
  React.useEffect(() => {
    if (open && !info.requiresConfirmation) {
      onConfirm();
      onOpenChange(false);
    }
  }, [open, info.requiresConfirmation, onConfirm, onOpenChange]);

  // Don't render dialog if no confirmation needed
  if (!info.requiresConfirmation) {
    return null;
  }

  const Icon = info.variant === 'warning' ? AlertTriangle : info.variant === 'success' ? CheckCircle2 : Info;
  const iconColor = info.variant === 'warning' ? 'text-yellow-600' : info.variant === 'success' ? 'text-green-600' : 'text-blue-600';

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex items-center gap-3">
            <Icon className={`h-6 w-6 ${iconColor}`} />
            <AlertDialogTitle>{info.title}</AlertDialogTitle>
          </div>
          <AlertDialogDescription className="whitespace-pre-line text-left">
            {info.description}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} disabled={isLoading}>
            {isLoading ? 'Processing...' : 'Confirm'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

/**
 * Banner that shows when editing a job in a critical state
 */
export function JobStatusBanner({ status }: { status: JobStatus }) {
  if (status === 'ready_for_pickup') {
    return (
      <Alert className="border-yellow-600 bg-yellow-50">
        <AlertTriangle className="h-4 w-4 text-yellow-600" />
        <AlertDescription>
          <strong>Ready for Pickup:</strong> This vehicle is waiting for customer collection.
          Any changes should be discussed with the office staff.
        </AlertDescription>
      </Alert>
    );
  }

  if (status === 'completed') {
    return (
      <Alert className="border-red-600 bg-red-50">
        <AlertTriangle className="h-4 w-4 text-red-600" />
        <AlertDescription>
          <strong>Completed Job:</strong> This job is closed. Only managers can make changes to completed jobs.
        </AlertDescription>
      </Alert>
    );
  }

  return null;
}
