import React, { useState, useEffect } from 'react';
import { Car, Plus, Search, Gauge, History, Fuel } from 'lucide-react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import { addVehicle, getVehicles, findVehicleByPlate, getJobsByVehicle } from '@/services/firestoreService';
import { Vehicle, FuelType } from '@/lib/types';
import { JobFormData } from '../CreateJobWizard';
import { LicensePlate } from '@/components/ui/license-plate';
import { CarBrandLogo } from '@/components/ui/car-brand-logo';

const FUEL_TYPES: { value: FuelType; label: string }[] = [
  { value: 'petrol', label: 'Petrol' },
  { value: 'diesel', label: 'Diesel' },
  { value: 'electric', label: 'Electric' },
  { value: 'hybrid', label: 'Hybrid' },
  { value: 'lpg', label: 'LPG' },
  { value: 'other', label: 'Other' },
];

const vehicleSchema = z.object({
  brand: z.string().min(1, 'Brand is required'),
  model: z.string().optional(),
  year: z.coerce.number().min(1900).max(new Date().getFullYear() + 1).optional().or(z.literal('' as any)),
  licensePlate: z.string().min(1, 'License plate is required'),
  vin: z.string().optional(),
  color: z.string().optional(),
  fuelType: z.string().optional(),
  customerId: z.string().optional(),
});

type VehicleFormData = z.infer<typeof vehicleSchema>;

interface VehicleStepProps {
  formData: JobFormData;
  selectedVehicle: Vehicle | null;
  error?: string;
  onVehicleSelect: (vehicle: Vehicle) => void;
  onClearVehicle: () => void;
  onUpdate: (updates: Partial<JobFormData>) => void;
}

export function VehicleStep({ 
  formData,
  selectedVehicle, 
  error, 
  onVehicleSelect, 
  onClearVehicle,
  onUpdate 
}: VehicleStepProps) {
  const { t } = useLanguage();
  const { toast } = useToast();

  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [vehicleSearch, setVehicleSearch] = useState('');
  const [vehicleDialogOpen, setVehicleDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [jobCounts, setJobCounts] = useState<Map<string, number>>(new Map());

  useEffect(() => {
    const loadVehicles = async () => {
      setIsLoading(true);
      try {
        const vehiclesData = await getVehicles();
        setVehicles(vehiclesData);

        // Load job counts for all vehicles
        const counts = new Map<string, number>();
        await Promise.all(
          vehiclesData.map(async (vehicle) => {
            const jobs = await getJobsByVehicle(vehicle.id);
            counts.set(vehicle.id, jobs.length);
          })
        );
        setJobCounts(counts);
      } catch (error) {
        console.error('Error loading vehicles:', error);
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to load vehicles',
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadVehicles();
  }, [toast]);

  const vehicleForm = useForm<VehicleFormData>({
    resolver: zodResolver(vehicleSchema),
    defaultValues: {
      brand: '',
      model: '',
      year: new Date().getFullYear(),
      licensePlate: '',
      vin: '',
      color: '',
      fuelType: '',
    },
  });

  const filteredVehicles = vehicles.filter(v =>
    v.licensePlate.toLowerCase().includes(vehicleSearch.toLowerCase()) ||
    v.brand.toLowerCase().includes(vehicleSearch.toLowerCase()) ||
    v.model?.toLowerCase().includes(vehicleSearch.toLowerCase()) ||
    v.vin?.toLowerCase().includes(vehicleSearch.toLowerCase())
  );

  const onAddVehicle = async (data: VehicleFormData) => {
    const existing = await findVehicleByPlate(data.licensePlate);
    if (existing) {
      vehicleForm.setError('licensePlate', { message: 'License plate already exists' });
      return;
    }

    const vehicleData: Record<string, any> = {
      brand: data.brand,
      licensePlate: data.licensePlate.toUpperCase(),
    };
    if (data.model) vehicleData.model = data.model;
    if (data.year) vehicleData.year = data.year;
    // Only include optional fields if they have values
    if (data.vin) vehicleData.vin = data.vin.toUpperCase();
    if (data.color) vehicleData.color = data.color;
    if (data.fuelType) vehicleData.fuelType = data.fuelType;
    if (data.customerId) vehicleData.customerId = data.customerId;

    // addVehicle returns the Firebase-generated ID
    const newId = await addVehicle(vehicleData as any);

    const newVehicle: Vehicle = {
      id: newId,
      ...vehicleData,
      createdAt: new Date().toISOString(),
    } as Vehicle;

    setVehicles([...vehicles, newVehicle]);
    setJobCounts(new Map(jobCounts).set(newId, 0));
    onVehicleSelect(newVehicle);
    setVehicleDialogOpen(false);
    vehicleForm.reset();

    toast({
      title: 'Vehicle added',
      description: `${data.brand} ${data.model} has been added`,
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="text-center py-16">
          <p className="text-muted-foreground text-lg">Loading vehicles...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold mb-2">{t('jobs.vehicleInfo')}</h2>
        <p className="text-muted-foreground">
          {t('jobs.vehicle.searchSubtitle')}
        </p>
      </div>

      {selectedVehicle ? (
        <div className="space-y-4">
          {/* Premium Selected Vehicle Card */}
          <Card className="glass-strong border-2 border-primary shadow-premium-lg overflow-hidden animate-scale-in">
            <div className="absolute inset-0 gradient-royal-radial opacity-10 pointer-events-none" />
            <CardContent className="pt-6 relative">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 flex items-center justify-center shrink-0">
                    <CarBrandLogo brand={selectedVehicle.brand} size="xl" className="text-primary" />
                  </div>
                  <div>
                    <LicensePlate plateNumber={selectedVehicle.licensePlate} size="lg" />
                    <p className="text-lg font-bold text-gradient-royal mt-2">
                      {selectedVehicle.brand} {selectedVehicle.model}
                    </p>
                    <p className="text-muted-foreground font-medium text-sm">
                      {selectedVehicle.year}
                      {selectedVehicle.fuelType && ` • ${selectedVehicle.fuelType.charAt(0).toUpperCase() + selectedVehicle.fuelType.slice(1)}`}
                    </p>
                    {selectedVehicle.vin && (
                      <p className="text-xs text-muted-foreground mt-1 font-mono bg-muted/50 px-2 py-1 rounded inline-block">
                        VIN: {selectedVehicle.vin}
                      </p>
                    )}
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onClearVehicle}
                  className="hover:bg-primary/10 hover:text-primary hover:border-primary transition-all"
                >
                  {t('jobs.vehicle.change')}
                </Button>
              </div>

              {/* Premium Vehicle History Badge */}
              {(jobCounts.get(selectedVehicle.id) || 0) > 0 && (
                <div className="mt-4 flex items-center gap-2 p-4 glass-light rounded-xl border-l-4 border-l-gold animate-slide-up">
                  <History className="h-5 w-5 text-gold" />
                  <span className="text-sm">
                    <Badge className="mr-2 bg-gold/20 text-gold-foreground border-gold/30">
                      {t('jobs.vehicle.previousJobs').replace('{count}', String(jobCounts.get(selectedVehicle.id) || 0))}
                    </Badge>
                    <span className="text-muted-foreground font-medium">{t('jobs.vehicle.onThisVehicle')}</span>
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Kilometers Card */}
          <Card className="glass-light border-0 shadow-premium hover-lift overflow-hidden">
            <div className="absolute inset-0 gradient-royal-radial opacity-5 pointer-events-none" />
            <CardContent className="pt-6 relative">
              <div className="space-y-3">
                <Label htmlFor="mileage" className="flex items-center gap-2 text-sm font-semibold">
                  <Gauge className="h-4 w-4 text-primary" />
                  {t('jobs.vehicle.currentKm')}
                </Label>
                <Input
                  id="mileage"
                  type="number"
                  value={formData.mileage}
                  onChange={(e) => onUpdate({ mileage: e.target.value })}
                  placeholder={t('jobs.vehicle.kmPlaceholder')}
                  className="h-14 text-base rounded-xl border-2 border-border/30 focus:border-primary transition-all"
                />
                <p className="text-xs text-muted-foreground">
                  {t('jobs.vehicle.kmHelp')}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Premium Search Input */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-primary" />
            <Input
              placeholder={t('jobs.vehicle.searchPlaceholder')}
              value={vehicleSearch}
              onChange={(e) => setVehicleSearch(e.target.value)}
              className={`h-16 pl-12 text-base rounded-xl border-2 transition-all ${
                error
                  ? 'border-destructive focus:border-destructive'
                  : 'border-primary/20 focus:border-primary'
              }`}
            />
          </div>
          {error && (
            <p className="text-sm text-destructive flex items-center gap-1">
              <span className="text-lg">⚠</span> {error}
            </p>
          )}

          {/* Premium Vehicle Search Results */}
          {vehicleSearch && filteredVehicles.length > 0 && (
            <Card className="glass-strong border-0 shadow-premium-lg overflow-hidden animate-slide-down">
              <CardContent className="p-0 divide-y divide-border/30 max-h-80 overflow-y-auto scrollbar-premium">
                {filteredVehicles.map((vehicle) => {
                  const jobCount = jobCounts.get(vehicle.id) || 0;
                  return (
                    <button
                      key={vehicle.id}
                      type="button"
                      className="w-full p-4 text-left hover:bg-primary/5 transition-all duration-200 flex items-center justify-between group"
                      onClick={() => {
                        onVehicleSelect(vehicle);
                        setVehicleSearch('');
                      }}
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 flex items-center justify-center group-hover:scale-110 transition-transform shrink-0">
                          <CarBrandLogo brand={vehicle.brand} size="lg" className="text-primary" />
                        </div>
                        <div>
                          <LicensePlate plateNumber={vehicle.licensePlate} size="md" className="mb-1" />
                          <p className="font-semibold text-foreground group-hover:text-primary transition-colors">
                            {vehicle.brand} {vehicle.model}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {vehicle.year}
                            {vehicle.fuelType && ` • ${vehicle.fuelType.charAt(0).toUpperCase() + vehicle.fuelType.slice(1)}`}
                          </p>
                        </div>
                      </div>
                      {jobCount > 0 && (
                        <Badge className="bg-gold/10 text-gold-foreground border-gold/30 shrink-0">
                          {jobCount} jobs
                        </Badge>
                      )}
                    </button>
                  );
                })}
              </CardContent>
            </Card>
          )}

          {vehicleSearch && filteredVehicles.length === 0 && (
            <Card className="glass-light border-2 border-dashed border-border/50 shadow-premium animate-fade-in">
              <CardContent className="py-12 text-center">
                <Car className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-50" />
                <p className="text-muted-foreground font-medium">No vehicles found</p>
              </CardContent>
            </Card>
          )}

          <Dialog open={vehicleDialogOpen} onOpenChange={setVehicleDialogOpen}>
            <DialogTrigger asChild>
              <Button className="w-full h-16 text-base gradient-royal hover:shadow-glow transition-all font-semibold">
                <Plus className="mr-2 h-5 w-5" />
                {t('jobs.addVehicle')}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{t('jobs.addVehicle')}</DialogTitle>
              </DialogHeader>
              <Form {...vehicleForm}>
                <form onSubmit={vehicleForm.handleSubmit(onAddVehicle)} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={vehicleForm.control}
                      name="brand"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('vehicle.brand')} *</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Toyota" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={vehicleForm.control}
                      name="model"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('vehicle.model')}</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Camry" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={vehicleForm.control}
                    name="year"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('vehicle.year')}</FormLabel>
                        <FormControl>
                          <Input {...field} type="number" placeholder="2023" value={field.value || ''} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={vehicleForm.control}
                    name="licensePlate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('vehicle.licensePlate')} *</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="ABC-1234" className="uppercase" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={vehicleForm.control}
                      name="vin"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>VIN (optional)</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="1HGCM82633A123456" className="uppercase" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={vehicleForm.control}
                      name="fuelType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Fuel Type (optional)</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select fuel type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {FUEL_TYPES.map((fuel) => (
                                <SelectItem key={fuel.value} value={fuel.value}>
                                  {fuel.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <Button type="submit" className="w-full">
                    {t('common.save')}
                  </Button>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      )}
    </div>
  );
}
