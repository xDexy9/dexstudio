import React, { useState, useEffect, useMemo } from 'react';
import { User, Phone, Mail, MapPin, Search, UserCheck, Loader2, History, CheckCircle, AlertTriangle } from 'lucide-react';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { getUniqueCustomersFromJobs, getCustomers, getJobsByVehicle } from '@/services/firestoreService';
import { JobFormData, JobFormErrors } from '../CreateJobWizard';
import { Vehicle, Customer, Job } from '@/lib/types';
import { LicensePlate } from '@/components/ui/license-plate';

interface CustomerStepProps {
  formData: JobFormData;
  errors: JobFormErrors;
  onUpdate: (updates: Partial<JobFormData>) => void;
  selectedVehicle?: Vehicle | null;
}

export function CustomerStep({ formData, errors, onUpdate, selectedVehicle }: CustomerStepProps) {
  const { t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [existingCustomers, setExistingCustomers] = useState<ReturnType<typeof getUniqueCustomersFromJobs>>([]);
  const [allCustomers, setAllCustomers] = useState<Customer[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [linkedCustomer, setLinkedCustomer] = useState<Customer | null>(null);
  const [vehicleHistoryCustomer, setVehicleHistoryCustomer] = useState<{
    name: string;
    phone: string;
    email?: string;
    jobCount: number;
    lastJobDate: string;
  } | null>(null);
  const [customerAutoFilled, setCustomerAutoFilled] = useState(false);

  useEffect(() => {
    const loadCustomers = async () => {
      setIsSearching(true);
      try {
        const [jobCustomers, customers] = await Promise.all([
          getUniqueCustomersFromJobs(),
          getCustomers(),
        ]);
        setExistingCustomers(Array.isArray(jobCustomers) ? jobCustomers : []);
        setAllCustomers(Array.isArray(customers) ? customers : []);
      } catch (error) {
        console.error('Error loading customers:', error);
        setExistingCustomers([]);
        setAllCustomers([]);
      } finally {
        setIsSearching(false);
      }
    };

    loadCustomers();
  }, []);

  // Load customer from vehicle history or linked customer
  useEffect(() => {
    const loadVehicleCustomer = async () => {
      if (!selectedVehicle || customerAutoFilled) return;

      // First check if vehicle has a linked customer
      if (selectedVehicle.customerId && allCustomers.length > 0) {
        const customer = allCustomers.find(c => c.id === selectedVehicle.customerId);
        if (customer) {
          setLinkedCustomer(customer);
          if (!formData.customerName) {
            onUpdate({
              customerName: customer.name,
              customerPhone: customer.phone,
              customerEmail: customer.email || '',
              isReturningCustomer: true,
            });
            setCustomerAutoFilled(true);
          }
          return;
        }
      }

      // Otherwise, check job history for this vehicle
      try {
        const vehicleJobs = await getJobsByVehicle(selectedVehicle.id);
        if (vehicleJobs.length > 0) {
          // Get the most recent job's customer
          const sortedJobs = vehicleJobs.sort(
            (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
          const latestJob = sortedJobs[0];

          setVehicleHistoryCustomer({
            name: latestJob.customerName,
            phone: latestJob.customerPhone,
            email: latestJob.customerEmail,
            jobCount: vehicleJobs.length,
            lastJobDate: latestJob.createdAt,
          });

          // Auto-fill if customer name is empty
          if (!formData.customerName) {
            onUpdate({
              customerName: latestJob.customerName,
              customerPhone: latestJob.customerPhone,
              customerEmail: latestJob.customerEmail || '',
              isReturningCustomer: true,
            });
            setCustomerAutoFilled(true);
          }
        }
      } catch (error) {
        console.error('Error loading vehicle history:', error);
      }
    };

    loadVehicleCustomer();
  }, [selectedVehicle, allCustomers]);

  // Reset auto-fill state when vehicle changes
  useEffect(() => {
    setCustomerAutoFilled(false);
    setLinkedCustomer(null);
    setVehicleHistoryCustomer(null);
  }, [selectedVehicle?.id]);

  // Enhanced search - prioritize persistent customers collection
  const filteredCustomers = useMemo(() => {
    if (searchQuery.length < 1) return [];
    if (!Array.isArray(allCustomers)) return [];

    const query = searchQuery.toLowerCase().trim();

    return allCustomers
      .filter(c => {
        const nameMatch = c.name.toLowerCase().includes(query);
        const phoneMatch = c.phone.replace(/\D/g, '').includes(query.replace(/\D/g, ''));
        const emailMatch = c.email?.toLowerCase().includes(query);
        return nameMatch || phoneMatch || emailMatch;
      })
      .sort((a, b) => {
        // Prioritize exact name matches
        const aNameStart = a.name.toLowerCase().startsWith(query);
        const bNameStart = b.name.toLowerCase().startsWith(query);
        if (aNameStart && !bNameStart) return -1;
        if (!aNameStart && bNameStart) return 1;
        return 0;
      })
      .slice(0, 5); // Limit to top 5 results for performance
  }, [searchQuery, allCustomers]);

  const handleSelectCustomer = (customer: Customer) => {
    onUpdate({
      customerName: customer.name,
      customerPhone: customer.phone,
      customerEmail: customer.email || '',
      customerId: customer.id,
      isReturningCustomer: true,
    });
    setSearchQuery('');
    setShowSuggestions(false);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold mb-2">{t('jobs.customer.title')}</h2>
        <p className="text-muted-foreground">
          {t('jobs.customer.subtitle')}
        </p>
      </div>

      {/* Auto-filled from vehicle - Linked Customer */}
      {linkedCustomer && selectedVehicle && (
        <Card className="border-2 border-green-500/30 bg-green-50/50 dark:bg-green-950/20 shadow-lg animate-slide-down">
          <CardContent className="pt-5 pb-5">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center shrink-0">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <p className="text-sm font-bold text-green-700 dark:text-green-400">{t('jobs.customer.found')}</p>
                  <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-400">
                    {t('jobs.customer.linkedVehicle')}
                  </Badge>
                </div>
                <div className="bg-white/60 dark:bg-background/40 rounded-lg p-3 space-y-1">
                  <p className="font-semibold text-foreground">{linkedCustomer.name}</p>
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <Phone className="h-3 w-3" /> {linkedCustomer.phone}
                  </p>
                  {linkedCustomer.email && (
                    <p className="text-sm text-muted-foreground flex items-center gap-2">
                      <Mail className="h-3 w-3" /> {linkedCustomer.email}
                    </p>
                  )}
                </div>
                <div className="flex items-center justify-between mt-3 flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <LicensePlate plateNumber={selectedVehicle.licensePlate} size="sm" />
                    <span className="text-xs text-muted-foreground">
                      {selectedVehicle.brand} {selectedVehicle.model}
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs h-7"
                    onClick={() => {
                      setLinkedCustomer(null);
                      setCustomerAutoFilled(false);
                      onUpdate({
                        customerName: '',
                        customerPhone: '',
                        customerEmail: '',
                        isReturningCustomer: false,
                      });
                    }}
                  >
                    {t('jobs.customer.useDifferent')}
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Auto-filled from vehicle history */}
      {!linkedCustomer && vehicleHistoryCustomer && selectedVehicle && (
        <Card className="border-2 border-blue-500/30 bg-blue-50/50 dark:bg-blue-950/20 shadow-lg animate-slide-down">
          <CardContent className="pt-5 pb-5">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center shrink-0">
                <History className="h-6 w-6 text-blue-600" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <p className="text-sm font-bold text-blue-700 dark:text-blue-400">{t('jobs.customer.foundHistory')}</p>
                  <Badge variant="secondary" className="bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-400">
                    {vehicleHistoryCustomer.jobCount} {vehicleHistoryCustomer.jobCount === 1 ? t('jobs.customer.previousJob') : t('jobs.customer.previousJobs')}
                  </Badge>
                </div>
                <div className="bg-white/60 dark:bg-background/40 rounded-lg p-3 space-y-1">
                  <p className="font-semibold text-foreground">{vehicleHistoryCustomer.name}</p>
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <Phone className="h-3 w-3" /> {vehicleHistoryCustomer.phone}
                  </p>
                  {vehicleHistoryCustomer.email && (
                    <p className="text-sm text-muted-foreground flex items-center gap-2">
                      <Mail className="h-3 w-3" /> {vehicleHistoryCustomer.email}
                    </p>
                  )}
                </div>
                <div className="flex items-center justify-between mt-3 flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <LicensePlate plateNumber={selectedVehicle.licensePlate} size="sm" />
                    <span className="text-xs text-muted-foreground">
                      {t('jobs.customer.lastServiced')} {new Date(vehicleHistoryCustomer.lastJobDate).toLocaleDateString('en-GB')}
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs h-7"
                    onClick={() => {
                      setVehicleHistoryCustomer(null);
                      setCustomerAutoFilled(false);
                      onUpdate({
                        customerName: '',
                        customerPhone: '',
                        customerEmail: '',
                        isReturningCustomer: false,
                      });
                    }}
                  >
                    {t('jobs.customer.useDifferent')}
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Premium Customer Search Card */}
      <Card className="glass-light border-0 shadow-premium hover-lift overflow-hidden">
        <div className="absolute inset-0 gradient-royal-radial opacity-5 pointer-events-none" />
        <CardContent className="pt-6 relative">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-primary" />
            <Input
              placeholder={t('jobs.customer.quickSearch')}
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowSuggestions(true);
              }}
              onFocus={() => setShowSuggestions(true)}
              onBlur={() => {
                // Delay hiding suggestions to allow click events
                setTimeout(() => setShowSuggestions(false), 200);
              }}
              className="h-14 pl-12 pr-10 text-base border-2 border-primary/20 focus:border-primary rounded-xl bg-background/50 backdrop-blur-sm"
            />
            {isSearching && (
              <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-primary animate-spin" />
            )}
          </div>

          {/* Customer suggestions */}
          {showSuggestions && searchQuery.length >= 1 && (
            <>
              {filteredCustomers.length > 0 ? (
                <div className="mt-3 glass-strong rounded-xl divide-y divide-border/30 max-h-72 overflow-y-auto scrollbar-premium shadow-premium-lg animate-slide-down">
                  {filteredCustomers.map((customer, index) => {
                    // Highlight matching text
                    const highlightText = (text: string, query: string) => {
                      const parts = text.split(new RegExp(`(${query})`, 'gi'));
                      return parts.map((part, i) =>
                        part.toLowerCase() === query.toLowerCase() ? (
                          <span key={i} className="bg-primary/20 text-primary font-semibold">{part}</span>
                        ) : (
                          part
                        )
                      );
                    };

                    return (
                      <button
                        key={index}
                        type="button"
                        className="w-full p-4 text-left hover:bg-primary/5 transition-all duration-200 flex items-center justify-between group"
                        onClick={() => handleSelectCustomer(customer)}
                      >
                        <div className="flex items-center gap-4 flex-1 min-w-0">
                          <div className="w-12 h-12 gradient-royal rounded-xl flex items-center justify-center shadow-glow group-hover:scale-110 transition-transform shrink-0">
                            <UserCheck className="h-6 w-6 text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="font-semibold text-foreground group-hover:text-primary transition-colors truncate">
                                {highlightText(customer.name, searchQuery)}
                              </p>
                              {customer.complaints && customer.complaints.length > 0 && (
                                <Badge variant="secondary" className="bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-400 shrink-0">
                                  <AlertTriangle className="h-3 w-3 mr-1" />
                                  {customer.complaints.length}
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground truncate">{customer.phone}</p>
                            {customer.email && (
                              <p className="text-xs text-muted-foreground truncate">{customer.email}</p>
                            )}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="mt-3 p-6 glass-light rounded-xl text-center animate-fade-in">
                  <Search className="h-10 w-10 text-muted-foreground mx-auto mb-2 opacity-50" />
                  <p className="text-sm text-muted-foreground font-medium">{t('jobs.customer.noCustomersFound')}</p>
                  <p className="text-xs text-muted-foreground mt-1">{t('jobs.customer.tryDifferent')}</p>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Premium Customer Form Card */}
      <Card className="glass-strong border-0 shadow-premium-lg overflow-hidden">
        <div className="absolute inset-0 gradient-royal-radial opacity-5 pointer-events-none" />
        <CardContent className="pt-6 space-y-5 relative">
          {formData.isReturningCustomer && (
            <div className="flex items-center gap-3 p-4 gradient-royal rounded-xl shadow-glow animate-bounce-subtle">
              <UserCheck className="h-5 w-5 text-white" />
              <span className="text-sm font-semibold text-white">{t('jobs.customer.returning')}</span>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="customerName" className="flex items-center gap-2 text-sm font-semibold">
              <User className="h-4 w-4 text-primary" />
              {t('jobs.customerName')} *
            </Label>
            <Input
              id="customerName"
              value={formData.customerName}
              onChange={(e) => onUpdate({ customerName: e.target.value })}
              placeholder="John Doe"
              className={`h-14 text-base rounded-xl border-2 transition-all ${
                errors.customerName
                  ? 'border-destructive focus:border-destructive'
                  : 'border-border/30 focus:border-primary'
              }`}
            />
            {errors.customerName && (
              <p className="text-sm text-destructive flex items-center gap-1">
                <span className="text-lg">⚠</span> {errors.customerName}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="customerPhone" className="flex items-center gap-2 text-sm font-semibold">
              <Phone className="h-4 w-4 text-primary" />
              {t('jobs.customerPhone')} *
            </Label>
            <Input
              id="customerPhone"
              type="tel"
              value={formData.customerPhone}
              onChange={(e) => onUpdate({ customerPhone: e.target.value })}
              placeholder="+1 234 567 890"
              className={`h-14 text-base rounded-xl border-2 transition-all ${
                errors.customerPhone
                  ? 'border-destructive focus:border-destructive'
                  : 'border-border/30 focus:border-primary'
              }`}
            />
            {errors.customerPhone && (
              <p className="text-sm text-destructive flex items-center gap-1">
                <span className="text-lg">⚠</span> {errors.customerPhone}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="customerEmail" className="flex items-center gap-2 text-sm font-semibold">
              <Mail className="h-4 w-4 text-primary" />
              {t('jobs.customer.emailOptional')}
            </Label>
            <Input
              id="customerEmail"
              type="email"
              value={formData.customerEmail}
              onChange={(e) => onUpdate({ customerEmail: e.target.value })}
              placeholder="john@example.com"
              className={`h-14 rounded-xl border-2 transition-all ${
                errors.customerEmail
                  ? 'border-destructive focus:border-destructive'
                  : 'border-border/30 focus:border-primary'
              }`}
            />
            {errors.customerEmail && (
              <p className="text-sm text-destructive flex items-center gap-1">
                <span className="text-lg">⚠</span> {errors.customerEmail}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="customerPostCode" className="flex items-center gap-2 text-sm font-semibold">
                <MapPin className="h-4 w-4 text-primary" />
                {t('jobs.customer.postCodeOptional')}
              </Label>
              <Input
                id="customerPostCode"
                value={formData.customerPostCode}
                onChange={(e) => onUpdate({ customerPostCode: e.target.value })}
                placeholder="20260"
                className="h-14 rounded-xl border-2 border-border/30 focus:border-primary transition-all"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="customerRegion" className="flex items-center gap-2 text-sm font-semibold">
                <MapPin className="h-4 w-4 text-primary" />
                {t('jobs.customer.regionOptional')}
              </Label>
              <Input
                id="customerRegion"
                value={formData.customerRegion}
                onChange={(e) => onUpdate({ customerRegion: e.target.value })}
                placeholder="CALVI"
                className="h-14 rounded-xl border-2 border-border/30 focus:border-primary transition-all"
              />
            </div>
          </div>

        </CardContent>
      </Card>
    </div>
  );
}
