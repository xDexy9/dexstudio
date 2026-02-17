import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { getAllInvoices, getInvoiceStats, markInvoiceAsSent } from '@/services/invoiceService';
import { getCompanySettings } from '@/services/companySettingsService';
import { Invoice, CompanySettings } from '@/lib/types';
import { printInvoiceHTML } from '@/utils/pdfGenerator';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Receipt,
  Search,
  Eye,
  MoreHorizontal,
  Euro,
  TrendingUp,
  Calendar,
  FileText,
  Printer,
  Download,
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

export function InvoicesPage() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [filteredInvoices, setFilteredInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [stats, setStats] = useState<{
    total: number;
    totalValue: number;
    thisMonth: number;
    thisMonthValue: number;
  } | null>(null);
  const [companySettings, setCompanySettings] = useState<CompanySettings | null>(null);

  const PAYMENT_STATUS_CONFIG = {
    unpaid: { label: t('invoices.unpaid'), color: 'bg-amber-100 text-amber-800' },
    partial: { label: t('invoices.partial'), color: 'bg-blue-100 text-blue-800' },
    paid: { label: t('invoices.paid'), color: 'bg-green-100 text-green-800' },
    overdue: { label: t('invoices.overdue'), color: 'bg-red-100 text-red-800' },
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    filterInvoices();
  }, [invoices, searchTerm, statusFilter]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [invoicesData, statsData, settings] = await Promise.all([
        getAllInvoices(),
        getInvoiceStats(),
        getCompanySettings(),
      ]);
      setInvoices(invoicesData);
      setStats(statsData);
      setCompanySettings(settings);
    } catch (error) {
      console.error('Error loading invoices:', error);
      toast.error('Failed to load invoices');
    } finally {
      setLoading(false);
    }
  };

  const filterInvoices = () => {
    let filtered = [...invoices];

    // Search filter
    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      filtered = filtered.filter(
        inv =>
          inv.invoiceNumber.toLowerCase().includes(lower) ||
          inv.customer.name.toLowerCase().includes(lower) ||
          inv.vehicle.licensePlate.toLowerCase().includes(lower)
      );
    }

    // Status filter
    if (statusFilter && statusFilter !== 'all') {
      filtered = filtered.filter(inv => inv.paymentStatus === statusFilter);
    }

    setFilteredInvoices(filtered);
  };

  const handleSendInvoice = async (invoiceId: string) => {
    if (!user) return;

    try {
      await markInvoiceAsSent(invoiceId, user.id);
      toast.success('Invoice marked as sent');
      loadData();
    } catch (error) {
      console.error('Error sending invoice:', error);
      toast.error('Failed to send invoice');
    }
  };

  const handleDownloadPDF = async (invoice: Invoice) => {
    if (!companySettings) {
      toast.error('Company settings not configured');
      return;
    }
    try {
      await printInvoiceHTML(invoice, companySettings);
    } catch (error) {
      console.error('Error downloading PDF:', error);
      toast.error('Failed to download PDF');
    }
  };

  const handlePrintPDF = async (invoice: Invoice) => {
    if (!companySettings) {
      toast.error('Company settings not configured');
      return;
    }
    try {
      await printInvoiceHTML(invoice, companySettings);
    } catch (error) {
      console.error('Error printing PDF:', error);
      toast.error('Failed to print PDF');
    }
  };

  const isOverdue = (invoice: Invoice) => {
    if (invoice.paymentStatus === 'paid') return false;
    return new Date(invoice.dueDate) < new Date();
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
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Receipt className="h-8 w-8 text-primary" />
          {t('invoices.title')}
        </h1>
        <p className="text-muted-foreground mt-1">
          {t('invoices.subtitle')}
        </p>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{t('common.total')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>


          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{t('invoices.thisMonth')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats.thisMonth}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{t('invoices.thisMonthValue')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600 flex items-center gap-1">
                <Euro className="h-5 w-5" />
                {stats.thisMonthValue.toFixed(0)}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <div className="relative flex-1 min-w-[300px]">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t('invoices.searchPlaceholder')}
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder={t('invoices.allStatuses')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('invoices.allStatuses')}</SelectItem>
            <SelectItem value="unpaid">{t('invoices.unpaid')}</SelectItem>
            <SelectItem value="partial">{t('invoices.partial')}</SelectItem>
            <SelectItem value="paid">{t('invoices.paid')}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Invoices Table */}
      <div className="rounded-lg border">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium">{t('invoices.invoiceNumber')}</th>
                <th className="px-4 py-3 text-left text-sm font-medium">{t('common.customer')}</th>
                <th className="px-4 py-3 text-left text-sm font-medium">{t('jobs.vehicle')}</th>
                <th className="px-4 py-3 text-right text-sm font-medium">{t('common.amount')}</th>
                <th className="px-4 py-3 text-center text-sm font-medium">{t('common.status')}</th>
                <th className="px-4 py-3 text-left text-sm font-medium">{t('invoices.issueDate')}</th>
                <th className="px-4 py-3 text-left text-sm font-medium">{t('invoices.dueDate')}</th>
                <th className="px-4 py-3 text-center text-sm font-medium">{t('common.actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredInvoices.map(invoice => {
                const overdue = isOverdue(invoice);
                const statusKey = overdue ? 'overdue' : invoice.paymentStatus;
                const statusConfig = PAYMENT_STATUS_CONFIG[statusKey] || PAYMENT_STATUS_CONFIG.unpaid;

                return (
                  <tr key={invoice.id} className="hover:bg-muted/30">
                    <td className="px-4 py-3">
                      <span className="font-mono font-medium">{invoice.invoiceNumber}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium">{invoice.customer.name}</p>
                        <p className="text-sm text-muted-foreground">{invoice.customer.phone}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium">{invoice.vehicle.brand} {invoice.vehicle.model}</p>
                        <p className="text-sm text-muted-foreground">{invoice.vehicle.licensePlate}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1 font-semibold">
                        <Euro className="h-4 w-4" />
                        {invoice.grandTotal.toFixed(2)}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {invoice.lineItems.length} {invoice.lineItems.length === 1 ? t('common.item') : t('common.items')}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Badge className={`${statusConfig.color} w-fit mx-auto`}>
                        {statusConfig.label}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {format(new Date(invoice.issueDate), 'dd MMM yyyy')}
                    </td>
                    <td className="px-4 py-3">
                      <span className={overdue ? 'text-red-600 font-medium' : ''}>
                        {format(new Date(invoice.dueDate), 'dd MMM yyyy')}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => navigate(`/invoices/${invoice.id}`)}>
                            <Eye className="h-4 w-4 mr-2" />
                            {t('invoices.viewInvoice')}
                          </DropdownMenuItem>

                          <DropdownMenuItem onClick={() => navigate(`/jobs/${invoice.jobId}`)}>
                            <FileText className="h-4 w-4 mr-2" />
                            {t('quotes.viewJob')}
                          </DropdownMenuItem>

                          <DropdownMenuItem onClick={() => handleDownloadPDF(invoice)}>
                            <Download className="h-4 w-4 mr-2" />
                            {t('common.download')}
                          </DropdownMenuItem>

                          <DropdownMenuItem onClick={() => handlePrintPDF(invoice)}>
                            <Printer className="h-4 w-4 mr-2" />
                            {t('invoices.printInvoice')}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredInvoices.length === 0 && (
          <div className="text-center py-12">
            <Receipt className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">{t('invoices.noInvoicesFound')}</p>
            <p className="text-sm text-muted-foreground mt-1">
              {t('invoices.createFromQuote')}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
