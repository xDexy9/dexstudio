import { Job, JobHealth, JobHealthIndicator } from './types';

/**
 * Health thresholds by job status (in days)
 */
const HEALTH_THRESHOLDS = {
  not_started: {
    warning: 3,
    critical: 7,
  },
  in_progress: {
    warning: 5,
    critical: 10,
  },
  waiting_for_parts: {
    warning: 7,
    critical: 14,
  },
  completed: {
    warning: Infinity, // Completed jobs are always healthy
    critical: Infinity,
  },
};

/**
 * Inactivity threshold (days since last update)
 */
const INACTIVITY_WARNING_DAYS = 5;

/**
 * Calculate the number of days since a given date
 */
function daysSince(dateString: string): number {
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - date.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

/**
 * Calculate job health based on status duration, inactivity, and overdue time
 */
export function calculateJobHealth(job: Job): JobHealthIndicator {
  const daysOld = daysSince(job.createdAt);
  const lastUpdate = job.updatedAt ? new Date(job.updatedAt) : new Date(job.createdAt);
  const daysSinceUpdate = daysSince(lastUpdate.toISOString());
  const isInactive = daysSinceUpdate >= INACTIVITY_WARNING_DAYS;

  // Calculate days overdue based on estimatedDuration
  let daysOverdue = 0;
  if (job.estimatedDuration) {
    daysOverdue = Math.max(0, daysOld - job.estimatedDuration);
  }

  // Get thresholds for current status
  const thresholds = HEALTH_THRESHOLDS[job.status] || HEALTH_THRESHOLDS.in_progress;

  // Determine health level
  let health: JobHealth;
  let reason: string;

  // Overdue jobs are critical
  if (daysOverdue > 0) {
    health = 'overdue';
    reason = `${daysOverdue} day${daysOverdue !== 1 ? 's' : ''} overdue`;
  }
  // Check critical threshold
  else if (daysOld >= thresholds.critical) {
    health = 'critical';
    reason = `In ${job.status.replace('_', ' ')} for ${daysOld} days`;
  }
  // Check warning threshold
  else if (daysOld >= thresholds.warning) {
    health = 'warning';
    reason = `In ${job.status.replace('_', ' ')} for ${daysOld} days`;
  }
  // Check inactivity
  else if (isInactive && job.status !== 'completed') {
    health = 'warning';
    reason = `No updates for ${daysSinceUpdate} days`;
  }
  // Healthy
  else {
    health = 'healthy';
    reason = 'On track';
  }

  return {
    health,
    reason,
    daysOld,
    daysOverdue,
    isInactive,
    lastUpdate,
  };
}

/**
 * Get health color class for UI styling
 */
export function getHealthColor(health: JobHealth): string {
  switch (health) {
    case 'healthy':
      return 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-900';
    case 'warning':
      return 'text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-900';
    case 'critical':
      return 'text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-900';
    case 'overdue':
      return 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900';
    default:
      return 'text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-950/20 border-gray-200 dark:border-gray-900';
  }
}

/**
 * Get health label for display
 */
export function getHealthLabel(health: JobHealth): string {
  switch (health) {
    case 'healthy':
      return 'Healthy';
    case 'warning':
      return 'Needs Attention';
    case 'critical':
      return 'Critical';
    case 'overdue':
      return 'Overdue';
    default:
      return 'Unknown';
  }
}

/**
 * Filter jobs by health status
 */
export function filterJobsByHealth(jobs: Job[], healthFilter: JobHealth): Job[] {
  return jobs.filter(job => {
    const indicator = calculateJobHealth(job);
    return indicator.health === healthFilter;
  });
}

/**
 * Sort jobs by health priority (most urgent first)
 */
export function sortJobsByHealth(jobs: Job[]): Job[] {
  const healthPriority: Record<JobHealth, number> = {
    overdue: 4,
    critical: 3,
    warning: 2,
    healthy: 1,
  };

  return [...jobs].sort((a, b) => {
    const healthA = calculateJobHealth(a).health;
    const healthB = calculateJobHealth(b).health;
    return healthPriority[healthB] - healthPriority[healthA];
  });
}
