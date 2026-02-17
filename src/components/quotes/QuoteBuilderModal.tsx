import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Job, Part, Service, QuoteLineItem, CompanySettings } from '@/lib/types';
import { getActiveParts, addPart } from '@/services/partsService';
import { getActiveServices, addService } from '@/services/servicesService';
import { getCompanySettings } from '@/services/companySettingsService';
import { createQuoteFromJob, calculateLineItem, calculateQuoteTotals } from '@/services/quoteService';
import { createInvoiceFromJob } from '@/services/invoiceService';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Package,
  Wrench,
  Plus,
  Trash2,
  FileText,
  Euro,
  Calculator,
  AlertCircle,
  Search,
  Receipt,
} from 'lucide-react';
import { toast } from 'sonner';

interface QuoteBuilderModalProps {
  job: Job;
  isOpen: boolean;
  onClose: () => void;
  onQuoteCreated: (id: string) => void;
  mode?: 'quote' | 'invoice';
  existingLineItems?: QuoteLineItem[];
  existingNotes?: string;
  existingCustomerNotes?: string;
}

export function QuoteBuilderModal({
  job,
  isOpen,
  onClose,
  onQuoteCreated,
  mode = 'quote',
  existingLineItems,
  existingNotes,
  existingCustomerNotes,
}: QuoteBuilderModalProps) {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [parts, setParts] = useState<Part[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [settings, setSettings] = useState<CompanySettings | null>(null);
  const [lineItems, setLineItems] = useState<QuoteLineItem[]>([]);
  const [notes, setNotes] = useState('');
  const [customerNotes, setCustomerNotes] = useState('');
  const [catalogSearch, setCatalogSearch] = useState('');

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [partsData, servicesData, settingsData] = await Promise.all([
        getActiveParts(),
        getActiveServices(),
        getCompanySettings(),
      ]);
      setParts(partsData);
      setServices(servicesData);
      setSettings(settingsData);

      if (!settingsData) {
        toast.error(t('quote.configureSettings'));
        return;
      }

      // If editing an existing document, use its line items directly
      if (existingLineItems && existingLineItems.length > 0) {
        setLineItems(existingLineItems);
        setNotes(existingNotes || '');
        setCustomerNotes(existingCustomerNotes || '');
        return;
      }

      // Pre-populate line items from work order data
      const defaultTaxRate = settingsData.defaultTaxRate || 20;
      const prePopulatedItems: QuoteLineItem[] = [];

      if (job.workOrderData) {
        const wo = job.workOrderData;

        // Build lookup maps for catalog prices
        const catalogServices = new Map(servicesData.map(s => [s.id, s]));
        const catalogParts = new Map(partsData.map(p => [p.id, p]));

        // Import work items (services) from work order
        for (const workItem of wo.workItems) {
          let unitPrice = workItem.fixedPrice != null
            ? workItem.fixedPrice
            : (workItem.pricePerHour || 0);
          let quantity = 1;

          // Resolve price from catalog if work order has no price
          if (!unitPrice && workItem.serviceId) {
            const catalogService = catalogServices.get(workItem.serviceId);
            if (catalogService) {
              if (catalogService.pricingType === 'hourly') {
                unitPrice = catalogService.hourlyRate || 0;
                quantity = workItem.durationHours > 0 ? workItem.durationHours : (catalogService.estimatedDuration || 1);
              } else {
                unitPrice = catalogService.fixedPrice || 0;
                quantity = 1;
              }
            }
          } else if (workItem.pricePerHour && workItem.durationHours > 0) {
            quantity = workItem.durationHours;
          }

          prePopulatedItems.push(calculateLineItem({
            id: crypto.randomUUID(),
            type: workItem.isCustom ? 'custom' : 'service',
            referenceId: workItem.serviceId,
            code: workItem.serviceCode || undefined,
            description: workItem.serviceName + (workItem.serviceCode ? ` (${workItem.serviceCode})` : ''),
            quantity,
            unitPrice,
            taxRate: defaultTaxRate,
            discount: 0,
          }));
        }

        // Import parts from work order
        for (const part of wo.parts) {
          let unitPrice = part.unitPrice || 0;

          // Resolve price from catalog if work order has no price
          if (!unitPrice && part.partId) {
            const catalogPart = catalogParts.get(part.partId);
            if (catalogPart) {
              unitPrice = catalogPart.sellingPrice || 0;
            }
          }

          prePopulatedItems.push(calculateLineItem({
            id: crypto.randomUUID(),
            type: part.isCustom ? 'custom' : 'part',
            referenceId: part.partId,
            code: part.partNumber || undefined,
            description: part.partName + (part.partNumber ? ` (${part.partNumber})` : ''),
            quantity: part.quantity,
            unitPrice,
            taxRate: defaultTaxRate,
            discount: 0,
          }));
        }

        // Apply global discount from work order if set
        if (wo.discountPercent > 0) {
          prePopulatedItems.forEach(item => {
            const updated = calculateLineItem({ ...item, discount: wo.discountPercent });
            Object.assign(item, updated);
          });
        }
      }

      setLineItems(prePopulatedItems);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error(t('quote.failedToLoad'));
    } finally {
      setLoading(false);
    }
  };

  const addPartToQuote = (part: Part) => {
    const existingIndex = lineItems.findIndex(
      item => item.type === 'part' && item.referenceId === part.id
    );

    if (existingIndex >= 0) {
      const updatedItems = [...lineItems];
      updatedItems[existingIndex] = calculateLineItem({
        ...updatedItems[existingIndex],
        quantity: updatedItems[existingIndex].quantity + 1,
      });
      setLineItems(updatedItems);
    } else {
      const newItem = calculateLineItem({
        id: crypto.randomUUID(),
        type: 'part',
        referenceId: part.id,
        code: part.partNumber || undefined,
        description: part.name,
        quantity: 1,
        unitPrice: part.sellingPrice,
        taxRate: part.taxRate || settings?.defaultTaxRate || 20,
        discount: 0,
      });
      setLineItems([newItem, ...lineItems]);
    }
  };

  const addServiceToQuote = (service: Service) => {
    const existingIndex = lineItems.findIndex(
      item => item.type === 'service' && item.referenceId === service.id
    );

    if (existingIndex >= 0) {
      toast.info(t('quote.serviceAlreadyAdded'));
      return;
    }

    const price = service.pricingType === 'hourly'
      ? (service.hourlyRate || 0) * (service.estimatedDuration || 1)
      : service.fixedPrice || 0;

    const newItem = calculateLineItem({
      id: crypto.randomUUID(),
      type: 'service',
      referenceId: service.id,
      code: service.serviceCode || undefined,
      description: service.name,
      quantity: service.pricingType === 'hourly' ? (service.estimatedDuration || 1) : 1,
      unitPrice: service.pricingType === 'hourly' ? (service.hourlyRate || 0) : price,
      taxRate: service.taxRate || settings?.defaultTaxRate || 20,
      discount: 0,
    });
    setLineItems([newItem, ...lineItems]);
  };

  const addCustomItem = () => {
    const newItem = calculateLineItem({
      id: crypto.randomUUID(),
      type: 'custom',
      description: '',
      quantity: 1,
      unitPrice: 0,
      taxRate: settings?.defaultTaxRate || 20,
      discount: 0,
    });
    setLineItems([newItem, ...lineItems]);
  };

  const updateLineItem = (id: string, field: string, value: any) => {
    const updatedItems = lineItems.map(item => {
      if (item.id === id) {
        const updated = { ...item, [field]: value };
        return calculateLineItem(updated);
      }
      return item;
    });
    setLineItems(updatedItems);
  };

  const removeLineItem = (id: string) => {
    setLineItems(lineItems.filter(item => item.id !== id));
  };

  const totals = calculateQuoteTotals(lineItems);

  // Filter catalog items by search
  const filteredParts = catalogSearch
    ? parts.filter(p => p.name.toLowerCase().includes(catalogSearch.toLowerCase()) || p.partNumber?.toLowerCase().includes(catalogSearch.toLowerCase()))
    : parts;
  const filteredServices = catalogSearch
    ? services.filter(s => s.name.toLowerCase().includes(catalogSearch.toLowerCase()))
    : services;

  const handleCreate = async () => {
    if (!user) return;

    if (lineItems.length === 0) {
      toast.error(`${t('quote.addAtLeastOne')} ${mode === 'invoice' ? t('quote.createInvoice').toLowerCase() : t('quote.createQuote').toLowerCase()}`);
      return;
    }

    const invalidItems = lineItems.filter(item => !item.description.trim());
    if (invalidItems.length > 0) {
      toast.error(t('quote.allItemsNeedDescription'));
      return;
    }

    try {
      setSaving(true);

      // Auto-save manual items to the correct catalog based on type
      const manualItems = lineItems.filter(item => !item.referenceId && item.description.trim());
      await Promise.all(manualItems.map(item => {
        const defaultTax = settings?.defaultTaxRate || 20;
        if (item.type === 'part') {
          return addPart({
            partNumber: item.code || '',
            name: item.description.trim(),
            description: '',
            category: 'custom',
            stockQuantity: 0,
            minStockLevel: 1,
            maxStockLevel: 10,
            unit: 'piece',
            costPrice: 0,
            sellingPrice: item.unitPrice || 0,
            markup: 0,
            taxRate: item.taxRate || defaultTax,
            isActive: true,
          }, user.id).catch(() => {});
        } else {
          return addService({
            serviceCode: item.code || '',
            name: item.description.trim(),
            description: '',
            category: 'custom',
            pricingType: 'fixed',
            fixedPrice: item.unitPrice || 0,
            estimatedDuration: item.quantity || 1,
            taxRate: item.taxRate || defaultTax,
            skillLevel: 'junior',
            includesParts: false,
            isActive: true,
          }, user.id).catch(() => {});
        }
      }));

      if (mode === 'invoice') {
        const invoiceId = await createInvoiceFromJob(job.id, lineItems, user.id, {
          notes: notes || undefined,
        });
        toast.success(`${t('quote.createInvoice')} ${t('quote.created')}`);
        onQuoteCreated(invoiceId);
      } else {
        const quoteId = await createQuoteFromJob(job.id, lineItems, user.id, {
          notes,
          customerNotes,
        });
        toast.success(`${t('quote.createQuote')} ${t('quote.created')}`);
        onQuoteCreated(quoteId);
      }

      onClose();
    } catch (error: any) {
      console.error(`Error creating ${mode}:`, error);
      toast.error(error.message || `${t('quote.failedToCreate')} ${mode === 'invoice' ? t('quote.createInvoice').toLowerCase() : t('quote.createQuote').toLowerCase()}`);
    } finally {
      setSaving(false);
    }
  };

  const isInvoice = mode === 'invoice';

  if (loading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-5xl" aria-describedby={undefined}>
          <DialogTitle className="sr-only">{t('quote.loading')}</DialogTitle>
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!settings) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('quote.settingsRequired')}</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <AlertCircle className="h-12 w-12 text-amber-500 mb-4" />
            <p className="text-muted-foreground mb-4">
              {t('quote.configureSettings')}
            </p>
            <Button onClick={() => window.location.href = '/company-settings'}>
              {t('quote.goToSettings')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[95vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isInvoice ? <Receipt className="h-5 w-5" /> : <FileText className="h-5 w-5" />}
            {isInvoice ? t('quote.createInvoice') : t('quote.createQuote')} {t('quote.forJob')} #{job.jobNumber}
          </DialogTitle>
          <DialogDescription>
            {job.customerName} • {job.problemDescription.substring(0, 50)}...
            {job.workOrderData && (
              <span className="ml-2 text-primary font-medium">
                ({t('quote.preFilledFromWorkOrder')})
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex gap-4">
          {/* Left Panel - Catalog for adding more items */}
          <div className="w-1/3 border-r pr-4 flex flex-col">
            <p className="text-xs text-muted-foreground mb-2">{t('quote.addMoreItems')}</p>

            {/* Search */}
            <div className="relative mb-2">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder={t('quote.searchCatalog')}
                value={catalogSearch}
                onChange={e => setCatalogSearch(e.target.value)}
                className="pl-8 h-8 text-sm"
              />
            </div>

            <Tabs defaultValue="parts" className="flex-1 flex flex-col overflow-hidden">
              <TabsList className="grid grid-cols-2 mb-2">
                <TabsTrigger value="parts" className="text-xs">
                  <Package className="h-3 w-3 mr-1" />
                  {t('quote.parts')}
                </TabsTrigger>
                <TabsTrigger value="services" className="text-xs">
                  <Wrench className="h-3 w-3 mr-1" />
                  {t('quote.services')}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="parts" className="flex-1 overflow-hidden">
                <ScrollArea className="h-[450px]">
                  <div className="space-y-1 pr-2">
                    {filteredParts.map(part => (
                      <button
                        key={part.id}
                        onClick={() => addPartToQuote(part)}
                        className="w-full text-left p-2 rounded hover:bg-muted transition-colors border border-transparent hover:border-primary/20"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium text-sm">{part.name}</p>
                            <p className="text-xs text-muted-foreground">{part.partNumber}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-sm">€{part.sellingPrice.toFixed(2)}</p>
                            <p className="text-xs text-muted-foreground">{t('quote.stock')} {part.stockQuantity}</p>
                          </div>
                        </div>
                      </button>
                    ))}
                    {filteredParts.length === 0 && (
                      <p className="text-center text-muted-foreground py-4 text-sm">
                        {catalogSearch ? t('quote.noPartsMatch') : t('quote.noPartsAvailable')}
                      </p>
                    )}
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="services" className="flex-1 overflow-hidden">
                <ScrollArea className="h-[450px]">
                  <div className="space-y-1 pr-2">
                    {filteredServices.map(service => (
                      <button
                        key={service.id}
                        onClick={() => addServiceToQuote(service)}
                        className="w-full text-left p-2 rounded hover:bg-muted transition-colors border border-transparent hover:border-primary/20"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium text-sm">{service.name}</p>
                            <div className="flex items-center gap-1 mt-0.5">
                              <Badge variant="outline" className="text-xs">
                                {service.pricingType === 'hourly' ? t('quote.hourly') : t('quote.fixed')}
                              </Badge>
                              {service.estimatedDuration && (
                                <span className="text-xs text-muted-foreground">
                                  ~{service.estimatedDuration}h
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-sm">
                              €{service.pricingType === 'hourly'
                                ? `${service.hourlyRate?.toFixed(2)}/h`
                                : service.fixedPrice?.toFixed(2)}
                            </p>
                          </div>
                        </div>
                      </button>
                    ))}
                    {filteredServices.length === 0 && (
                      <p className="text-center text-muted-foreground py-4 text-sm">
                        {catalogSearch ? t('quote.noServicesMatch') : t('quote.noServicesAvailable')}
                      </p>
                    )}
                  </div>
                </ScrollArea>
              </TabsContent>
            </Tabs>

            <Button
              variant="outline"
              className="w-full mt-2"
              onClick={addCustomItem}
            >
              <Plus className="h-4 w-4 mr-2" />
              {t('quote.addCustomItem')}
            </Button>
          </div>

          {/* Right Panel - Quote Items */}
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold">{t('quote.quoteItems')}</h3>
              <Badge variant="secondary">
                {lineItems.length} {lineItems.length !== 1 ? t('quote.items') : t('quote.item')}
              </Badge>
            </div>

            <ScrollArea className="flex-1">
              <div className="space-y-2 pr-2">
                {lineItems.map((item) => (
                  <div
                    key={item.id}
                    className="p-3 border rounded-lg bg-card space-y-2"
                  >
                    <div className="flex items-start gap-2">
                      <div className="w-28 shrink-0">
                        <Input
                          value={item.code || ''}
                          onChange={e => updateLineItem(item.id, 'code', e.target.value)}
                          placeholder={t('wo.referenceOptional')}
                          className="font-medium"
                        />
                      </div>
                      <div className="flex-1">
                        <Input
                          value={item.description}
                          onChange={e => updateLineItem(item.id, 'description', e.target.value)}
                          placeholder={t('quote.itemDescription')}
                          className="font-medium"
                        />
                      </div>
                      {item.type === 'custom' || item.type === 'part' || item.type === 'service' ? (
                        item.referenceId ? (
                          <Badge variant="outline" className="text-xs flex-shrink-0 mt-2">
                            {item.type === 'part' ? t('quote.part') : t('quote.service')}
                          </Badge>
                        ) : (
                          <Select
                            value={item.type}
                            onValueChange={val => updateLineItem(item.id, 'type', val)}
                          >
                            <SelectTrigger className="w-24 h-8 text-xs flex-shrink-0 mt-1">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="service">{t('quote.service')}</SelectItem>
                              <SelectItem value="part">{t('quote.part')}</SelectItem>
                            </SelectContent>
                          </Select>
                        )
                      ) : null}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeLineItem(item.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>

                    <div className="flex items-end gap-2">
                      <div className="grid grid-cols-5 gap-2 flex-1">
                        <div>
                          <Label className="text-xs">{t('quote.qty')}</Label>
                          <Input
                            type="number"
                            min="0.1"
                            step="0.1"
                            value={item.quantity || ''}
                            onChange={e => updateLineItem(item.id, 'quantity', Number(e.target.value))}
                            onFocus={e => e.target.select()}
                            className="h-8"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">{t('quote.unitPrice')}</Label>
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.unitPrice || ''}
                            onChange={e => updateLineItem(item.id, 'unitPrice', Number(e.target.value))}
                            onFocus={e => e.target.select()}
                            className="h-8"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">{t('quote.discount')}</Label>
                          <Input
                            type="number"
                            min="0"
                            max="100"
                            value={item.discount || ''}
                            onChange={e => updateLineItem(item.id, 'discount', Number(e.target.value))}
                            onFocus={e => e.target.select()}
                            className="h-8"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">{t('quote.tax')}</Label>
                          <Input
                            type="number"
                            min="0"
                            max="100"
                            value={item.taxRate || ''}
                            onChange={e => updateLineItem(item.id, 'taxRate', Number(e.target.value))}
                            onFocus={e => e.target.select()}
                            className="h-8"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">{t('quote.total')}</Label>
                          <div className="h-8 flex items-center font-semibold">
                            €{item.total.toFixed(2)}
                          </div>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => updateLineItem(item.id, 'discount', item.discount === 100 ? 0 : 100)}
                        className={`h-9 px-4 rounded-lg text-xs font-bold transition-all flex-shrink-0 ${
                          item.discount === 100
                            ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-md hover:shadow-lg hover:from-green-600 hover:to-emerald-600'
                            : 'bg-gradient-to-r from-green-50 to-emerald-50 text-green-700 border border-green-200 hover:border-green-300 hover:shadow-sm'
                        }`}
                      >
                        GRATUIT
                      </button>
                    </div>
                  </div>
                ))}

                {lineItems.length === 0 && (
                  <div className="text-center py-12 text-muted-foreground">
                    <Calculator className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>{t('quote.noItemsYet')}</p>
                    <p className="text-sm">{t('quote.selectFromPanel')}</p>
                  </div>
                )}
              </div>
            </ScrollArea>

            {/* Totals */}
            {lineItems.length > 0 && (
              <div className="mt-4 pt-4 border-t space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{t('quote.subtotal')}</span>
                  <span>€{totals.subtotal.toFixed(2)}</span>
                </div>
                {totals.discountTotal > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>{t('quote.discountTotal')}</span>
                    <span>-€{totals.discountTotal.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{t('quote.taxTotal')}</span>
                  <span>€{totals.taxTotal.toFixed(2)}</span>
                </div>
                <Separator className="my-2" />
                <div className="flex justify-between text-lg font-bold">
                  <span>{t('quote.grandTotal')}</span>
                  <span className="flex items-center gap-1">
                    <Euro className="h-4 w-4" />
                    {totals.grandTotal.toFixed(2)}
                  </span>
                </div>
              </div>
            )}

            {/* Notes */}
            <div className="mt-4">
              <Label htmlFor="customerNotes" className="text-xs">{t('quote.customerNotes')}</Label>
              <Textarea
                id="customerNotes"
                value={customerNotes}
                onChange={e => setCustomerNotes(e.target.value)}
                placeholder={t('quote.customerNotesPlaceholder')}
                className="h-16 text-sm"
              />
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            {t('quote.cancel')}
          </Button>
          <Button
            onClick={handleCreate}
            disabled={saving || lineItems.length === 0}
            className={isInvoice ? 'bg-green-600 hover:bg-green-700' : undefined}
          >
            {saving ? t('quote.creating') : isInvoice ? t('quote.createInvoice') : t('quote.createQuote')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
