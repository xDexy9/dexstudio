import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, CheckCircle, Clock, Filter, ExternalLink } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Job } from '@/lib/types';
import { subscribeToJobs, updateJob } from '@/services/firestoreService';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface PartNeedingOrder {
  id: string;
  jobId: string;
  jobNumber?: string;
  vehiclePlate: string;
  description: string;
  referenceNumber?: string;
  quantity: number;
  unitPrice?: number;
  needsApproval: boolean;
  mechanicName?: string;
  status: 'pending' | 'ordered' | 'received';
}

export default function PartsOrderingPage() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [allJobs, setAllJobs] = useState<Job[]>([]);
  const [partsNeedingOrder, setPartsNeedingOrder] = useState<PartNeedingOrder[]>([]);
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'ordered' | 'received'>('all');
  const [groupBy, setGroupBy] = useState<'job' | 'category'>('job');
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Subscribe to jobs with work order data
  useEffect(() => {
    const unsubscribe = subscribeToJobs((jobs) => {
      setAllJobs(jobs);

      // Extract parts needing orders from work order data
      const parts: PartNeedingOrder[] = [];
      jobs.forEach(job => {
        if (job.workOrderData?.parts) {
          job.workOrderData.parts.forEach(part => {
            if (part.needsOrdering || part.partId) {
              parts.push({
                id: part.id,
                jobId: job.id,
                jobNumber: job.jobNumber,
                vehiclePlate: job.vehicleLicensePlate || '',
                description: part.partName || part.description,
                referenceNumber: part.partNumber,
                quantity: part.quantity,
                unitPrice: part.unitPrice,
                needsApproval: part.needsOrdering,
                mechanicName: job.workOrderData!.mechanicName,
                status: 'pending',
              });
            }
          });
        }
      });

      setPartsNeedingOrder(parts);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const filteredParts = partsNeedingOrder.filter(part => {
    // Filter by status
    if (filterStatus !== 'all' && part.status !== filterStatus) {
      return false;
    }

    // Filter by search term
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      return (
        part.description.toLowerCase().includes(search) ||
        part.referenceNumber?.toLowerCase().includes(search) ||
        part.vehiclePlate.toLowerCase().includes(search) ||
        part.jobNumber?.toLowerCase().includes(search)
      );
    }

    return true;
  });

  const pendingCount = partsNeedingOrder.filter(p => p.status === 'pending').length;
  const orderedCount = partsNeedingOrder.filter(p => p.status === 'ordered').length;
  const receivedCount = partsNeedingOrder.filter(p => p.status === 'received').length;

  const handleMarkAsOrdered = async (partId: string, jobId: string) => {
    // Update part status in job's work order data
    const job = allJobs.find(j => j.id === jobId);
    if (!job || !job.workOrderData) return;

    const updatedParts = job.workOrderData.parts.map(p =>
      p.id === partId ? { ...p, needsOrdering: false } : p
    );

    try {
      await updateJob(jobId, {
        workOrderData: {
          ...job.workOrderData,
          parts: updatedParts,
        },
      }, user?.id);

      toast.success('Part marked as ordered');
    } catch (error) {
      console.error('Error updating part status:', error);
      toast.error('Failed to update part status');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Loading parts orders...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Parts Ordering Dashboard</h1>
        <p className="text-muted-foreground">
          Track and manage parts needing orders across all jobs
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Parts</p>
                <p className="text-2xl font-bold">{partsNeedingOrder.length}</p>
              </div>
              <Package className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold text-orange-600">{pendingCount}</p>
              </div>
              <Clock className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Ordered</p>
                <p className="text-2xl font-bold text-blue-600">{orderedCount}</p>
              </div>
              <Package className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Received</p>
                <p className="text-2xl font-bold text-green-600">{receivedCount}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <Label className="text-xs">Search</Label>
          <Input
            placeholder="Search parts, reference, vehicle..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="w-full sm:w-48">
          <Label className="text-xs">Status</Label>
          <Select value={filterStatus} onValueChange={(value: any) => setFilterStatus(value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="ordered">Ordered</SelectItem>
              <SelectItem value="received">Received</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="w-full sm:w-48">
          <Label className="text-xs">Group By</Label>
          <Select value={groupBy} onValueChange={(value: any) => setGroupBy(value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="job">By Job</SelectItem>
              <SelectItem value="category">By Category</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Parts List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            Parts Needing Orders ({filteredParts.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredParts.length === 0 ? (
            <div className="text-center py-12">
              <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No parts found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredParts.map((part) => (
                <Card key={`${part.jobId}-${part.id}`} className="hover:shadow-md transition-shadow">
                  <CardContent className="pt-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold">{part.description}</h4>
                          {part.needsApproval && (
                            <Badge variant="destructive" className="text-xs">
                              Needs Approval
                            </Badge>
                          )}
                          <Badge variant={
                            part.status === 'received' ? 'default' :
                            part.status === 'ordered' ? 'secondary' :
                            'outline'
                          }>
                            {part.status}
                          </Badge>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
                          <div>
                            <span className="font-medium">Vehicle:</span> {part.vehiclePlate}
                          </div>
                          <div>
                            <span className="font-medium">Job:</span> {part.jobNumber || part.jobId.slice(0, 8)}
                          </div>
                          {part.referenceNumber && (
                            <div>
                              <span className="font-medium">Ref:</span> {part.referenceNumber}
                            </div>
                          )}
                          <div>
                            <span className="font-medium">Qty:</span> {part.quantity}
                          </div>
                          {part.unitPrice && (
                            <div>
                              <span className="font-medium">Price:</span> €{(part.quantity * part.unitPrice).toFixed(2)}
                            </div>
                          )}
                          {part.mechanicName && (
                            <div>
                              <span className="font-medium">Requested by:</span> {part.mechanicName}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-col gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => navigate(`/jobs/${part.jobId}`)}
                        >
                          <ExternalLink className="h-4 w-4 mr-1" />
                          {t('common.viewJob')}
                        </Button>

                        {part.needsApproval && part.status === 'pending' && (
                          <Button
                            size="sm"
                            onClick={() => handleMarkAsOrdered(part.id, part.jobId)}
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Approve
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
