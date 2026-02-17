/**
 * Job Workflow Rules - Defines allowed status transitions
 *
 * Prevents staff from putting jobs in incorrect states
 */

import { JobStatus } from './types';

/**
 * Allowed job status transitions map
 *
 * Lifecycle:
 * 1. not_started → in_progress (mechanic starts work)
 * 2. in_progress → waiting_for_parts (parts needed)
 * 3. waiting_for_parts → in_progress (parts arrived, resume work)
 * 4. in_progress/waiting_for_parts → ready_for_pickup (work complete, ready for customer)
 * 5. ready_for_pickup → completed (customer picked up vehicle)
 *
 * Note: Jobs can be completed directly from in_progress or waiting_for_parts
 */
export const allowedTransitions: Record<JobStatus, JobStatus[]> = {
  not_started: ['in_progress'],
  in_progress: ['waiting_for_parts', 'ready_for_pickup', 'completed'],
  waiting_for_parts: ['in_progress', 'ready_for_pickup', 'completed'],
  ready_for_pickup: ['completed'],
  completed: [] // No transitions from completed
};

/**
 * Validate if a status transition is allowed
 * @param currentStatus Current job status
 * @param newStatus Proposed new status
 * @returns true if transition is valid, false otherwise
 */
export function isValidTransition(currentStatus: JobStatus, newStatus: JobStatus): boolean {
  // Allow staying in the same status
  if (currentStatus === newStatus) {
    return true;
  }

  const allowed = allowedTransitions[currentStatus];
  return allowed.includes(newStatus);
}

/**
 * Get allowed next statuses for a given status
 * @param status Current job status
 * @returns Array of allowed next statuses
 */
export function getAllowedNextStatuses(status: JobStatus): JobStatus[] {
  return allowedTransitions[status];
}

/**
 * Check if a status is terminal (no further transitions allowed)
 * @param status Job status to check
 * @returns true if status is terminal
 */
export function isTerminalStatus(status: JobStatus): boolean {
  return allowedTransitions[status].length === 0;
}

/**
 * Get human-readable reason why a transition is not allowed
 * @param currentStatus Current job status
 * @param newStatus Proposed new status
 * @returns Error message explaining why transition is invalid
 */
export function getTransitionErrorMessage(currentStatus: JobStatus, newStatus: JobStatus): string {
  if (currentStatus === newStatus) {
    return 'Job is already in this status';
  }

  if (isTerminalStatus(currentStatus)) {
    return `Cannot change status from '${currentStatus}'. This job is complete.`;
  }

  const allowed = allowedTransitions[currentStatus];
  const allowedStr = allowed.map(s => `'${s}'`).join(', ');

  return `Invalid status transition from '${currentStatus}' to '${newStatus}'. Allowed next statuses: ${allowedStr}`;
}
