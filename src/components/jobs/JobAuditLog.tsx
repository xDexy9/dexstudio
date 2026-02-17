import React, { useState, useEffect } from 'react';
import { Shield, User, Calendar, ArrowRight } from 'lucide-react';
import { AuditLog } from '@/lib/types';
import { subscribeToJobAuditLogs, getAuditActionColor } from '@/services/auditService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format, formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

interface JobAuditLogProps {
  jobId: string;
}

export function JobAuditLog({ jobId }: JobAuditLogProps) {
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!jobId) return;

    setLoading(true);
    const unsubscribe = subscribeToJobAuditLogs(jobId, (logs) => {
      setAuditLogs(logs);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [jobId]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Audit Log
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Audit Log
          </CardTitle>
          <Badge variant="secondary">{auditLogs.length} entries</Badge>
        </div>
      </CardHeader>
      <CardContent>
        {auditLogs.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground">
            <Shield className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No audit entries yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Timeline */}
            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-[18px] top-4 bottom-4 w-0.5 bg-border" />

              {/* Audit entries */}
              {auditLogs.map((log) => (
                <div key={log.id} className="relative pb-6 last:pb-0">
                  <div className="flex gap-3">
                    {/* Timeline dot */}
                    <div
                      className={cn(
                        'relative z-10 flex items-center justify-center rounded-full p-2 shrink-0',
                        getAuditActionColor(log.action)
                      )}
                    >
                      <Shield className="h-4 w-4" />
                    </div>

                    {/* Content */}
                    <div className="flex-1 pt-0.5">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          {/* Action badge */}
                          <div className="flex items-center gap-2 mb-1">
                            <Badge
                              variant="outline"
                              className={cn('text-xs', getAuditActionColor(log.action))}
                            >
                              {log.action.replace('_', ' ')}
                            </Badge>
                          </div>

                          {/* Summary */}
                          <p className="text-sm font-medium text-foreground">{log.summary}</p>

                          {/* User info */}
                          <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                            <User className="h-3 w-3" />
                            <span>{log.userName}</span>
                          </div>

                          {/* Field changes */}
                          {log.fieldChanged && log.oldValue && log.newValue && (
                            <div className="mt-2 flex items-center gap-2 text-xs">
                              <span className="px-2 py-1 rounded-md bg-secondary text-secondary-foreground">
                                {String(log.oldValue)}
                              </span>
                              <ArrowRight className="h-3 w-3 text-muted-foreground" />
                              <span className="px-2 py-1 rounded-md bg-primary/10 text-primary font-medium">
                                {String(log.newValue)}
                              </span>
                            </div>
                          )}

                          {/* Metadata */}
                          {log.metadata && Object.keys(log.metadata).length > 0 && (
                            <details className="mt-2">
                              <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground">
                                Technical details
                              </summary>
                              <div className="mt-1 p-2 bg-secondary/30 rounded-md text-xs font-mono">
                                {Object.entries(log.metadata).map(([key, value]) => (
                                  <div key={key} className="flex gap-2">
                                    <span className="text-muted-foreground">{key}:</span>
                                    <span className="text-foreground">
                                      {String(value).substring(0, 50)}
                                      {String(value).length > 50 ? '...' : ''}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </details>
                          )}
                        </div>

                        {/* Timestamp */}
                        <div className="flex flex-col items-end gap-0.5 shrink-0">
                          <span className="text-xs text-muted-foreground whitespace-nowrap">
                            {formatDistanceToNow(new Date(log.timestamp), { addSuffix: true })}
                          </span>
                          <span className="text-xs text-muted-foreground/70">
                            {format(new Date(log.timestamp), 'dd/MM HH:mm')}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Compact audit log for smaller spaces
 */
export function CompactAuditLog({ jobId, maxEntries = 5 }: { jobId: string; maxEntries?: number }) {
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!jobId) return;

    setLoading(true);
    const unsubscribe = subscribeToJobAuditLogs(jobId, (logs) => {
      setAuditLogs(logs.slice(0, maxEntries));
      setLoading(false);
    });

    return () => unsubscribe();
  }, [jobId, maxEntries]);

  if (loading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
      </div>
    );
  }

  if (auditLogs.length === 0) {
    return (
      <div className="text-sm text-muted-foreground text-center py-4">No audit entries</div>
    );
  }

  return (
    <div className="space-y-2">
      {auditLogs.map((log) => (
        <div
          key={log.id}
          className="flex items-start justify-between gap-2 p-2 bg-secondary/30 rounded-md"
        >
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium truncate">{log.summary}</p>
            <p className="text-xs text-muted-foreground">{log.userName}</p>
          </div>
          <span className="text-xs text-muted-foreground whitespace-nowrap">
            {formatDistanceToNow(new Date(log.timestamp), { addSuffix: true })}
          </span>
        </div>
      ))}
    </div>
  );
}
