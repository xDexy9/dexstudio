import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Car,
  Plus,
  Search,
  MoreHorizontal,
  Edit,
  Trash2,
  Eye,
  History,
  Filter,
  Calendar,
  Hash,
  Gauge,
  FileText,
  Fuel,
  CarFront,
  LayoutGrid
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { CarBrandLogo } from '@/components/ui/car-brand-logo';
import { getVehicles, getJobsByVehicle, addVehicle, updateVehicle, deleteVehicle } from '@/services/firestoreService';
import { Vehicle, FuelType } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

// Popular car brands for quick selection
const CAR_BRANDS = [
  'Renault', 'Peugeot', 'Citroën', 'Dacia', 'Volkswagen', 'BMW', 'Mercedes-Benz', 
  'Audi', 'Ford', 'Opel', 'Toyota', 'Honda', 'Nissan', 'Fiat', 'Seat', 'Skoda'
];

// Vehicle card component
function VehicleCard({
  vehicle,
  jobCount,
  onEdit,
  onDelete,
  onViewHistory,
  t
}: {
  vehicle: Vehicle;
  jobCount: number;
  onEdit: () => void;
  onDelete: () => void;
  onViewHistory: () => void;
  t: (key: string) => string;
}) {
  return (
    <Card className="border-0 shadow-sm hover:shadow-md transition-all duration-300 group">
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <CarBrandLogo brand={vehicle.brand} size="lg" className="text-primary" />
            <div>
              <p className="font-semibold">{vehicle.brand} {vehicle.model}</p>
              <p className="text-sm text-muted-foreground">{vehicle.year}</p>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onViewHistory}>
                <History className="h-4 w-4 mr-2" />
                {t('vehicles.viewHistory')}
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

        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
            <span className="text-sm text-muted-foreground">{t('vehicles.licensePlate')}</span>
            <Badge variant="secondary" className="font-mono">{vehicle.licensePlate}</Badge>
          </div>

          {vehicle.vin && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{t('vehicles.vin')}</span>
              <span className="font-mono text-xs">{vehicle.vin.slice(0, 11)}...</span>
            </div>
          )}

          {vehicle.color && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{t('vehicles.color')}</span>
              <div className="flex items-center gap-2">
                <div
                  className="w-4 h-4 rounded-full border"
                  style={{ backgroundColor: vehicle.color.toLowerCase() }}
                />
                <span>{vehicle.color}</span>
              </div>
            </div>
          )}
        </div>

        <div className="mt-4 pt-4 border-t flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>{t('vehicles.added').replace('{date}', format(new Date(vehicle.createdAt), 'MM/yyyy'))}</span>
          </div>
          <Badge variant={jobCount > 0 ? 'default' : 'secondary'} className="text-xs">
            {t('vehicles.jobs').replace('{count}', jobCount.toString())}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}

export default function VehiclesPage() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { toast } = useToast();

  const FUEL_TYPES: { value: FuelType; label: string }[] = [
    { value: 'petrol', label: t('vehicles.petrol') },
    { value: 'diesel', label: t('vehicles.diesel') },
    { value: 'electric', label: t('vehicles.electric') },
    { value: 'hybrid', label: t('vehicles.hybrid') },
    { value: 'lpg', label: t('vehicles.lpg') },
    { value: 'other', label: t('vehicles.other') },
  ];

  const [searchQuery, setSearchQuery] = useState('');
  const [brandFilter, setBrandFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [vehicleJobCounts, setVehicleJobCounts] = useState<Map<string, number>>(new Map());
  const [isLoading, setIsLoading] = useState(true);

  // Form state
  const [formData, setFormData] = useState({
    brand: '',
    model: '',
    year: new Date().getFullYear(),
    licensePlate: '',
    vin: '',
    color: '',
    fuelType: '',
  });

  // Load data
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        const vehiclesData = await getVehicles();
        setVehicles(vehiclesData);

        // Load job counts for all vehicles
        const jobCountsMap = new Map<string, number>();
        await Promise.all(
          vehiclesData.map(async (vehicle) => {
            const jobs = await getJobsByVehicle(vehicle.id);
            jobCountsMap.set(vehicle.id, jobs.length);
          })
        );
        setVehicleJobCounts(jobCountsMap);
      } catch (error) {
        console.error('Error loading vehicles:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [refreshKey]);

  // Get unique brands from vehicles
  const uniqueBrands = useMemo(() => {
    const brands = new Set(vehicles.map(v => v.brand));
    return Array.from(brands).sort();
  }, [vehicles]);

  // Filter vehicles
  const filteredVehicles = useMemo(() => {
    return vehicles.filter(vehicle => {
      const matchesSearch = 
        vehicle.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
        vehicle.model.toLowerCase().includes(searchQuery.toLowerCase()) ||
        vehicle.licensePlate.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (vehicle.vin && vehicle.vin.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesBrand = brandFilter === 'all' || vehicle.brand === brandFilter;
      return matchesSearch && matchesBrand;
    });
  }, [vehicles, searchQuery, brandFilter]);

  // Fleet stats
  const fleetStats = useMemo(() => {
    const totalJobs = Array.from(vehicleJobCounts.values()).reduce((acc, count) => acc + count, 0);
    const avgJobsPerVehicle = vehicles.length > 0 ? Math.round(totalJobs / vehicles.length * 10) / 10 : 0;
    const brandsCount = new Set(vehicles.map(v => v.brand)).size;

    return {
      total: vehicles.length,
      totalJobs,
      avgJobsPerVehicle,
      brandsCount,
    };
  }, [vehicles, vehicleJobCounts]);

  const handleAddVehicle = async () => {
    const vehicleData: Record<string, any> = {
      brand: formData.brand,
      model: formData.model,
      year: formData.year,
      licensePlate: formData.licensePlate.toUpperCase(),
    };
    // Only include optional fields if they have values (Firebase rejects undefined)
    if (formData.vin) vehicleData.vin = formData.vin;
    if (formData.color) vehicleData.color = formData.color;
    if (formData.fuelType) vehicleData.fuelType = formData.fuelType;

    await addVehicle(vehicleData as any);
    setAddDialogOpen(false);
    resetForm();
    setRefreshKey(prev => prev + 1);
    toast({
      title: 'Vehicle added',
      description: `${formData.brand} ${formData.model} has been added to the fleet.`,
    });
  };

  const handleEditVehicle = async () => {
    if (!selectedVehicle) return;
    const updates: Record<string, any> = {
      brand: formData.brand,
      model: formData.model,
      year: formData.year,
      licensePlate: formData.licensePlate.toUpperCase(),
    };
    // Only include optional fields if they have values (Firebase rejects undefined)
    if (formData.vin) updates.vin = formData.vin;
    if (formData.color) updates.color = formData.color;
    if (formData.fuelType) updates.fuelType = formData.fuelType;

    await updateVehicle(selectedVehicle.id, updates);
    setEditDialogOpen(false);
    setSelectedVehicle(null);
    resetForm();
    setRefreshKey(prev => prev + 1);
    toast({
      title: 'Vehicle updated',
      description: `${formData.brand} ${formData.model} has been updated.`,
    });
  };

  const handleDeleteVehicle = () => {
    if (!selectedVehicle) return;
    deleteVehicle(selectedVehicle.id);
    setDeleteDialogOpen(false);
    setSelectedVehicle(null);
    setRefreshKey(prev => prev + 1);
    toast({
      title: 'Vehicle deleted',
      description: 'The vehicle has been removed from the fleet.',
    });
  };

  const resetForm = () => {
    setFormData({
      brand: '',
      model: '',
      year: new Date().getFullYear(),
      licensePlate: '',
      vin: '',
      color: '',
      fuelType: '',
    });
  };

  const openEditDialog = (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle);
    setFormData({
      brand: vehicle.brand,
      model: vehicle.model,
      year: vehicle.year,
      licensePlate: vehicle.licensePlate,
      vin: vehicle.vin || '',
      color: vehicle.color || '',
      fuelType: vehicle.fuelType || '',
    });
    setEditDialogOpen(true);
  };

  const getJobCount = (vehicleId: string) => vehicleJobCounts.get(vehicleId) || 0;

  return (
    <div className="space-y-8 pb-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">{t('vehicles.title')}</h1>
          <p className="text-muted-foreground">{t('vehicles.subtitle')}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" className="h-9" onClick={() => setAddDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            {t('vehicles.addVehicle')}
          </Button>
        </div>
      </div>

      {/* Fleet Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <CarFront className="h-5 w-5 text-primary" />
              <div>
                <p className="text-2xl font-bold">{fleetStats.total}</p>
                <p className="text-xs text-muted-foreground">{t('vehicles.totalVehicles')}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <FileText className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{fleetStats.totalJobs}</p>
                <p className="text-xs text-muted-foreground">{t('customers.totalJobs')}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Gauge className="h-5 w-5 text-emerald-500" />
              <div>
                <p className="text-2xl font-bold">{fleetStats.avgJobsPerVehicle}</p>
                <p className="text-xs text-muted-foreground">{t('vehicles.avgJobsPerVehicle')}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <LayoutGrid className="h-5 w-5 text-violet-500" />
              <div>
                <p className="text-2xl font-bold">{fleetStats.brandsCount}</p>
                <p className="text-xs text-muted-foreground">{t('vehicles.brands')}</p>
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
            placeholder={t('vehicles.searchPlaceholder')}
            className="pl-10 h-10 bg-muted/30 border-0"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Select value={brandFilter} onValueChange={setBrandFilter}>
          <SelectTrigger className="w-44 h-10 bg-muted/30 border-0">
            <Filter className="h-4 w-4 mr-2 text-muted-foreground" />
            <SelectValue placeholder={t('vehicles.filterByBrand')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('vehicles.allBrands')}</SelectItem>
            {uniqueBrands.map(brand => (
              <SelectItem key={brand} value={brand}>{brand}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">{t('vehicles.loading')}</p>
        </div>
      )}

      {/* Vehicles Grid */}
      {!isLoading && (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredVehicles.map(vehicle => (
          <VehicleCard
            key={vehicle.id}
            vehicle={vehicle}
            jobCount={getJobCount(vehicle.id)}
            onEdit={() => openEditDialog(vehicle)}
            onDelete={() => {
              setSelectedVehicle(vehicle);
              setDeleteDialogOpen(true);
            }}
            onViewHistory={() => navigate(`/vehicles/${vehicle.id}/history`)}
            t={t}
          />
        ))}
          {filteredVehicles.length === 0 && (
            <div className="col-span-full text-center py-12">
              <Car className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
              <p className="text-muted-foreground">{t('vehicles.noVehiclesFound')}</p>
            </div>
          )}
        </div>
      )}

      {/* Add Vehicle Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{t('vehicles.addVehicle')}</DialogTitle>
            <DialogDescription>
              {t('vehicles.addVehicleDialog')}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t('vehicles.brand')}</Label>
                <Select
                  value={formData.brand}
                  onValueChange={(v) => setFormData(prev => ({ ...prev, brand: v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t('vehicles.selectBrand')} />
                  </SelectTrigger>
                  <SelectContent>
                    {CAR_BRANDS.map(brand => (
                      <SelectItem key={brand} value={brand}>{brand}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{t('vehicles.model')}</Label>
                <Input
                  value={formData.model}
                  onChange={(e) => setFormData(prev => ({ ...prev, model: e.target.value }))}
                  placeholder={t('vehicles.modelPlaceholder')}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t('vehicles.year')}</Label>
                <Input
                  type="number"
                  value={formData.year}
                  onChange={(e) => setFormData(prev => ({ ...prev, year: parseInt(e.target.value) || new Date().getFullYear() }))}
                  min={1900}
                  max={new Date().getFullYear() + 1}
                />
              </div>
              <div className="space-y-2">
                <Label>{t('vehicles.licensePlate')}</Label>
                <Input
                  value={formData.licensePlate}
                  onChange={(e) => setFormData(prev => ({ ...prev, licensePlate: e.target.value }))}
                  placeholder={t('vehicles.platePlaceholder')}
                  className="uppercase"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t('vehicles.vinOptional')}</Label>
                <Input
                  value={formData.vin}
                  onChange={(e) => setFormData(prev => ({ ...prev, vin: e.target.value }))}
                  placeholder={t('vehicles.vinPlaceholder')}
                  maxLength={17}
                />
              </div>
              <div className="space-y-2">
                <Label>{t('vehicles.colorOptional')}</Label>
                <Input
                  value={formData.color}
                  onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                  placeholder={t('vehicles.colorPlaceholder')}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>{t('vehicles.fuelTypeOptional')}</Label>
              <Select
                value={formData.fuelType}
                onValueChange={(v) => setFormData(prev => ({ ...prev, fuelType: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('vehicles.selectFuelType')} />
                </SelectTrigger>
                <SelectContent>
                  {FUEL_TYPES.map(fuel => (
                    <SelectItem key={fuel.value} value={fuel.value}>{fuel.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setAddDialogOpen(false); resetForm(); }}>{t('common.cancel')}</Button>
            <Button
              onClick={handleAddVehicle}
              disabled={!formData.brand || !formData.model || !formData.licensePlate}
            >
              {t('vehicles.addVehicle')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Vehicle Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{t('vehicles.editVehicle')}</DialogTitle>
            <DialogDescription>
              {t('vehicles.editVehicleDialog')}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t('vehicles.brand')}</Label>
                <Select
                  value={formData.brand}
                  onValueChange={(v) => setFormData(prev => ({ ...prev, brand: v }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CAR_BRANDS.map(brand => (
                      <SelectItem key={brand} value={brand}>{brand}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{t('vehicles.model')}</Label>
                <Input
                  value={formData.model}
                  onChange={(e) => setFormData(prev => ({ ...prev, model: e.target.value }))}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t('vehicles.year')}</Label>
                <Input
                  type="number"
                  value={formData.year}
                  onChange={(e) => setFormData(prev => ({ ...prev, year: parseInt(e.target.value) || new Date().getFullYear() }))}
                />
              </div>
              <div className="space-y-2">
                <Label>{t('vehicles.licensePlate')}</Label>
                <Input
                  value={formData.licensePlate}
                  onChange={(e) => setFormData(prev => ({ ...prev, licensePlate: e.target.value }))}
                  className="uppercase"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t('vehicles.vin')}</Label>
                <Input
                  value={formData.vin}
                  onChange={(e) => setFormData(prev => ({ ...prev, vin: e.target.value }))}
                  maxLength={17}
                />
              </div>
              <div className="space-y-2">
                <Label>{t('vehicles.color')}</Label>
                <Input
                  value={formData.color}
                  onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>{t('vehicles.fuelType')}</Label>
              <Select
                value={formData.fuelType}
                onValueChange={(v) => setFormData(prev => ({ ...prev, fuelType: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('vehicles.selectFuelType')} />
                </SelectTrigger>
                <SelectContent>
                  {FUEL_TYPES.map(fuel => (
                    <SelectItem key={fuel.value} value={fuel.value}>{fuel.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setEditDialogOpen(false); resetForm(); }}>{t('common.cancel')}</Button>
            <Button onClick={handleEditVehicle}>{t('common.save')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t('vehicles.deleteVehicle')}</DialogTitle>
            <DialogDescription>
              {t('vehicles.deleteConfirm')
                .replace('{brand}', selectedVehicle?.brand || '')
                .replace('{model}', selectedVehicle?.model || '')
                .replace('{plate}', selectedVehicle?.licensePlate || '')}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>{t('common.cancel')}</Button>
            <Button variant="destructive" onClick={handleDeleteVehicle}>{t('common.delete')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
