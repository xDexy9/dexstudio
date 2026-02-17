import React, { useState, useEffect } from 'react';
import { Brain, TrendingUp, Calendar, AlertCircle, Clock, Repeat } from 'lucide-react';
import { CustomerIntelligence as CustomerIntelligenceType } from '@/lib/types';
import { analyzeCustomerHistory } from '@/services/customerIntelligenceService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format, formatDistanceToNow } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';

interface CustomerIntelligenceProps {
  customerPhone: string;
}

export function CustomerIntelligence({ customerPhone }: CustomerIntelligenceProps) {
  const [intelligence, setIntelligence] = useState<CustomerIntelligenceType | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadIntelligence = async () => {
      setLoading(true);
      const data = await analyzeCustomerHistory(customerPhone);
      setIntelligence(data);
      setLoading(false);
    };

    if (customerPhone) {
      loadIntelligence();
    }
  }, [customerPhone]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Customer Intelligence
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!intelligence || intelligence.totalJobs === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Customer Intelligence
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            No service history available for this customer.
          </p>
        </CardContent>
      </Card>
    );
  }

  const getPatternBadge = (pattern: string) => {
    const colors = {
      monthly: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
      quarterly: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
      biannual: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
      random: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400',
    };

    return colors[pattern as keyof typeof colors] || colors.random;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-5 w-5 text-primary" />
          Customer Intelligence
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Summary Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-secondary/30 p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              <span className="text-xs font-medium text-muted-foreground">Total Services</span>
            </div>
            <p className="text-2xl font-bold">{intelligence.totalJobs}</p>
          </div>

          {intelligence.averageServiceInterval > 0 && (
            <div className="bg-secondary/30 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="h-4 w-4 text-primary" />
                <span className="text-xs font-medium text-muted-foreground">Avg Interval</span>
              </div>
              <p className="text-2xl font-bold">{intelligence.averageServiceInterval}</p>
              <p className="text-xs text-muted-foreground">days</p>
            </div>
          )}
        </div>

        {/* Last Service */}
        <div className="border-t pt-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Last Service</span>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium">
                {formatDistanceToNow(new Date(intelligence.lastServiceDate), { addSuffix: true })}
              </p>
              <p className="text-xs text-muted-foreground">
                {format(new Date(intelligence.lastServiceDate), 'dd/MM/yyyy')}
              </p>
            </div>
          </div>
        </div>

        {/* Next Recommended Service */}
        {intelligence.nextRecommendedService && (
          <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg border border-blue-200 dark:border-blue-900">
            <div className="flex items-start gap-3">
              <Calendar className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-blue-900 dark:text-blue-100">
                  Recommended Next Service
                </p>
                <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                  {format(new Date(intelligence.nextRecommendedService), 'dd/MM/yyyy')} (
                  {formatDistanceToNow(new Date(intelligence.nextRecommendedService), {
                    addSuffix: true,
                  })}
                  )
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Recurring Issues */}
        {intelligence.recurringIssues.length > 0 && (
          <div className="border-t pt-4">
            <div className="flex items-center gap-2 mb-3">
              <Repeat className="h-4 w-4 text-orange-600 dark:text-orange-400" />
              <h3 className="text-sm font-semibold">Recurring Issues</h3>
              <Badge variant="secondary" className="ml-auto">
                {intelligence.recurringIssues.length}
              </Badge>
            </div>

            <div className="space-y-2">
              {intelligence.recurringIssues.map((issue, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-orange-50 dark:bg-orange-950/20 rounded-lg border border-orange-200 dark:border-orange-900"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                      <span className="text-sm font-medium text-orange-900 dark:text-orange-100">
                        {issue.category}
                      </span>
                    </div>
                    <p className="text-xs text-orange-700 dark:text-orange-300 mt-1 ml-6">
                      Last occurred {issue.daysAgo} days ago
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={getPatternBadge(issue.pattern)}>{issue.pattern}</Badge>
                    <Badge variant="secondary">×{issue.occurrences}</Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Common Problems */}
        {intelligence.commonProblems.length > 0 && (
          <div className="border-t pt-4">
            <h3 className="text-sm font-semibold mb-3">Common Problems</h3>
            <div className="space-y-2">
              {intelligence.commonProblems.map((problem, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-2 bg-secondary/50 rounded-md"
                >
                  <p className="text-sm text-foreground flex-1 line-clamp-2">
                    {problem.description}
                  </p>
                  <Badge variant="secondary" className="ml-2">
                    ×{problem.frequency}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
