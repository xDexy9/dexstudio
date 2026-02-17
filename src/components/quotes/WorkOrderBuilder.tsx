import { useState, useEffect, useMemo, useRef } from 'react';
import { Plus, Trash2, Clock, AlertCircle, Package, ChevronRight, ChevronLeft, Check, Search, Wrench, PenLine, CornerDownLeft, Zap, Minus, FileText, Info, ShoppingCart, Warehouse } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useLanguage } from '@/contexts/LanguageContext';
import { Job, WorkOrderData, WorkOrderItem, WorkOrderFinding, WorkOrderPart, Service, Part } from '@/lib/types';
import { useAuth } from '@/contexts/AuthContext';
import { getTranslatedProblemDescription } from '@/lib/jobTranslation';
import { getActiveServices, addService } from '@/services/servicesService';
import { getActiveParts, addPart } from '@/services/partsService';
import { getCompanySettings } from '@/services/companySettingsService';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface WorkOrderBuilderProps {
  open: boolean;
  onClose: () => void;
  job: Job;
  onSave: (workOrderData: WorkOrderData) => Promise<void>;
  onProcessQuote?: (workOrderData: WorkOrderData) => void;
}

export function WorkOrderBuilder({ open, onClose, job, onSave, onProcessQuote }: WorkOrderBuilderProps) {
  const { user } = useAuth();
  const { t, language: userLanguage } = useLanguage();
  const isMechanic = user?.role === 'mechanic';

  const STEPS = isMechanic
    ? [
        { id: 1, label: t('wo.header'), icon: Wrench },
        { id: 2, label: t('wo.findings'), icon: AlertCircle },
        { id: 3, label: t('wo.workRequired'), icon: Clock },
        { id: 4, label: t('wo.parts'), icon: Package },
        { id: 5, label: t('wo.summary'), icon: Check },
      ]
    : [
        { id: 1, label: t('wo.header'), icon: Wrench },
        { id: 2, label: t('wo.findings'), icon: AlertCircle },
        { id: 3, label: t('wo.workRequired'), icon: Clock },
        { id: 4, label: t('wo.parts'), icon: Package },
        { id: 5, label: t('wo.summary'), icon: Check },
        { id: 6, label: t('wo.quote'), icon: FileText },
      ];

  const maxStep = STEPS.length;

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [services, setServices] = useState<Service[]>([]);
  const [catalogParts, setCatalogParts] = useState<Part[]>([]);
  const [serviceSearch, setServiceSearch] = useState('');
  const [partSearch, setPartSearch] = useState('');
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [partEntryMode, setPartEntryMode] = useState<'manual' | 'catalog'>('catalog');

  // Initialize work order data
  const [data, setData] = useState<WorkOrderData>(() => {
    const defaults: WorkOrderData = {
      department: '',
      date: new Date().toISOString().split('T')[0],
      vehiclePlate: job.vehicleLicensePlate || '',
      vehicleMake: job.vehicleBrand || '',
      vehicleModel: job.vehicleModel || '',
      mileage: job.mileage,
      mechanicName: user?.fullName || '',
      mechanicId: user?.id,
      workItems: [],
      findings: [],
      parts: [],
      urgencyPercent: job.priority === 'urgent' ? 100 : job.priority === 'normal' ? 50 : 25,
      laborSubtotal: 0,
      partsSubtotal: 0,
      discountPercent: 0,
      grandTotal: 0,
    };
    if (job.workOrderData) return { ...defaults, ...job.workOrderData };
    return defaults;
  });

  // Load catalog data
  useEffect(() => {
    if (!open) return;
    const load = async () => {
      try {
        const [svc, pts, settings] = await Promise.all([
          getActiveServices(),
          getActiveParts(),
          getCompanySettings(),
        ]);
        setServices(svc);
        setCatalogParts(pts);
        if (settings?.companyName && !data.department) {
          setData(prev => ({ ...prev, department: settings.companyName }));
        }
      } catch (err) {
        console.error('Error loading data:', err);
      }
    };
    load();
  }, [open]);

  // Recalculate totals
  const totals = useMemo(() => {
    const laborSubtotal = data.workItems.reduce((sum, item) => {
      if (item.fixedPrice != null) return sum + item.fixedPrice;
      return sum + (item.durationHours * (item.pricePerHour || 0));
    }, 0);
    const partsSubtotal = data.parts.reduce((sum, p) => sum + p.quantity * p.unitPrice, 0);
    const subtotal = laborSubtotal + partsSubtotal;
    const discount = subtotal * (data.discountPercent / 100);
    return {
      laborSubtotal,
      partsSubtotal,
      grandTotal: subtotal - discount,
    };
  }, [data.workItems, data.parts, data.discountPercent]);

  // Total labor hours
  const totalLaborHours = useMemo(() =>
    data.workItems.reduce((sum, item) => sum + item.durationHours, 0),
    [data.workItems]
  );

  // Filtered catalogs
  const filteredServices = useMemo(() => {
    if (!serviceSearch) return services;
    const q = serviceSearch.toLowerCase();
    return services.filter(s =>
      s.name.toLowerCase().includes(q) ||
      s.serviceCode.toLowerCase().includes(q) ||
      s.category.toLowerCase().includes(q)
    );
  }, [services, serviceSearch]);

  const filteredParts = useMemo(() => {
    if (!partSearch) return catalogParts;
    const q = partSearch.toLowerCase();
    return catalogParts.filter(p =>
      p.name.toLowerCase().includes(q) ||
      p.partNumber.toLowerCase().includes(q) ||
      p.category?.toLowerCase().includes(q)
    );
  }, [catalogParts, partSearch]);

  // --- Work Items ---
  const addServiceFromCatalog = (service: Service) => {
    if (data.workItems.find(w => w.serviceId === service.id)) {
      toast.info('Service already added');
      return;
    }
    const item: WorkOrderItem = {
      id: crypto.randomUUID(),
      serviceId: service.id,
      serviceName: service.name,
      serviceCode: service.serviceCode,
      description: service.description || service.name,
      isImmediate: false,
      isCustom: false,
      durationHours: service.estimatedDuration || 1,
      pricePerHour: service.hourlyRate,
      fixedPrice: service.pricingType === 'fixed' ? service.fixedPrice : undefined,
    };
    setData(prev => ({ ...prev, workItems: [...prev.workItems, item] }));
  };

  const addCustomServiceWithName = (name?: string) => {
    const item: WorkOrderItem = {
      id: crypto.randomUUID(),
      serviceName: name || '',
      description: '',
      isImmediate: false,
      isCustom: true,
      durationHours: 1,
    };
    setData(prev => ({ ...prev, workItems: [...prev.workItems, item] }));
    if (name) setServiceSearch('');
  };

  const updateWorkItem = (id: string, updates: Partial<WorkOrderItem>) => {
    setData(prev => ({
      ...prev,
      workItems: prev.workItems.map(w => w.id === id ? { ...w, ...updates } : w),
    }));
  };

  const removeWorkItem = (id: string) => {
    setData(prev => ({ ...prev, workItems: prev.workItems.filter(w => w.id !== id) }));
  };

  // --- Findings ---
  const [quickFinding, setQuickFinding] = useState('');
  const quickFindingRef = useRef<HTMLInputElement>(null);

  const COMMON_FINDINGS = [
    { key: 'wo.findingBrakePads', en: 'Brake pads worn' },
    { key: 'wo.findingOilLeak', en: 'Oil leak detected' },
    { key: 'wo.findingTireTread', en: 'Tire tread low' },
    { key: 'wo.findingBattery', en: 'Battery weak' },
    { key: 'wo.findingBelt', en: 'Belt cracked' },
    { key: 'wo.findingFluid', en: 'Fluid levels low' },
    { key: 'wo.findingSuspension', en: 'Suspension noise' },
    { key: 'wo.findingExhaust', en: 'Exhaust leak' },
    { key: 'wo.findingFilter', en: 'Filter clogged' },
    { key: 'wo.findingCorrosion', en: 'Corrosion found' },
  ];

  const addFinding = (description?: string) => {
    const finding: WorkOrderFinding = {
      id: crypto.randomUUID(),
      description: description || '',
      requiresReplacement: false,
      inStock: true,
    };
    setData(prev => ({ ...prev, findings: [...prev.findings, finding] }));
  };

  const addQuickFinding = () => {
    const text = quickFinding.trim();
    if (!text) return;
    addFinding(text);
    setQuickFinding('');
    quickFindingRef.current?.focus();
  };

  const updateFinding = (id: string, updates: Partial<WorkOrderFinding>) => {
    setData(prev => ({
      ...prev,
      findings: prev.findings.map(f => f.id === id ? { ...f, ...updates } : f),
    }));
  };

  const removeFinding = (id: string) => {
    setData(prev => ({ ...prev, findings: prev.findings.filter(f => f.id !== id) }));
  };

  // --- Parts ---
  const addPartFromCatalog = (part: Part) => {
    if (data.parts.find(p => p.partId === part.id)) {
      toast.info('Part already added');
      return;
    }
    const item: WorkOrderPart = {
      id: crypto.randomUUID(),
      partId: part.id,
      partName: part.name,
      partNumber: part.partNumber,
      description: part.description || part.name,
      quantity: 1,
      unitPrice: part.sellingPrice,
      isCustom: false,
      needsOrdering: part.stockQuantity <= 0,
    };
    setData(prev => ({ ...prev, parts: [...prev.parts, item] }));
  };

  const addCustomPartWithName = (name?: string) => {
    const item: WorkOrderPart = {
      id: crypto.randomUUID(),
      partName: name || '',
      description: '',
      quantity: 1,
      unitPrice: 0,
      isCustom: true,
      needsOrdering: true,
    };
    setData(prev => ({ ...prev, parts: [...prev.parts, item] }));
    if (name) setPartSearch('');
  };

  const updatePart = (id: string, updates: Partial<WorkOrderPart>) => {
    setData(prev => ({
      ...prev,
      parts: prev.parts.map(p => p.id === id ? { ...p, ...updates } : p),
    }));
  };

  const removePart = (id: string) => {
    setData(prev => ({ ...prev, parts: prev.parts.filter(p => p.id !== id) }));
  };

  // --- Return time helpers ---
  const setReturnTimeFromNow = (hours: number) => {
    const d = new Date();
    d.setHours(d.getHours() + hours);
    const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
    setData(prev => ({ ...prev, returnTime: local }));
  };

  const setReturnTimeTomorrow = () => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    d.setHours(9, 0, 0, 0);
    const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
    setData(prev => ({ ...prev, returnTime: local }));
  };

  // --- Auto-save custom items to catalog ---
  const autoSaveCustomItems = async () => {
    if (!user?.id) return;
    const defaultTax = 20;

    const servicePromises = data.workItems
      .filter(item => item.isCustom && item.serviceName.trim())
      .map(item =>
        addService({
          serviceCode: item.serviceCode || '',
          name: item.serviceName.trim(),
          description: item.description || '',
          category: 'custom',
          pricingType: 'hourly',
          hourlyRate: item.pricePerHour || 0,
          fixedPrice: item.fixedPrice,
          estimatedDuration: item.durationHours || 1,
          taxRate: defaultTax,
          skillLevel: 'junior',
          includesParts: false,
          isActive: true,
        }, user.id).catch(() => {})
      );

    const partPromises = data.parts
      .filter(part => part.isCustom && part.partName.trim())
      .map(part =>
        addPart({
          partNumber: part.partNumber || '',
          name: part.partName.trim(),
          description: part.description || '',
          category: 'custom',
          stockQuantity: 0,
          minStockLevel: 1,
          maxStockLevel: 10,
          unit: 'piece',
          costPrice: 0,
          sellingPrice: part.unitPrice || 0,
          markup: 0,
          taxRate: defaultTax,
          isActive: true,
        }, user.id).catch(() => {})
      );

    await Promise.all([...servicePromises, ...partPromises]);
  };

  // --- Save ---
  const handleSave = async () => {
    setLoading(true);
    try {
      const finalData: WorkOrderData = {
        ...data,
        ...totals,
        completedAt: new Date().toISOString(),
      };
      await autoSaveCustomItems();
      await onSave(finalData);
      setShowConfirmation(false);
      toast.success('Work order saved');
      onClose();
    } catch (err) {
      console.error('Error saving:', err);
      toast.error('Failed to save work order');
    } finally {
      setLoading(false);
    }
  };

  const next = () => {
    if (step === maxStep) {
      if (isMechanic) {
        setShowConfirmation(true);
      } else {
        // M/O on last step (Quote) - save was already handled
        setShowConfirmation(true);
      }
      return;
    }
    setStep(s => Math.min(s + 1, maxStep));
  };
  const back = () => setStep(s => Math.max(s - 1, 1));

  // Stock lookup helper
  const getPartStock = (partId?: string) => {
    if (!partId) return null;
    return catalogParts.find(p => p.id === partId);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0 overflow-hidden">
          {/* Header */}
          <DialogHeader className="px-6 pt-6 pb-0">
            <DialogTitle className="text-xl">
              Work Order — {data.vehiclePlate}
            </DialogTitle>
          </DialogHeader>

          {/* Step Indicator */}
          <div className="px-6 py-3 border-b overflow-x-auto">
            <div className="flex items-center gap-1">
              {STEPS.map((s, i) => (
                <div key={s.id} className="flex items-center">
                  <button
                    onClick={() => setStep(s.id)}
                    className={cn(
                      'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors whitespace-nowrap',
                      step === s.id
                        ? 'bg-primary text-primary-foreground'
                        : step > s.id
                        ? 'bg-primary/20 text-primary'
                        : 'bg-muted text-muted-foreground'
                    )}
                  >
                    <s.icon className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">{s.label}</span>
                    <span className="sm:hidden">{s.id}</span>
                  </button>
                  {i < STEPS.length - 1 && (
                    <ChevronRight className="h-4 w-4 text-muted-foreground mx-1" />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto overscroll-contain px-6 py-4" style={{ WebkitOverflowScrolling: 'touch' }}>
            {/* Step 1: Header */}
            {step === 1 && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs text-muted-foreground">{t('wo.department')}</Label>
                    <p className="font-medium">{data.department || '—'}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">{t('wo.date')}</Label>
                    <p className="font-medium">{new Date(data.date).toLocaleDateString('en-GB')}</p>
                  </div>
                </div>
                <Separator />
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label className="text-xs text-muted-foreground">{t('wo.registration')}</Label>
                    <p className="font-mono font-bold text-lg">{data.vehiclePlate}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">{t('wo.vehicle')}</Label>
                    <p className="font-medium">{data.vehicleMake} {data.vehicleModel}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">{t('wo.kilometers')}</Label>
                    <p className="font-medium">{data.mileage ? `${data.mileage.toLocaleString()} km` : '—'}</p>
                  </div>
                </div>
                <Separator />
                <div>
                  <Label className="text-xs text-muted-foreground">{t('wo.mechanic')}</Label>
                  <p className="font-medium">{data.mechanicName}</p>
                </div>
                {job.problemDescription && (
                  <>
                    <Separator />
                    <div>
                      <Label className="text-xs text-muted-foreground">{t('wo.bookingDescription')}</Label>
                      <p className="text-sm mt-1">{getTranslatedProblemDescription(job, userLanguage)}</p>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Step 3: Work / Services */}
            {step === 3 && (
              <div className="space-y-4">
                {/* Booking Information */}
                {job.problemDescription && (
                  <Card className="border-blue-200 bg-blue-50/50 dark:border-blue-800 dark:bg-blue-950/20">
                    <CardContent className="p-4 space-y-2">
                      <div className="flex items-center gap-2 mb-2">
                        <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                        <h4 className="font-semibold text-sm text-blue-900 dark:text-blue-100">{t('wo.customerReportedIssue')}</h4>
                      </div>
                      <p className="text-sm text-blue-800 dark:text-blue-200">{getTranslatedProblemDescription(job, userLanguage)}</p>
                    </CardContent>
                  </Card>
                )}

                {job.partsNeeded && job.partsNeeded.length > 0 && (
                  <Card className="border-amber-200 bg-amber-50/50 dark:border-amber-800 dark:bg-amber-950/20">
                    <CardContent className="p-4 space-y-2">
                      <div className="flex items-center gap-2 mb-2">
                        <Package className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                        <h4 className="font-semibold text-sm text-amber-900 dark:text-amber-100">{t('wo.faultCategories')}</h4>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {job.partsNeeded.map((part, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs bg-white dark:bg-slate-900">
                            {t(`modal.parts.category.${part.categoryId}`)}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                <Separator />

                {/* Catalog search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder={t('wo.searchServices')}
                    value={serviceSearch}
                    onChange={e => setServiceSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>

                {/* Available services grid */}
                <div className="grid grid-cols-2 gap-2 sm:max-h-48 sm:overflow-y-auto border rounded-lg p-2">
                  {filteredServices.map(service => {
                    const isAdded = data.workItems.some(w => w.serviceId === service.id);
                    return (
                      <div
                        key={service.id}
                        role="button"
                        tabIndex={isAdded ? -1 : 0}
                        aria-disabled={isAdded}
                        onClick={() => {
                          if (!isAdded) addServiceFromCatalog(service);
                        }}
                        className={cn(
                          'flex items-center gap-2 p-2 rounded-lg text-left text-sm transition-colors select-none cursor-pointer',
                          isAdded
                            ? 'bg-primary/10 border border-primary/30 opacity-60 pointer-events-none'
                            : 'hover:bg-muted border border-transparent active:bg-muted'
                        )}
                      >
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{service.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {isMechanic
                              ? `${service.estimatedDuration || '?'}h est.`
                              : <>
                                  {service.pricingType === 'fixed'
                                    ? `€${service.fixedPrice?.toFixed(2)}`
                                    : `€${service.hourlyRate}/h`}
                                  {' · '}{service.estimatedDuration || '?'}h
                                </>
                            }
                          </p>
                        </div>
                        {isAdded ? (
                          <Check className="h-4 w-4 text-primary shrink-0" />
                        ) : (
                          <Plus className="h-4 w-4 text-muted-foreground shrink-0" />
                        )}
                      </div>
                    );
                  })}
                  {filteredServices.length === 0 && serviceSearch.trim() && (
                    <div className="col-span-2 text-center py-4">
                      <p className="text-sm text-muted-foreground mb-2">{t('wo.noServicesFound')}</p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => addCustomServiceWithName(serviceSearch.trim())}
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        {t('wo.addAsCustom').replace('{name}', serviceSearch.trim())}
                      </Button>
                    </div>
                  )}
                  {filteredServices.length === 0 && !serviceSearch.trim() && (
                    <p className="col-span-2 text-center text-sm text-muted-foreground py-4">
                      {t('wo.noServicesFound')}
                    </p>
                  )}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => addCustomServiceWithName()}
                  className="w-full"
                >
                  <PenLine className="h-4 w-4 mr-2" />
                  {t('wo.addCustomService')}
                </Button>

                <Separator />

                {/* Selected work items */}
                <div className="space-y-3">
                  <h4 className="font-medium text-sm">
                    {t('wo.selectedServices')} ({data.workItems.length})
                  </h4>
                  {data.workItems.length === 0 ? (
                    <p className="text-center text-sm text-muted-foreground py-6">
                      {t('wo.selectServicesHint')}
                    </p>
                  ) : (
                    data.workItems.map(item => (
                      <Card key={item.id}>
                        <CardContent className="p-3">
                          <div className="flex items-start gap-2">
                            <div className="flex-1 space-y-2">
                              {item.isCustom ? (
                                <>
                                  <div className="flex gap-2">
                                    <Input
                                      placeholder={t('wo.referenceOptional')}
                                      value={item.serviceCode || ''}
                                      onChange={e => updateWorkItem(item.id, { serviceCode: e.target.value })}
                                      className="w-32"
                                    />
                                    <Input
                                      placeholder={t('wo.serviceName')}
                                      value={item.serviceName}
                                      onChange={e => updateWorkItem(item.id, { serviceName: e.target.value })}
                                      className="flex-1"
                                    />
                                  </div>
                                  <Textarea
                                    placeholder={t('wo.description')}
                                    value={item.description}
                                    onChange={e => updateWorkItem(item.id, { description: e.target.value })}
                                    className="min-h-[60px]"
                                  />
                                </>
                              ) : (
                                <div className="flex items-center gap-2">
                                  <p className="font-medium">{item.serviceName}</p>
                                  {item.serviceCode && (
                                    <Badge variant="outline" className="text-xs">{item.serviceCode}</Badge>
                                  )}
                                </div>
                              )}
                              <div className="flex items-center gap-4">
                                <div className="flex items-center gap-2">
                                  <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                                  <Input
                                    type="number"
                                    min="0.5"
                                    step="0.5"
                                    value={item.durationHours || ''}
                                    onChange={e => updateWorkItem(item.id, { durationHours: Number(e.target.value) })}
                                    onFocus={e => e.target.select()}
                                    className="w-20 h-8"
                                  />
                                  <span className="text-xs text-muted-foreground">{t('wo.hours')}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Checkbox
                                    checked={item.isImmediate}
                                    onCheckedChange={c => updateWorkItem(item.id, { isImmediate: c as boolean })}
                                  />
                                  <span className="text-xs">{t('wo.immediate')}</span>
                                </div>
                              </div>
                            </div>
                            <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => removeWorkItem(item.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* Step 2: Findings */}
            {step === 2 && (
              <div className="space-y-4">
                <h4 className="font-medium flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-primary" />
                  {t('wo.diagnosticFindings')}
                </h4>

                {/* Quick-add input - Large for mobile */}
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Input
                      ref={quickFindingRef}
                      placeholder={t('wo.typeFinding')}
                      value={quickFinding}
                      onChange={e => setQuickFinding(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addQuickFinding(); } }}
                      className="pr-10 h-[52px] text-base"
                    />
                    {quickFinding && (
                      <button
                        onClick={addQuickFinding}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        <CornerDownLeft className="h-5 w-5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Common findings quick-select */}
                <div>
                  <div className="flex items-center gap-1.5 mb-2">
                    <Zap className="h-4 w-4 text-amber-500" />
                    <span className="text-sm text-muted-foreground font-medium">{t('wo.quickAdd')}</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {COMMON_FINDINGS.map(cf => {
                      const alreadyAdded = data.findings.some(f => f.description === t(cf.key) || f.description === cf.en);
                      return (
                        <div
                          key={cf.key}
                          role="button"
                          tabIndex={alreadyAdded ? -1 : 0}
                          aria-disabled={alreadyAdded}
                          onClick={() => {
                            if (!alreadyAdded) addFinding(t(cf.key));
                          }}
                          className={cn(
                            'px-3 py-2 rounded-lg text-sm font-medium border transition-colors min-h-[48px] select-none cursor-pointer',
                            alreadyAdded
                              ? 'bg-primary/10 border-primary/30 text-primary opacity-60 pointer-events-none'
                              : 'border-border hover:bg-muted hover:border-muted-foreground/30 active:bg-muted'
                          )}
                        >
                          {alreadyAdded ? <Check className="h-4 w-4 inline mr-1.5" /> : <Plus className="h-4 w-4 inline mr-1.5" />}
                          {t(cf.key)}
                        </div>
                      );
                    })}
                  </div>
                </div>

                <Separator />

                {/* Findings list */}
                {data.findings.length === 0 ? (
                  <div className="text-center py-8">
                    <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground">
                      {t('wo.typeOrTapHint')}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {data.findings.map((finding, idx) => (
                      <Card key={finding.id} className="min-h-[48px]">
                        <CardContent className="p-4">
                          <div className="flex items-start gap-3">
                            <Badge variant="secondary" className="mt-1 shrink-0 text-sm h-6 px-2">#{idx + 1}</Badge>
                            <div className="flex-1 min-w-0 space-y-3">
                              <Textarea
                                value={finding.description}
                                onChange={e => updateFinding(finding.id, { description: e.target.value })}
                                placeholder={t('wo.describeFinding')}
                                className="min-h-[60px] text-base resize-none"
                              />
                              <div className="flex flex-col gap-3">
                                <label className="flex items-center gap-2 cursor-pointer min-h-[48px] p-2 rounded-lg hover:bg-muted/50 transition-colors">
                                  <Checkbox
                                    checked={finding.requiresReplacement}
                                    onCheckedChange={c => updateFinding(finding.id, { requiresReplacement: c as boolean })}
                                  />
                                  <Package className="h-4 w-4 text-muted-foreground" />
                                  <span className="text-sm">{t('wo.requiresReplacement')}</span>
                                </label>

                                {finding.requiresReplacement && (
                                  <RadioGroup
                                    value={finding.inStock === false ? 'order' : 'stock'}
                                    onValueChange={(v) => updateFinding(finding.id, { inStock: v === 'stock' })}
                                    className="flex gap-2"
                                  >
                                    <label className="flex items-center gap-2 cursor-pointer flex-1 p-3 rounded-lg border min-h-[48px] transition-colors hover:bg-muted/50 has-[:checked]:border-primary has-[:checked]:bg-primary/5">
                                      <RadioGroupItem value="stock" id={`${finding.id}-stock`} />
                                      <Warehouse className="h-4 w-4 text-green-600 dark:text-green-500" />
                                      <span className="text-sm font-medium">{t('wo.inStock')}</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer flex-1 p-3 rounded-lg border min-h-[48px] transition-colors hover:bg-muted/50 has-[:checked]:border-primary has-[:checked]:bg-primary/5">
                                      <RadioGroupItem value="order" id={`${finding.id}-order`} />
                                      <ShoppingCart className="h-4 w-4 text-orange-600 dark:text-orange-500" />
                                      <span className="text-sm font-medium">{t('wo.needsOrdering')}</span>
                                    </label>
                                  </RadioGroup>
                                )}
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-10 w-10 shrink-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                              onClick={() => removeFinding(finding.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Step 4: Parts */}
            {step === 4 && (
              <div className="space-y-4">
                <h4 className="font-medium flex items-center gap-2">
                  <Package className="h-5 w-5 text-primary" />
                  {t('wo.partsRequired')}
                </h4>

                {/* Mode Toggle */}
                <div className="flex gap-2 p-1 bg-muted rounded-lg">
                  <button
                    onClick={() => setPartEntryMode('manual')}
                    className={cn(
                      'flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors min-h-[48px]',
                      partEntryMode === 'manual'
                        ? 'bg-background shadow-sm'
                        : 'hover:bg-background/50'
                    )}
                  >
                    <PenLine className="h-4 w-4 inline mr-2" />
                    {t('wo.manualEntry')}
                  </button>
                  <button
                    onClick={() => setPartEntryMode('catalog')}
                    className={cn(
                      'flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors min-h-[48px]',
                      partEntryMode === 'catalog'
                        ? 'bg-background shadow-sm'
                        : 'hover:bg-background/50'
                    )}
                  >
                    <Search className="h-4 w-4 inline mr-2" />
                    {t('wo.searchCatalog')}
                  </button>
                </div>

                {/* Manual Entry Mode */}
                {partEntryMode === 'manual' && (
                  <Card>
                    <CardContent className="p-4 space-y-3">
                      <div className="space-y-2">
                        <Label htmlFor="manual-part-name" className="text-sm font-medium">{t('wo.partName')}</Label>
                        <Input
                          id="manual-part-name"
                          placeholder={t('wo.enterPartName')}
                          className="h-[48px] text-base"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              const input = e.currentTarget;
                              if (input.value.trim()) {
                                addCustomPartWithName(input.value.trim());
                                input.value = '';
                              }
                            }
                          }}
                        />
                      </div>
                      <Button
                        onClick={(e) => {
                          const input = e.currentTarget.parentElement?.querySelector('input');
                          if (input?.value.trim()) {
                            addCustomPartWithName(input.value.trim());
                            input.value = '';
                          }
                        }}
                        className="w-full h-[48px]"
                      >
                        <Plus className="h-5 w-5 mr-2" />
                        {t('wo.addPart')}
                      </Button>
                    </CardContent>
                  </Card>
                )}

                {/* Catalog Search Mode */}
                {partEntryMode === 'catalog' && (
                  <>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                      <Input
                        placeholder={t('wo.searchPartsCatalog')}
                        value={partSearch}
                        onChange={e => setPartSearch(e.target.value)}
                        className="pl-10 h-[48px] text-base"
                      />
                    </div>

                    {/* Parts catalog */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:max-h-64 sm:overflow-y-auto border rounded-lg p-2">
                      {filteredParts.map(part => {
                        const isAdded = data.parts.some(p => p.partId === part.id);
                        return (
                          <div
                            key={part.id}
                            role="button"
                            tabIndex={isAdded ? -1 : 0}
                            aria-disabled={isAdded}
                            onPointerUp={(e) => {
                              e.preventDefault();
                              if (!isAdded) addPartFromCatalog(part);
                            }}
                            className={cn(
                              'flex items-center gap-2 p-3 rounded-lg text-left text-sm transition-colors min-h-[60px] touch-manipulation select-none cursor-pointer',
                              isAdded
                                ? 'bg-primary/10 border border-primary/30 opacity-60 pointer-events-none'
                                : 'hover:bg-muted border border-transparent active:bg-muted'
                            )}
                          >
                            <div className="flex-1 min-w-0">
                              <p className="font-medium truncate">{part.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {part.partNumber}
                                {!isMechanic && <> · €{part.sellingPrice.toFixed(2)}</>}
                                {' · '}<span className={part.stockQuantity > 0 ? 'text-green-600' : 'text-red-500'}>
                                  {part.stockQuantity} {t('wo.inStock').toLowerCase()}
                                </span>
                              </p>
                            </div>
                            {isAdded ? (
                              <Check className="h-5 w-5 text-primary shrink-0" />
                            ) : (
                              <Plus className="h-5 w-5 text-muted-foreground shrink-0" />
                            )}
                          </div>
                        );
                      })}
                      {filteredParts.length === 0 && partSearch.trim() && (
                        <div className="col-span-2 text-center py-6">
                          <p className="text-sm text-muted-foreground mb-3">{t('wo.noPartsFound')}</p>
                          <Button
                            variant="outline"
                            onClick={() => {
                              addCustomPartWithName(partSearch.trim());
                              setPartSearch('');
                            }}
                            className="h-[48px]"
                          >
                            <Plus className="h-5 w-5 mr-2" />
                            {t('wo.addAsCustom').replace('{name}', partSearch.trim())}
                          </Button>
                        </div>
                      )}
                      {filteredParts.length === 0 && !partSearch.trim() && (
                        <p className="col-span-2 text-center text-sm text-muted-foreground py-8">
                          {t('wo.noPartsAvailable')}
                        </p>
                      )}
                    </div>
                  </>
                )}

                <Separator />

                {/* Selected parts */}
                <div className="space-y-3">
                  <h4 className="font-medium text-sm flex items-center gap-2">
                    <Package className="h-4 w-4" />
                    {t('wo.partsList')} ({data.parts.length})
                  </h4>
                  {data.parts.length === 0 ? (
                    <Card className="border-dashed">
                      <CardContent className="p-8 text-center">
                        <Package className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                        <p className="text-sm text-muted-foreground">
                          {partEntryMode === 'manual' ? t('wo.enterPartDetails') : t('wo.searchOrSwitch')}
                        </p>
                      </CardContent>
                    </Card>
                  ) : (
                    data.parts.map(part => (
                      <Card key={part.id}>
                        <CardContent className="p-4">
                          <div className="flex items-start gap-3">
                            <div className="flex-1 space-y-3">
                              {part.isCustom ? (
                                <div className="space-y-2">
                                  <div className="flex gap-2">
                                    <Input
                                      placeholder={t('wo.referenceOptional')}
                                      value={part.partNumber || ''}
                                      onChange={e => updatePart(part.id, { partNumber: e.target.value })}
                                      className="w-32 h-[48px]"
                                    />
                                    <Input
                                      placeholder={t('wo.partName') + '...'}
                                      value={part.partName}
                                      onChange={e => updatePart(part.id, { partName: e.target.value })}
                                      className="flex-1 h-[48px] text-base font-medium"
                                    />
                                  </div>
                                  <Textarea
                                    placeholder={t('wo.notesOptional')}
                                    value={part.description}
                                    onChange={e => updatePart(part.id, { description: e.target.value })}
                                    className="min-h-[60px] text-sm resize-none"
                                  />
                                </div>
                              ) : (
                                <div className="space-y-1">
                                  <div className="flex items-center gap-2">
                                    <p className="font-medium text-base">{part.partName}</p>
                                    {part.partNumber && (
                                      <Badge variant="outline" className="text-xs">{part.partNumber}</Badge>
                                    )}
                                  </div>
                                  {part.description && (
                                    <p className="text-sm text-muted-foreground">{part.description}</p>
                                  )}
                                </div>
                              )}
                              <div className="flex flex-wrap items-center gap-3">
                                <div className="flex items-center gap-2">
                                  <Label className="text-sm">{t('wo.quantity')}</Label>
                                  <Input
                                    type="number"
                                    min="1"
                                    value={part.quantity || ''}
                                    onChange={e => updatePart(part.id, { quantity: Number(e.target.value) })}
                                    onFocus={e => e.target.select()}
                                    className="w-20 h-10 text-base"
                                  />
                                </div>
                                {!isMechanic && (
                                  <>
                                    <div className="flex items-center gap-2">
                                      <Label className="text-sm">{t('wo.pricePerUnit')}</Label>
                                      <Input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={part.unitPrice || ''}
                                        onChange={e => updatePart(part.id, { unitPrice: Number(e.target.value) })}
                                        onFocus={e => e.target.select()}
                                        className="w-24 h-10 text-base"
                                      />
                                    </div>
                                    <p className="text-base font-medium ml-auto">
                                      €{(part.quantity * part.unitPrice).toFixed(2)}
                                    </p>
                                  </>
                                )}
                                {isMechanic && (() => {
                                  const stock = getPartStock(part.partId);
                                  return stock ? (
                                    <Badge variant={stock.stockQuantity > 0 ? 'secondary' : 'destructive'}>
                                      {stock.stockQuantity > 0 ? `${stock.stockQuantity} ${t('wo.inStock').toLowerCase()}` : t('wo.outOfStock')}
                                    </Badge>
                                  ) : null;
                                })()}
                              </div>

                              {/* Stock Status Radio Buttons */}
                              <RadioGroup
                                value={part.needsOrdering ? 'order' : 'stock'}
                                onValueChange={(v) => updatePart(part.id, { needsOrdering: v === 'order' })}
                                className="flex gap-2"
                              >
                                <label className="flex items-center gap-2 cursor-pointer flex-1 p-3 rounded-lg border min-h-[48px] transition-colors hover:bg-muted/50 has-[:checked]:border-primary has-[:checked]:bg-primary/5">
                                  <RadioGroupItem value="stock" id={`${part.id}-stock`} />
                                  <Warehouse className="h-4 w-4 text-green-600 dark:text-green-500" />
                                  <span className="text-sm font-medium">{t('wo.inStock')}</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer flex-1 p-3 rounded-lg border min-h-[48px] transition-colors hover:bg-muted/50 has-[:checked]:border-primary has-[:checked]:bg-primary/5">
                                  <RadioGroupItem value="order" id={`${part.id}-order`} />
                                  <ShoppingCart className="h-4 w-4 text-orange-600 dark:text-orange-500" />
                                  <span className="text-sm font-medium">{t('wo.needsOrdering')}</span>
                                </label>
                              </RadioGroup>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-10 w-10 shrink-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                              onClick={() => removePart(part.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* Step 5: Summary */}
            {step === 5 && (
              <div className="space-y-4">
                {/* Services summary */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Wrench className="h-5 w-5 text-primary" />
                      {t('wo.services')} ({data.workItems.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {data.workItems.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">{t('wo.noServicesAdded')}</p>
                    ) : (
                      data.workItems.map(item => (
                        <div key={item.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors">
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
                            <span className="text-sm truncate">{item.serviceName || t('wo.customService')}</span>
                            {item.isCustom && <Badge variant="outline" className="text-xs shrink-0">Custom</Badge>}
                            {item.isImmediate && <Badge variant="destructive" className="text-xs shrink-0">Immediate</Badge>}
                          </div>
                          <span className="text-sm font-medium text-muted-foreground shrink-0">{item.durationHours}h</span>
                        </div>
                      ))
                    )}
                  </CardContent>
                </Card>

                {/* Findings summary */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <AlertCircle className="h-5 w-5 text-primary" />
                      {t('wo.findings')} ({data.findings.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {data.findings.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">{t('wo.noFindings')}</p>
                    ) : (
                      data.findings.map((f, idx) => (
                        <div key={f.id} className="flex items-start gap-2 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                          <Badge variant="secondary" className="shrink-0 mt-0.5">#{idx + 1}</Badge>
                          <span className="text-sm flex-1">{f.description || '—'}</span>
                          <div className="flex items-center gap-1 shrink-0">
                            {f.requiresReplacement && (
                              <>
                                <Badge variant="outline" className="text-xs">
                                  <Package className="h-3 w-3 mr-1" />
                                  Part
                                </Badge>
                                {f.inStock === false ? (
                                  <Badge variant="outline" className="text-xs text-orange-600">
                                    <ShoppingCart className="h-3 w-3 mr-1" />
                                    Order
                                  </Badge>
                                ) : (
                                  <Badge variant="outline" className="text-xs text-green-600">
                                    <Warehouse className="h-3 w-3 mr-1" />
                                    Stock
                                  </Badge>
                                )}
                              </>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </CardContent>
                </Card>

                {/* Parts summary */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Package className="h-5 w-5 text-primary" />
                      {t('wo.partsLabel')} ({data.parts.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {data.parts.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">{t('wo.noPartsAdded')}</p>
                    ) : (
                      data.parts.map(p => {
                        const stock = getPartStock(p.partId);
                        return (
                          <div key={p.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors gap-2">
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              <Package className="h-4 w-4 text-muted-foreground shrink-0" />
                              <span className="text-sm truncate">{p.partName || t('wo.customPart')}</span>
                              <span className="text-sm text-muted-foreground shrink-0">×{p.quantity}</span>
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                              {p.needsOrdering ? (
                                <Badge variant="outline" className="text-xs text-orange-600">
                                  <ShoppingCart className="h-3 w-3 mr-1" />
                                  Order
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="text-xs text-green-600">
                                  <Warehouse className="h-3 w-3 mr-1" />
                                  Stock
                                </Badge>
                              )}
                              {isMechanic && stock && stock.stockQuantity <= 0 && !p.needsOrdering && (
                                <Badge variant="destructive" className="text-xs">
                                  Low
                                </Badge>
                              )}
                              {!isMechanic && (
                                <span className="text-sm font-medium ml-2">
                                  €{(p.quantity * p.unitPrice).toFixed(2)}
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </CardContent>
                </Card>

                <Separator />

                {/* Labor / Totals */}
                {isMechanic ? (
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">{t('wo.totalLaborTime')}</span>
                      <span className="font-bold">{totalLaborHours}h</span>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2 p-3 bg-muted/50 rounded-lg">
                    <div className="flex justify-between text-sm">
                      <span>{t('wo.labor')}</span>
                      <span>€{totals.laborSubtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>{t('wo.partsLabel')}</span>
                      <span>€{totals.partsSubtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <span>{t('wo.discount')}</span>
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        value={data.discountPercent || ''}
                        onChange={e => setData(prev => ({ ...prev, discountPercent: Number(e.target.value) }))}
                        onFocus={e => e.target.select()}
                        className="w-20 h-7 text-xs"
                      />
                      <span className="text-xs text-muted-foreground">%</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between font-bold">
                      <span>{t('wo.total')}</span>
                      <span>€{totals.grandTotal.toFixed(2)}</span>
                    </div>
                  </div>
                )}

                {/* Return time */}
                <div>
                  <Label className="text-xs text-muted-foreground mb-2 block">{t('wo.estimatedReturnTime')}</Label>
                  {isMechanic ? (
                    <div className="space-y-3">
                      <div className="grid grid-cols-4 gap-2">
                        {[
                          { label: '1h', hours: 1 },
                          { label: '2h', hours: 2 },
                          { label: '3h', hours: 3 },
                          { label: '4h', hours: 4 },
                        ].map(opt => (
                          <Button
                            key={opt.label}
                            variant="outline"
                            className="h-12 text-base font-bold"
                            onClick={() => setReturnTimeFromNow(opt.hours)}
                          >
                            {opt.label}
                          </Button>
                        ))}
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <Button variant="outline" className="h-12 text-sm font-bold" onClick={() => setReturnTimeFromNow(6)}>
                          {t('wo.halfDay')}
                        </Button>
                        <Button variant="outline" className="h-12 text-sm font-bold" onClick={() => setReturnTimeFromNow(8)}>
                          {t('wo.endOfDay')}
                        </Button>
                        <Button variant="outline" className="h-12 text-sm font-bold" onClick={setReturnTimeTomorrow}>
                          {t('wo.tomorrow')}
                        </Button>
                      </div>
                      {data.returnTime && (
                        <p className="text-sm text-center text-muted-foreground">
                          {t('wo.setTo')}: <span className="font-medium text-foreground">{new Date(data.returnTime).toLocaleString('en-GB')}</span>
                        </p>
                      )}
                    </div>
                  ) : (
                    <Input
                      type="datetime-local"
                      value={data.returnTime || ''}
                      onChange={e => setData(prev => ({ ...prev, returnTime: e.target.value }))}
                    />
                  )}
                </div>
              </div>
            )}

            {/* Step 6: Quote/Invoice (M/O only) */}
            {step === 6 && !isMechanic && (
              <div className="space-y-6">
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 text-primary mx-auto mb-4" />
                  <h3 className="text-lg font-bold mb-2">{t('wo.workOrderComplete')}</h3>
                  <p className="text-sm text-muted-foreground max-w-md mx-auto">
                    {t('wo.saveAndQuoteHint')}
                  </p>
                </div>

                {/* Quick totals recap */}
                <div className="space-y-2 p-4 bg-muted/50 rounded-lg max-w-sm mx-auto">
                  <div className="flex justify-between text-sm">
                    <span>{data.workItems.length} {t('wo.services')}</span>
                    <span>€{totals.laborSubtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>{data.parts.length} {t('wo.partsLabel')}</span>
                    <span>€{totals.partsSubtotal.toFixed(2)}</span>
                  </div>
                  {data.discountPercent > 0 && (
                    <div className="flex justify-between text-sm text-green-600">
                      <span>{t('wo.discount')} ({data.discountPercent}%)</span>
                      <span>-€{((totals.laborSubtotal + totals.partsSubtotal) * data.discountPercent / 100).toFixed(2)}</span>
                    </div>
                  )}
                  <Separator />
                  <div className="flex justify-between font-bold text-lg">
                    <span>{t('wo.total')}</span>
                    <span>€{totals.grandTotal.toFixed(2)}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 max-w-sm mx-auto">
                  <Button
                    variant="outline"
                    className="h-14"
                    onClick={() => {
                      setShowConfirmation(true);
                    }}
                  >
                    <Check className="h-5 w-5 mr-2" />
                    {t('wo.saveOnly')}
                  </Button>
                  <Button
                    className="h-14"
                    onClick={() => {
                      const finalData: WorkOrderData = { ...data, ...totals, completedAt: new Date().toISOString() };
                      onProcessQuote?.(finalData);
                    }}
                  >
                    <FileText className="h-5 w-5 mr-2" />
                    {t('wo.processQuote')}
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-6 py-4 border-t bg-background">
            <Button variant="outline" onClick={step === 1 ? onClose : back}>
              {step === 1 ? t('wo.cancel') : (
                <><ChevronLeft className="h-4 w-4 mr-1" /> {t('wo.back')}</>
              )}
            </Button>
            <Badge variant="secondary">{t('wo.step')} {step} {t('wo.of')} {maxStep}</Badge>
            {/* Hide Next on step 6 since it has its own action buttons */}
            {!(step === 6 && !isMechanic) && (
              <Button onClick={next}>
                {step === maxStep ? (
                  <>{t('wo.saveWorkOrder')} <Check className="h-4 w-4 ml-1" /></>
                ) : (
                  <>{t('wo.next')} <ChevronRight className="h-4 w-4 ml-1" /></>
                )}
              </Button>
            )}
            {step === 6 && !isMechanic && <div />}
          </div>
        </DialogContent>
      </Dialog>

      {/* Confirmation dialog before saving */}
      <AlertDialog open={showConfirmation} onOpenChange={setShowConfirmation}>
        <AlertDialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <AlertDialogHeader>
            <AlertDialogTitle>{t('wo.confirmWorkOrder')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('wo.reviewBeforeSaving')}
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="space-y-3 my-4">
            {/* Services list */}
            <h4 className="font-medium text-sm">{t('wo.services')} ({data.workItems.length})</h4>
            {data.workItems.map(item => (
              <div key={item.id} className="flex items-center justify-between text-sm border-b pb-2">
                <span>{item.serviceName || t('wo.custom')} ({item.durationHours}h)</span>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeWorkItem(item.id)}>
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            ))}

            <Separator />

            {/* Parts list with +/- buttons */}
            <h4 className="font-medium text-sm">{t('wo.partsLabel')} ({data.parts.length})</h4>
            {data.parts.map(p => (
              <div key={p.id} className="flex items-center justify-between text-sm border-b pb-2 gap-2">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <span className="truncate">{p.partName || t('wo.custom')}</span>
                  {p.needsOrdering && <Badge variant="outline" className="text-[10px] shrink-0 text-orange-600">Order</Badge>}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 rounded-full"
                    onClick={() => updatePart(p.id, { quantity: Math.max(1, p.quantity - 1) })}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className="w-8 text-center font-bold text-base">{p.quantity}</span>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 rounded-full"
                    onClick={() => updatePart(p.id, { quantity: p.quantity + 1 })}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7 ml-1" onClick={() => removePart(p.id)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))}

            {data.workItems.length === 0 && data.parts.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                {t('wo.noServicesOrParts')}
              </p>
            )}
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowConfirmation(false)}>
              {t('wo.goBackEdit')}
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleSave} disabled={loading}>
              {loading ? t('wo.saving') : t('wo.confirmSave')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
