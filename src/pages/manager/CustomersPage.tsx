import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  UserPlus,
  Search,
  MoreHorizontal,
  Edit,
  Trash2,
  Mail,
  Phone,
  FileText,
  Calendar,
  Filter,
  TrendingUp,
  Star,
  Clock,
  Car,
  AlertTriangle,
  MessageSquareWarning,
  UserCheck,
  BarChart3,
  Wallet
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { getCustomers, getUniqueCustomersFromJobs, getJobs, addCustomer, generateId, getVehicles, getJobsByVehicle } from '@/services/firestoreService';
import { Customer, Job, Vehicle } from '@/lib/types';
import { CustomerComplaintModal } from '@/components/customer/CustomerComplaintModal';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { format, subDays, isWithinInterval } from 'date-fns';
import { cn } from '@/lib/utils';

// Customer card component
function CustomerCard({
  customer,
  jobs,
  vehicles,
  onEdit,
  onDelete,
  onViewJobs,
  onAddComplaint,
  t
}: {
  customer: Customer;
  jobs: Job[];
  vehicles: Vehicle[];
  onEdit: () => void;
  onDelete: () => void;
  onViewJobs: () => void;
  onAddComplaint: () => void;
  t: (key: string) => string;
}) {
  const completedJobs = jobs.filter(j => j.status === 'completed').length;
  const avgRevenue = completedJobs * 350; // Mock calculation
  const lastJob = jobs.length > 0 ? jobs.sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )[0] : null;

  return (
    <Card className="border-0 shadow-sm hover:shadow-md transition-all duration-300 group">
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
              <span className="text-lg font-semibold text-primary">
                {customer.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
              </span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="font-semibold">{customer.name}</p>
                {customer.complaints && customer.complaints.length > 0 && (
                  <Badge variant="secondary" className="bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-400">
                    <AlertTriangle className="h-3 w-3 mr-1" />
                    {customer.complaints.length}
                  </Badge>
                )}
              </div>
              {jobs.length > 3 && (
                <Badge variant="secondary" className="text-xs mt-1">
                  <Star className="h-3 w-3 mr-1" />
                  {t('customers.loyalCustomer')}
                </Badge>
              )}
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onViewJobs}>
                <FileText className="h-4 w-4 mr-2" />
                {t('customers.viewJobs')}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onAddComplaint}>
                <MessageSquareWarning className="h-4 w-4 mr-2" />
                {t('customers.addComplaint')}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onEdit}>
                <Edit className="h-4 w-4 mr-2" />
                {t('common.edit')}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive" onClick={onDelete}>
                <Trash2 className="h-4 w-4 mr-2" />
                {t('common.delete')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        
        <div className="space-y-3 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Phone className="h-4 w-4" />
            <span>{customer.phone}</span>
          </div>
          {customer.email && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Mail className="h-4 w-4" />
              <span className="truncate">{customer.email}</span>
            </div>
          )}
        </div>

        <div className="mt-4 pt-4 border-t">
          <div className="grid grid-cols-3 gap-2 text-center">
            <div>
              <p className="text-lg font-bold text-primary">{customer.jobCount}</p>
              <p className="text-xs text-muted-foreground">{t('customers.totalJobs')}</p>
            </div>
            <div>
              <p className="text-lg font-bold text-emerald-600">{completedJobs}</p>
              <p className="text-xs text-muted-foreground">{t('customers.completed')}</p>
            </div>
            <div>
              <p className="text-lg font-bold text-violet-600">€{avgRevenue}</p>
              <p className="text-xs text-muted-foreground">{t('customers.revenue')}</p>
            </div>
          </div>
        </div>

        {lastJob && (
          <div className="mt-4 p-3 rounded-lg bg-muted/30">
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
              <Clock className="h-3 w-3" />
              {t('customers.lastVisit')}
            </div>
            <p className="text-sm font-medium truncate">{lastJob.problemDescription.slice(0, 50)}...</p>
            <p className="text-xs text-muted-foreground">{format(new Date(lastJob.createdAt), 'dd/MM/yyyy')}</p>
          </div>
        )}

        {/* Customer Vehicles */}
        {vehicles.length > 0 && (
          <div className="mt-4 p-3 rounded-lg bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200/50">
            <div className="flex items-center gap-2 text-xs font-semibold text-blue-700 dark:text-blue-400 mb-2">
              <Car className="h-3 w-3" />
              {t('customers.vehicles')} ({vehicles.length})
            </div>
            <div className="space-y-1">
              {vehicles.slice(0, 3).map((vehicle) => (
                <div key={vehicle.id} className="text-xs text-muted-foreground">
                  {vehicle.brand} {vehicle.model} • {vehicle.licensePlate}
                </div>
              ))}
              {vehicles.length > 3 && (
                <p className="text-xs text-muted-foreground italic">+{vehicles.length - 3} {t('customers.more')}</p>
              )}
            </div>
          </div>
        )}

        {/* Customer Complaints */}
        {customer.complaints && customer.complaints.length > 0 && (
          <div className="mt-4 p-3 rounded-lg bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/50">
            <div className="flex items-center gap-2 text-xs font-semibold text-amber-700 dark:text-amber-400 mb-2">
              <MessageSquareWarning className="h-3 w-3" />
              {t('customers.complaints')} ({customer.complaints.length})
            </div>
            <div className="space-y-2">
              {customer.complaints
                .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                .slice(0, 2)
                .map((complaint) => (
                  <div key={complaint.id} className="text-xs">
                    <p className="text-foreground leading-relaxed">{complaint.description.slice(0, 80)}...</p>
                    <p className="text-muted-foreground mt-1">
                      {format(new Date(complaint.createdAt), 'dd/MM/yyyy')} • {complaint.createdByName}
                    </p>
                  </div>
                ))}
              {customer.complaints.length > 2 && (
                <p className="text-xs text-muted-foreground italic">+{customer.complaints.length - 2} {t('customers.more')}</p>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function CustomersPage() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<string>('jobs');
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [complaintDialogOpen, setComplaintDialogOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    notes: '',
  });

  // Get data - load from persistent customers collection
  const [jobs, setJobs] = useState<Job[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const [jobsData, customersData, vehiclesData] = await Promise.all([
          getJobs(),
          getCustomers(),
          getVehicles()
        ]);
        setJobs(jobsData);
        setCustomers(customersData);
        setVehicles(vehiclesData);
      } catch (error) {
        console.error('Error loading customers data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [refreshKey]);

  // Filter and sort customers
  const filteredCustomers = useMemo(() => {
    let filtered = customers.filter(customer => {
      const matchesSearch =
        customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        customer.phone.includes(searchQuery) ||
        (customer.email && customer.email.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesSearch;
    });

    // Sort
    if (sortBy === 'jobs') {
      filtered.sort((a, b) => {
        const aJobCount = jobs.filter(j => j.customerPhone === a.phone).length;
        const bJobCount = jobs.filter(j => j.customerPhone === b.phone).length;
        return bJobCount - aJobCount;
      });
    } else if (sortBy === 'name') {
      filtered.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortBy === 'recent') {
      filtered.sort((a, b) => {
        const aLastJob = jobs.filter(j => j.customerPhone === a.phone)
          .sort((x, y) => new Date(y.createdAt).getTime() - new Date(x.createdAt).getTime())[0];
        const bLastJob = jobs.filter(j => j.customerPhone === b.phone)
          .sort((x, y) => new Date(y.createdAt).getTime() - new Date(x.createdAt).getTime())[0];
        if (!aLastJob) return 1;
        if (!bLastJob) return -1;
        return new Date(bLastJob.createdAt).getTime() - new Date(aLastJob.createdAt).getTime();
      });
    }

    return filtered;
  }, [customers, searchQuery, sortBy, jobs]);

  // Customer stats
  const customerStats = useMemo(() => {
    const now = new Date();
    const lastMonth = subDays(now, 30);

    const newCustomersThisMonth = customers.filter(c => {
      return c.createdAt && isWithinInterval(new Date(c.createdAt), { start: lastMonth, end: now });
    });

    const loyalCustomers = customers.filter(c => {
      const jobCount = jobs.filter(j => j.customerPhone === c.phone).length;
      return jobCount > 3;
    });
    const totalRevenue = jobs.filter(j => j.status === 'completed').length * 350;

    return {
      total: customers.length,
      newThisMonth: newCustomersThisMonth.length,
      loyal: loyalCustomers.length,
      totalRevenue,
      avgJobsPerCustomer: customers.length > 0
        ? Math.round(jobs.length / customers.length * 10) / 10
        : 0,
    };
  }, [customers, jobs]);

  const getCustomerJobs = (phone: string) => {
    return jobs.filter(j => j.customerPhone === phone);
  };

  const getCustomerVehicles = (customer: Customer) => {
    if (customer.vehicleIds && customer.vehicleIds.length > 0) {
      return vehicles.filter(v => customer.vehicleIds?.includes(v.id));
    }
    return [];
  };

  const handleAddCustomer = () => {
    const newCustomer: Customer = {
      id: generateId(),
      name: formData.name,
      phone: formData.phone,
      email: formData.email || undefined,
      notes: formData.notes || undefined,
      createdAt: new Date().toISOString(),
    };
    addCustomer(newCustomer);
    setAddDialogOpen(false);
    setFormData({ name: '', phone: '', email: '', notes: '' });
    setRefreshKey(prev => prev + 1);
    toast({
      title: 'Customer added',
      description: `${newCustomer.name} has been added to the database.`,
    });
  };

  const handleDeleteCustomer = () => {
    // In a real app with backend, you'd delete from storage
    setDeleteDialogOpen(false);
    setSelectedCustomer(null);
    toast({
      title: 'Note',
      description: 'Customer records are preserved for job history. Jobs will remain in the system.',
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">{t('customers.loading')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">{t('customers.title')}</h1>
          <p className="text-muted-foreground">{t('customers.subtitle')}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" className="h-9" onClick={() => setAddDialogOpen(true)}>
            <UserPlus className="h-4 w-4 mr-2" />
            {t('customers.addCustomer')}
          </Button>
        </div>
      </div>

      {/* Customer Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Users className="h-5 w-5 text-primary" />
              <div>
                <p className="text-2xl font-bold">{customerStats.total}</p>
                <p className="text-xs text-muted-foreground">{t('customers.totalCustomers')}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <UserPlus className="h-5 w-5 text-emerald-500" />
              <div>
                <p className="text-2xl font-bold">{customerStats.newThisMonth}</p>
                <p className="text-xs text-muted-foreground">{t('customers.newThisMonth')}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <UserCheck className="h-5 w-5 text-amber-500" />
              <div>
                <p className="text-2xl font-bold">{customerStats.loyal}</p>
                <p className="text-xs text-muted-foreground">{t('customers.loyalCustomers')}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <BarChart3 className="h-5 w-5 text-violet-500" />
              <div>
                <p className="text-2xl font-bold">{customerStats.avgJobsPerCustomer}</p>
                <p className="text-xs text-muted-foreground">{t('customers.avgJobsPerCustomer')}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t('customers.searchPlaceholder')}
            className="pl-10 h-10 bg-muted/30 border-0"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-44 h-10 bg-muted/30 border-0">
            <Filter className="h-4 w-4 mr-2 text-muted-foreground" />
            <SelectValue placeholder={t('customers.sortBy')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="jobs">{t('customers.mostJobs')}</SelectItem>
            <SelectItem value="name">{t('customers.nameAZ')}</SelectItem>
            <SelectItem value="recent">{t('customers.mostRecent')}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Customers Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredCustomers.map((customer, idx) => (
          <CustomerCard
            key={`${customer.id}-${idx}`}
            customer={customer}
            jobs={getCustomerJobs(customer.phone)}
            vehicles={getCustomerVehicles(customer)}
            onEdit={() => {
              setFormData({
                name: customer.name,
                phone: customer.phone,
                email: customer.email || '',
                notes: customer.notes || '',
              });
              setAddDialogOpen(true);
            }}
            onDelete={() => {
              setSelectedCustomer(customer);
              setDeleteDialogOpen(true);
            }}
            onAddComplaint={() => {
              setSelectedCustomer(customer);
              setComplaintDialogOpen(true);
            }}
            onViewJobs={() => navigate(`/jobs?customer=${encodeURIComponent(customer.phone)}`)}
            t={t}
          />
        ))}
        {filteredCustomers.length === 0 && (
          <div className="col-span-full text-center py-12">
            <Users className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-muted-foreground">{t('customers.noCustomersFound')}</p>
          </div>
        )}
      </div>

      {/* Add Customer Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t('customers.addCustomer')}</DialogTitle>
            <DialogDescription>
              {t('customers.addCustomerDialog')}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>{t('customers.fullName')}</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder={t('customers.enterName')}
              />
            </div>
            <div className="space-y-2">
              <Label>{t('customers.phoneNumber')}</Label>
              <Input
                value={formData.phone}
                onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                placeholder={t('customers.phonePlaceholder')}
              />
            </div>
            <div className="space-y-2">
              <Label>{t('customers.emailOptional')}</Label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                placeholder={t('customers.emailPlaceholder')}
              />
            </div>
            <div className="space-y-2">
              <Label>{t('customers.notesOptional')}</Label>
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder={t('customers.notesPlaceholder')}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddDialogOpen(false)}>{t('common.cancel')}</Button>
            <Button
              onClick={handleAddCustomer}
              disabled={!formData.name || !formData.phone}
            >
              {t('customers.addCustomer')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t('customers.deleteTitle')}</DialogTitle>
            <DialogDescription>
              {t('customers.deleteConfirm').replace('{name}', selectedCustomer?.name || '')}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>{t('common.cancel')}</Button>
            <Button variant="destructive" onClick={handleDeleteCustomer}>{t('common.delete')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Customer Complaint Modal */}
      {selectedCustomer && (
        <CustomerComplaintModal
          open={complaintDialogOpen}
          onOpenChange={setComplaintDialogOpen}
          customerId={selectedCustomer.id}
          customerName={selectedCustomer.name}
          onComplaintAdded={() => {
            setRefreshKey(prev => prev + 1);
          }}
        />
      )}
    </div>
  );
}
