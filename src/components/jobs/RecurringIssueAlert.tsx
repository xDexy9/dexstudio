import React, { useState, useEffect } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { RecurringIssue } from '@/lib/types';
import { checkForRecurringIssue } from '@/services/customerIntelligenceService';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatDistanceToNow } from 'date-fns';

interface RecurringIssueAlertProps {
  customerPhone: string;
  faultCategory?: string;
  onDismiss?: () => void;
}

export function RecurringIssueAlert({
  customerPhone,
  faultCategory,
  onDismiss,
}: RecurringIssueAlertProps) {
  const [recurringIssue, setRecurringIssue] = useState<RecurringIssue | null>(null);
  const [loading, setLoading] = useState(true);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const checkRecurrence = async () => {
      if (!customerPhone || !faultCategory) {
        setLoading(false);
        return;
      }

      setLoading(true);
      const issue = await checkForRecurringIssue(customerPhone, faultCategory);
      setRecurringIssue(issue);
      setLoading(false);
    };

    checkRecurrence();
  }, [customerPhone, faultCategory]);

  const handleDismiss = () => {
    setDismissed(true);
    if (onDismiss) {
      onDismiss();
    }
  };

  if (loading || !recurringIssue || dismissed) {
    return null;
  }

  const getPatternColor = (pattern: string) => {
    switch (pattern) {
      case 'monthly':
        return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
      case 'quarterly':
        return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400';
      case 'biannual':
        return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
      default:
        return 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400';
    }
  };

  return (
    <Alert variant="default" className="border-orange-200 bg-orange-50 dark:border-orange-900 dark:bg-orange-950/20">
      <AlertTriangle className="h-4 w-4 text-orange-600 dark:text-orange-400" />
      <div className="flex-1">
        <AlertTitle className="text-orange-900 dark:text-orange-100 flex items-center gap-2">
          Recurring Issue Detected
          <Badge className={getPatternColor(recurringIssue.pattern)}>
            {recurringIssue.pattern}
          </Badge>
          <Badge variant="secondary">×{recurringIssue.occurrences}</Badge>
        </AlertTitle>
        <AlertDescription className="text-orange-700 dark:text-orange-300 mt-2">
          This customer has experienced "{recurringIssue.category}" issues{' '}
          <strong>{recurringIssue.occurrences} times</strong> previously. Last occurrence was{' '}
          <strong>
            {formatDistanceToNow(new Date(recurringIssue.lastOccurrenceDate), { addSuffix: true })}
          </strong>
          .
          {recurringIssue.pattern !== 'random' && (
            <p className="mt-1 text-sm">
              Pattern: <strong className="capitalize">{recurringIssue.pattern}</strong> recurrence
            </p>
          )}
        </AlertDescription>
      </div>
      {onDismiss && (
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 absolute top-2 right-2"
          onClick={handleDismiss}
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </Alert>
  );
}

/**
 * Compact version for job cards and lists
 */
export function RecurringIssueBadge({
  customerPhone,
  faultCategory,
}: {
  customerPhone: string;
  faultCategory?: string;
}) {
  const [recurringIssue, setRecurringIssue] = useState<RecurringIssue | null>(null);

  useEffect(() => {
    const checkRecurrence = async () => {
      if (!customerPhone || !faultCategory) return;

      const issue = await checkForRecurringIssue(customerPhone, faultCategory);
      setRecurringIssue(issue);
    };

    checkRecurrence();
  }, [customerPhone, faultCategory]);

  if (!recurringIssue) {
    return null;
  }

  return (
    <Badge
      variant="outline"
      className="bg-orange-50 text-orange-700 border-orange-300 dark:bg-orange-950/20 dark:text-orange-400 dark:border-orange-800"
    >
      <AlertTriangle className="h-3 w-3 mr-1" />
      Recurring (×{recurringIssue.occurrences})
    </Badge>
  );
}
