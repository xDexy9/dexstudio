import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  getAllServices,
  addService,
  updateService,
  deleteService,
  generateServiceCode,
  calculateServicePrice,
} from '@/services/servicesService';
import { Service } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Wrench,
  Plus,
  Search,
  Edit,
  Trash2,
  Clock,
  Euro,
  TrendingUp,
} from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const SERVICE_CATEGORIES = [
  'brakes',
  'fluids',
  'electrical',
  'air_system',
  'gauges',
  'transmission',
  'suspension',
  'body',
  'lighting',
  'cooling',
  'engine',
  'drivetrain',
  'audio',
  'wheels',
  'diagnostic',
  'inspection',
  'maintenance',
  'repair',
  'other',
];


export function ServicesManagementPage() {
  const { user } = useAuth();
  const { t } = useLanguage();

  const SKILL_LEVELS = [
    { value: 'junior', label: t('services.skillLevels.junior') },
    { value: 'senior', label: t('services.skillLevels.senior') },
    { value: 'specialist', label: t('services.skillLevels.specialist') },
  ];

  const [services, setServices] = useState<Service[]>([]);
  const [filteredServices, setFilteredServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    serviceCode: '',
    name: '',
    description: '',
    category: '',
    pricingType: 'fixed' as const,
    hourlyRate: 0,
    fixedPrice: 0,
    estimatedDuration: 0,
    taxRate: 20,
    skillLevel: 'junior' as const,
    includesParts: false,
    isActive: true,
    notes: '',
  });

  useEffect(() => {
    loadServices();
  }, []);

  useEffect(() => {
    filterServices();
  }, [services, searchTerm, selectedCategory]);

  const loadServices = async () => {
    try {
      setLoading(true);
      const data = await getAllServices();
      setServices(data);
    } catch (error) {
      console.error('Error loading services:', error);
      toast.error(t('services.loadError'));
    } finally {
      setLoading(false);
    }
  };

  const filterServices = () => {
    let filtered = [...services];

    // Filter by search term
    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      filtered = filtered.filter(
        s =>
          s.name.toLowerCase().includes(lower) ||
          s.serviceCode.toLowerCase().includes(lower) ||
          s.description?.toLowerCase().includes(lower)
      );
    }

    // Filter by category
    if (selectedCategory && selectedCategory !== 'all') {
      filtered = filtered.filter(s => s.category === selectedCategory);
    }

    setFilteredServices(filtered);
  };

  const resetForm = () => {
    setFormData({
      serviceCode: '',
      name: '',
      description: '',
      category: '',
      pricingType: 'fixed',
      hourlyRate: 0,
      fixedPrice: 0,
      estimatedDuration: 0,
      taxRate: 20,
      skillLevel: 'junior',
      includesParts: false,
      isActive: true,
      notes: '',
    });
  };

  const handleAddService = async () => {
    if (!user) return;

    try {
      if (!formData.name || !formData.serviceCode || !formData.category) {
        toast.error(t('common.fillRequired'));
        return;
      }

      if (formData.pricingType === 'hourly' && formData.hourlyRate <= 0) {
        toast.error(t('services.validHourlyRate'));
        return;
      }

      if (formData.pricingType === 'fixed' && formData.fixedPrice <= 0) {
        toast.error(t('services.validFixedPrice'));
        return;
      }

      await addService(formData, user.id);
      toast.success(t('services.added'));
      setIsAddModalOpen(false);
      resetForm();
      loadServices();
    } catch (error) {
      console.error('Error adding service:', error);
      toast.error(t('services.addError'));
    }
  };

  const handleEditService = async () => {
    if (!user || !editingService) return;

    try {
      await updateService(editingService.id, formData, user.id);
      toast.success(t('services.updated'));
      setIsEditModalOpen(false);
      setEditingService(null);
      resetForm();
      loadServices();
    } catch (error) {
      console.error('Error updating service:', error);
      toast.error(t('services.updateError'));
    }
  };

  const handleDeleteService = async (serviceId: string) => {
    if (!user) return;

    if (!confirm(t('services.confirmDelete'))) return;

    try {
      await deleteService(serviceId, user.id);
      toast.success(t('services.deleted'));
      setServices(prev => prev.filter(s => s.id !== serviceId));
    } catch (error) {
      console.error('Error deleting service:', error);
      toast.error(t('services.deleteError'));
    }
  };

  const openAddModal = async () => {
    const code = await generateServiceCode();
    setFormData(prev => ({ ...prev, serviceCode: code }));
    setIsAddModalOpen(true);
  };

  const openEditModal = (service: Service) => {
    setEditingService(service);
    setFormData({
      serviceCode: service.serviceCode,
      name: service.name,
      description: service.description || '',
      category: service.category,
      pricingType: service.pricingType,
      hourlyRate: service.hourlyRate || 0,
      fixedPrice: service.fixedPrice || 0,
      estimatedDuration: service.estimatedDuration || 0,
      taxRate: service.taxRate,
      skillLevel: service.skillLevel || 'junior',
      includesParts: service.includesParts,
      isActive: service.isActive,
      notes: service.notes || '',
    });
    setIsEditModalOpen(true);
  };

  const stats = {
    total: services.length,
    active: services.filter(s => s.isActive).length,
    hourly: services.filter(s => s.pricingType === 'hourly').length,
    fixed: services.filter(s => s.pricingType === 'fixed').length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Wrench className="h-8 w-8 text-primary" />
            {t('services.title')}
          </h1>
          <p className="text-muted-foreground mt-1">
            {t('services.subtitle')}
          </p>
        </div>
        <Button onClick={openAddModal}>
          <Plus className="h-4 w-4 mr-2" />
          {t('services.addNew')}
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t('services.totalServices')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t('services.activeServices')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.active}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t('services.hourlyServices')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.hourly}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t('services.fixedPrice')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{stats.fixed}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <div className="relative flex-1 min-w-[300px]">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t('services.searchPlaceholder')}
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder={t('services.allCategories')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('services.allCategories')}</SelectItem>
            {SERVICE_CATEGORIES.map(cat => (
              <SelectItem key={cat} value={cat}>
                {t(`services.categories.${cat}` as any)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Services Table */}
      <div className="rounded-lg border">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium">{t('services.code')}</th>
                <th className="px-4 py-3 text-left text-sm font-medium">{t('common.name')}</th>
                <th className="px-4 py-3 text-left text-sm font-medium">{t('services.category')}</th>
                <th className="px-4 py-3 text-left text-sm font-medium">{t('services.pricing')}</th>
                <th className="px-4 py-3 text-right text-sm font-medium">{t('services.price')}</th>
                <th className="px-4 py-3 text-center text-sm font-medium">{t('services.duration')}</th>
                <th className="px-4 py-3 text-center text-sm font-medium">{t('common.actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredServices.map(service => (
                <tr key={service.id} className="hover:bg-muted/30">
                  <td className="px-4 py-3 text-sm font-mono">{service.serviceCode}</td>
                  <td className="px-4 py-3">
                    <div>
                      <div className="font-medium">{service.name}</div>
                      {service.description && (
                        <div className="text-sm text-muted-foreground line-clamp-1">
                          {service.description}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm capitalize">{service.category.replace('_', ' ')}</td>
                  <td className="px-4 py-3">
                    <Badge variant={service.pricingType === 'hourly' ? 'default' : 'secondary'}>
                      {service.pricingType === 'hourly' ? t('services.hourly') : t('services.fixed')}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-right font-semibold">
                    {service.pricingType === 'hourly'
                      ? `€${service.hourlyRate?.toFixed(2)}/hr`
                      : `€${service.fixedPrice?.toFixed(2)}`}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-1 text-sm">
                      <Clock className="h-3 w-3" />
                      {service.estimatedDuration ? `${service.estimatedDuration}h` : '-'}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditModal(service)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteService(service.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredServices.length === 0 && (
          <div className="text-center py-12">
            <Wrench className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">{t('services.noServicesFound')}</p>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      <Dialog open={isAddModalOpen || isEditModalOpen} onOpenChange={(open) => {
        if (!open) {
          setIsAddModalOpen(false);
          setIsEditModalOpen(false);
          setEditingService(null);
          resetForm();
        }
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingService ? t('services.editService') : t('services.addNew')}
            </DialogTitle>
            <DialogDescription>
              {editingService ? t('services.updateDetails') : t('services.addDescription')}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="serviceCode">{t('services.serviceCode')} *</Label>
                <Input
                  id="serviceCode"
                  value={formData.serviceCode}
                  onChange={e => setFormData(prev => ({ ...prev, serviceCode: e.target.value }))}
                  placeholder="e.g., SRV-0001"
                />
              </div>

              <div>
                <Label htmlFor="name">{t('services.serviceName')} *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Oil Change"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="description">{t('common.description')}</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder={t('services.descriptionPlaceholder')}
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="category">{t('services.category')} *</Label>
                <Select
                  value={formData.category}
                  onValueChange={value => setFormData(prev => ({ ...prev, category: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t('services.selectCategory')} />
                  </SelectTrigger>
                  <SelectContent>
                    {SERVICE_CATEGORIES.map(cat => (
                      <SelectItem key={cat} value={cat}>
                        {t(`services.categories.${cat}` as any)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

            </div>

            <div className="space-y-3 border-t pt-4">
              <h4 className="font-semibold">{t('services.pricingType')}</h4>

              <RadioGroup
                value={formData.pricingType}
                onValueChange={(value: any) => setFormData(prev => ({ ...prev, pricingType: value }))}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="fixed" id="fixed" />
                  <Label htmlFor="fixed">{t('services.fixedPrice')}</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="hourly" id="hourly" />
                  <Label htmlFor="hourly">{t('services.hourlyRate')}</Label>
                </div>
              </RadioGroup>

              {formData.pricingType === 'fixed' ? (
                <div>
                  <Label htmlFor="fixedPrice">{t('services.fixedPriceEuro')} *</Label>
                  <Input
                    id="fixedPrice"
                    type="number"
                    step="0.01"
                    value={formData.fixedPrice || ''}
                    placeholder="0.00"
                    onFocus={e => e.target.select()}
                    onChange={e => setFormData(prev => ({ ...prev, fixedPrice: Number(e.target.value) }))}
                  />
                </div>
              ) : (
                <div>
                  <Label htmlFor="hourlyRate">{t('services.hourlyRateEuro')} *</Label>
                  <Input
                    id="hourlyRate"
                    type="number"
                    step="0.01"
                    value={formData.hourlyRate || ''}
                    placeholder="0.00"
                    onFocus={e => e.target.select()}
                    onChange={e => setFormData(prev => ({ ...prev, hourlyRate: Number(e.target.value) }))}
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="estimatedDuration">{t('services.estimatedDuration')}</Label>
                  <Input
                    id="estimatedDuration"
                    type="number"
                    step="0.5"
                    value={formData.estimatedDuration || ''}
                    placeholder="0"
                    onFocus={e => e.target.select()}
                    onChange={e => setFormData(prev => ({ ...prev, estimatedDuration: Number(e.target.value) }))}
                  />
                </div>

                <div>
                  <Label htmlFor="taxRate">{t('services.taxRate')}</Label>
                  <Input
                    id="taxRate"
                    type="number"
                    step="0.1"
                    value={formData.taxRate || ''}
                    placeholder="0"
                    onFocus={e => e.target.select()}
                    onChange={e => setFormData(prev => ({ ...prev, taxRate: Number(e.target.value) }))}
                  />
                </div>
              </div>
            </div>

            <div>
              <Label htmlFor="notes">{t('common.notes')}</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={e => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder={t('services.notesPlaceholder')}
                rows={2}
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => {
                setIsAddModalOpen(false);
                setIsEditModalOpen(false);
                setEditingService(null);
                resetForm();
              }}
            >
              {t('common.cancel')}
            </Button>
            <Button onClick={editingService ? handleEditService : handleAddService}>
              {editingService ? t('services.updateService') : t('services.addService')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
