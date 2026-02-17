import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  getCompanySettings,
  saveCompanySettings,
  uploadCompanyLogo,
  deleteCompanyLogo,
  initializeDefaultSettings,
} from '@/services/companySettingsService';
import { CompanySettings } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Building2,
  Upload,
  Trash2,
  Save,
  FileText,
  CreditCard,
  Settings2,
  Image,
  CheckCircle,
} from 'lucide-react';
import { toast } from 'sonner';

export function CompanySettingsPage() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const CURRENCIES = [
    { value: 'EUR', label: '€ Euro (EUR)' },
    { value: 'USD', label: '$ US Dollar (USD)' },
    { value: 'GBP', label: '£ British Pound (GBP)' },
    { value: 'CHF', label: 'CHF Swiss Franc (CHF)' },
  ];

  const COUNTRIES = [
    'France',
    'Germany',
    'United Kingdom',
    'Spain',
    'Italy',
    'Portugal',
    'Belgium',
    'Netherlands',
    'Switzerland',
    'Luxembourg',
    'United States',
    'Canada',
    'Other',
  ];
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [settings, setSettings] = useState<CompanySettings | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    companyName: '',
    legalName: '',
    street: '',
    city: '',
    postalCode: '',
    country: 'France',
    taxId: '',
    registrationNumber: '',
    phone: '',
    email: '',
    website: '',
    logoUrl: '',
    quotePrefix: 'QTE',
    invoicePrefix: 'INV',
    defaultTaxRate: 20,
    currency: 'EUR',
    defaultPaymentTermsDays: 30,
    quoteValidityDays: 30,
    termsAndConditions: '',
    invoiceFooter: '',
  });

  useEffect(() => {
    loadSettings();
  }, [user]);

  const loadSettings = async () => {
    if (!user) return;

    try {
      setLoading(true);
      let data = await getCompanySettings();

      if (!data) {
        // Initialize with defaults if no settings exist
        data = await initializeDefaultSettings(user.id);
      }

      setSettings(data);
      setFormData({
        companyName: data.companyName || '',
        legalName: data.legalName || '',
        street: data.address?.street || '',
        city: data.address?.city || '',
        postalCode: data.address?.postalCode || '',
        country: data.address?.country || 'France',
        taxId: data.taxId || '',
        registrationNumber: data.registrationNumber || '',
        phone: data.phone || '',
        email: data.email || '',
        website: data.website || '',
        logoUrl: data.logoUrl || '',
        quotePrefix: data.quotePrefix || 'QTE',
        invoicePrefix: data.invoicePrefix || 'INV',
        defaultTaxRate: data.defaultTaxRate || 20,
        currency: data.currency || 'EUR',
        defaultPaymentTermsDays: data.defaultPaymentTermsDays || 30,
        quoteValidityDays: data.quoteValidityDays || 30,
        termsAndConditions: data.termsAndConditions || '',
        invoiceFooter: data.invoiceFooter || '',
      });
    } catch (error) {
      console.error('Error loading settings:', error);
      toast.error(t('company.loadFailed'));
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!user) return;

    try {
      setSaving(true);

      const settingsToSave = {
        companyName: formData.companyName,
        legalName: formData.legalName || undefined,
        address: {
          street: formData.street,
          city: formData.city,
          postalCode: formData.postalCode,
          country: formData.country,
        },
        taxId: formData.taxId,
        registrationNumber: formData.registrationNumber || undefined,
        phone: formData.phone,
        email: formData.email,
        website: formData.website || undefined,
        logoUrl: formData.logoUrl || undefined,
        quotePrefix: formData.quotePrefix,
        invoicePrefix: formData.invoicePrefix,
        nextQuoteNumber: settings?.nextQuoteNumber || 1,
        nextInvoiceNumber: settings?.nextInvoiceNumber || 1,
        defaultTaxRate: formData.defaultTaxRate,
        currency: formData.currency,
        defaultPaymentTermsDays: formData.defaultPaymentTermsDays,
        quoteValidityDays: formData.quoteValidityDays,
        termsAndConditions: formData.termsAndConditions,
        invoiceFooter: formData.invoiceFooter || undefined,
        updatedBy: user.id,
      };

      await saveCompanySettings(settingsToSave, user.id);
      toast.success(t('company.saved'));
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error(t('company.saveFailed'));
    } finally {
      setSaving(false);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);

      // Delete old logo if exists
      if (formData.logoUrl) {
        await deleteCompanyLogo(formData.logoUrl);
      }

      const url = await uploadCompanyLogo(file);
      setFormData(prev => ({ ...prev, logoUrl: url }));
      toast.success(t('company.logoUploaded'));
    } catch (error: any) {
      console.error('Error uploading logo:', error);
      toast.error(error.message || t('company.logoUploadFailed'));
    } finally {
      setUploading(false);
    }
  };

  const handleLogoDelete = async () => {
    if (!formData.logoUrl) return;

    try {
      await deleteCompanyLogo(formData.logoUrl);
      setFormData(prev => ({ ...prev, logoUrl: '' }));
      toast.success(t('company.logoDeleted'));
    } catch (error) {
      console.error('Error deleting logo:', error);
      toast.error(t('company.logoDeleteFailed'));
    }
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
            <Building2 className="h-8 w-8 text-primary" />
            {t('company.title')}
          </h1>
          <p className="text-muted-foreground mt-1">
            {t('company.subtitle')}
          </p>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          <Save className="h-4 w-4 mr-2" />
          {saving ? t('company.saving') : t('company.saveSettings')}
        </Button>
      </div>

      <Tabs defaultValue="business" className="space-y-6">
        <TabsList className="grid grid-cols-4 w-full max-w-2xl">
          <TabsTrigger value="business" className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            <span className="hidden sm:inline">{t('company.tabs.business')}</span>
          </TabsTrigger>
          <TabsTrigger value="branding" className="flex items-center gap-2">
            <Image className="h-4 w-4" />
            <span className="hidden sm:inline">{t('company.tabs.branding')}</span>
          </TabsTrigger>
          <TabsTrigger value="invoicing" className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            <span className="hidden sm:inline">{t('company.tabs.invoicing')}</span>
          </TabsTrigger>
          <TabsTrigger value="legal" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">{t('company.tabs.legal')}</span>
          </TabsTrigger>
        </TabsList>

        {/* Business Info Tab */}
        <TabsContent value="business" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t('company.businessInfo')}</CardTitle>
              <CardDescription>
                {t('company.businessInfoDesc')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="companyName">{t('company.companyName')} *</Label>
                  <Input
                    id="companyName"
                    value={formData.companyName}
                    onChange={e => setFormData(prev => ({ ...prev, companyName: e.target.value }))}
                    placeholder={t('company.companyNamePlaceholder')}
                  />
                </div>
                <div>
                  <Label htmlFor="legalName">{t('company.legalName')}</Label>
                  <Input
                    id="legalName"
                    value={formData.legalName}
                    onChange={e => setFormData(prev => ({ ...prev, legalName: e.target.value }))}
                    placeholder={t('company.legalNamePlaceholder')}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="street">{t('company.streetAddress')} *</Label>
                <Input
                  id="street"
                  value={formData.street}
                  onChange={e => setFormData(prev => ({ ...prev, street: e.target.value }))}
                  placeholder={t('company.streetPlaceholder')}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="city">{t('company.city')} *</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={e => setFormData(prev => ({ ...prev, city: e.target.value }))}
                    placeholder={t('company.cityPlaceholder')}
                  />
                </div>
                <div>
                  <Label htmlFor="postalCode">{t('company.postalCode')} *</Label>
                  <Input
                    id="postalCode"
                    value={formData.postalCode}
                    onChange={e => setFormData(prev => ({ ...prev, postalCode: e.target.value }))}
                    placeholder={t('company.postalCodePlaceholder')}
                  />
                </div>
                <div>
                  <Label htmlFor="country">{t('company.country')} *</Label>
                  <Select
                    value={formData.country}
                    onValueChange={value => setFormData(prev => ({ ...prev, country: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {COUNTRIES.map(country => (
                        <SelectItem key={country} value={country}>
                          {country}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="taxId">{t('company.taxId')} *</Label>
                  <Input
                    id="taxId"
                    value={formData.taxId}
                    onChange={e => setFormData(prev => ({ ...prev, taxId: e.target.value }))}
                    placeholder={t('company.taxIdPlaceholder')}
                  />
                </div>
                <div>
                  <Label htmlFor="registrationNumber">{t('company.registrationNumber')}</Label>
                  <Input
                    id="registrationNumber"
                    value={formData.registrationNumber}
                    onChange={e => setFormData(prev => ({ ...prev, registrationNumber: e.target.value }))}
                    placeholder={t('company.registrationPlaceholder')}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t('company.contactInfo')}</CardTitle>
              <CardDescription>
                {t('company.contactInfoDesc')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="phone">{t('company.phone')} *</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={e => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder={t('company.phonePlaceholder')}
                  />
                </div>
                <div>
                  <Label htmlFor="email">{t('company.email')} *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={e => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    placeholder={t('company.emailPlaceholder')}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="website">{t('company.website')}</Label>
                <Input
                  id="website"
                  value={formData.website}
                  onChange={e => setFormData(prev => ({ ...prev, website: e.target.value }))}
                  placeholder={t('company.websitePlaceholder')}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Branding Tab */}
        <TabsContent value="branding" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t('company.logo')}</CardTitle>
              <CardDescription>
                {t('company.logoDesc')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-6">
                {/* Logo Preview */}
                <div className="w-48 h-24 border-2 border-dashed rounded-lg flex items-center justify-center bg-muted/30">
                  {formData.logoUrl ? (
                    <img
                      src={formData.logoUrl}
                      alt="Company Logo"
                      className="max-w-full max-h-full object-contain"
                    />
                  ) : (
                    <div className="text-center text-muted-foreground">
                      <Image className="h-8 w-8 mx-auto mb-1" />
                      <p className="text-xs">{t('company.noLogoUploaded')}</p>
                    </div>
                  )}
                </div>

                {/* Upload Controls */}
                <div className="space-y-3">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="hidden"
                  />
                  <Button
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    {uploading ? t('company.uploading') : t('company.uploadLogo')}
                  </Button>
                  {formData.logoUrl && (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={handleLogoDelete}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      {t('company.remove')}
                    </Button>
                  )}
                </div>
              </div>

              <Alert>
                <AlertDescription>
                  {t('company.logoFormatsSupported')}
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Invoicing Tab */}
        <TabsContent value="invoicing" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t('company.quoteInvoiceNumbering')}</CardTitle>
              <CardDescription>
                {t('company.numberingDesc')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="quotePrefix">{t('company.quotePrefix')}</Label>
                  <Input
                    id="quotePrefix"
                    value={formData.quotePrefix}
                    onChange={e => setFormData(prev => ({ ...prev, quotePrefix: e.target.value.toUpperCase() }))}
                    placeholder={t('company.quotePrefixPlaceholder')}
                    maxLength={5}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    {t('company.quotePreview')}: {formData.quotePrefix}-2026-001
                  </p>
                </div>
                <div>
                  <Label htmlFor="invoicePrefix">{t('company.invoicePrefix')}</Label>
                  <Input
                    id="invoicePrefix"
                    value={formData.invoicePrefix}
                    onChange={e => setFormData(prev => ({ ...prev, invoicePrefix: e.target.value.toUpperCase() }))}
                    placeholder={t('company.invoicePrefixPlaceholder')}
                    maxLength={5}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    {t('company.quotePreview')}: {formData.invoicePrefix}-2026-001
                  </p>
                </div>
              </div>

              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  {t('company.nextNumbers')
                    .replace('{quoteNum}', String(settings?.nextQuoteNumber || 1))
                    .replace('{invoiceNum}', String(settings?.nextInvoiceNumber || 1))}
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t('company.defaultSettings')}</CardTitle>
              <CardDescription>
                {t('company.defaultSettingsDesc')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="currency">{t('company.currency')}</Label>
                  <Select
                    value={formData.currency}
                    onValueChange={value => setFormData(prev => ({ ...prev, currency: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CURRENCIES.map(currency => (
                        <SelectItem key={currency.value} value={currency.value}>
                          {currency.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="defaultTaxRate">{t('company.defaultTaxRate')}</Label>
                  <Input
                    id="defaultTaxRate"
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    value={formData.defaultTaxRate}
                    onChange={e => setFormData(prev => ({ ...prev, defaultTaxRate: Number(e.target.value) }))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="quoteValidityDays">{t('company.quoteValidity')}</Label>
                  <Input
                    id="quoteValidityDays"
                    type="number"
                    min="1"
                    max="365"
                    value={formData.quoteValidityDays}
                    onChange={e => setFormData(prev => ({ ...prev, quoteValidityDays: Number(e.target.value) }))}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    {t('company.quoteValidityDesc')}
                  </p>
                </div>
                <div>
                  <Label htmlFor="defaultPaymentTermsDays">{t('company.paymentTerms')}</Label>
                  <Input
                    id="defaultPaymentTermsDays"
                    type="number"
                    min="0"
                    max="365"
                    value={formData.defaultPaymentTermsDays}
                    onChange={e => setFormData(prev => ({ ...prev, defaultPaymentTermsDays: Number(e.target.value) }))}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    {t('company.paymentTermsDesc')}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Legal Tab */}
        <TabsContent value="legal" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t('company.termsAndConditions')}</CardTitle>
              <CardDescription>
                {t('company.termsDesc')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                value={formData.termsAndConditions}
                onChange={e => setFormData(prev => ({ ...prev, termsAndConditions: e.target.value }))}
                placeholder={t('company.termsPlaceholder')}
                className="min-h-[300px] font-mono text-sm"
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t('company.invoiceFooter')}</CardTitle>
              <CardDescription>
                {t('company.invoiceFooterDesc')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                value={formData.invoiceFooter}
                onChange={e => setFormData(prev => ({ ...prev, invoiceFooter: e.target.value }))}
                placeholder={t('company.invoiceFooterPlaceholder')}
                className="min-h-[150px]"
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Floating Save Button */}
      <div className="fixed bottom-6 right-6">
        <Button onClick={handleSave} disabled={saving} size="lg" className="shadow-lg">
          <Save className="h-4 w-4 mr-2" />
          {saving ? t('company.saving') : t('company.saveSettings')}
        </Button>
      </div>
    </div>
  );
}
