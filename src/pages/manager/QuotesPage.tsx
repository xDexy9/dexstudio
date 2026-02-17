import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { getAllQuotes, getQuoteStats, deleteQuote, syncPublicQuoteStatus } from '@/services/quoteService';
import { createInvoiceFromQuote } from '@/services/invoiceService';
import { getCompanySettings } from '@/services/companySettingsService';
import { Quote, CompanySettings, Job } from '@/lib/types';
import { getJobById } from '@/services/firestoreService';
import { printQuoteHTML } from '@/utils/pdfGenerator';
import { SendQuoteModal } from '@/components/quotes/SendQuoteModal';
import { PaginationControls, usePagination } from '@/components/Pagination';
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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  FileText,
  Search,
  Send,
  Eye,
  MoreHorizontal,
  Trash2,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Euro,
  TrendingUp,
  Receipt,
  Download,
  Printer,
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

const STATUS_CONFIG = {
  draft: { label: 'Draft', color: 'bg-gray-100 text-gray-800', icon: FileText },
  sent: { label: 'Sent', color: 'bg-blue-100 text-blue-800', icon: Send },
  viewed: { label: 'Viewed', color: 'bg-purple-100 text-purple-800', icon: Eye },
  approved: { label: 'Approved', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  rejected: { label: 'Rejected', color: 'bg-red-100 text-red-800', icon: XCircle },
  expired: { label: 'Expired', color: 'bg-amber-100 text-amber-800', icon: AlertTriangle },
  converted: { label: 'Converted', color: 'bg-emerald-100 text-emerald-800', icon: TrendingUp },
};

export function QuotesPage() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [stats, setStats] = useState<{
    total: number;
    draft: number;
    sent: number;
    approved: number;
    rejected: number;
    expired: number;
    totalValue: number;
    approvedValue: number;
  } | null>(null);
  const [sendQuoteModalOpen, setSendQuoteModalOpen] = useState(false);
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null);
  const [companySettings, setCompanySettings] = useState<CompanySettings | null>(null);

  // Memoized filtered quotes
  const filteredQuotes = useMemo(() => {
    let filtered = [...quotes];

    // Search filter
    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      filtered = filtered.filter(
        q =>
          q.quoteNumber.toLowerCase().includes(lower) ||
          q.customer.name.toLowerCase().includes(lower) ||
          q.vehicle.licensePlate.toLowerCase().includes(lower)
      );
    }

    // Status filter
    if (statusFilter && statusFilter !== 'all') {
      filtered = filtered.filter(q => q.status === statusFilter);
    }

    return filtered;
  }, [quotes, searchTerm, statusFilter]);

  // Pagination
  const pagination = usePagination(filteredQuotes, 15);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [quotesData, statsData, settings] = await Promise.all([
        getAllQuotes(),
        getQuoteStats(),
        getCompanySettings(),
      ]);

      // Sync any public quote status changes (customer approvals/rejections)
      const sentQuotes = quotesData.filter(q => q.status === 'sent' || q.status === 'viewed');
      if (user && sentQuotes.length > 0) {
        await Promise.all(
          sentQuotes.map(q => syncPublicQuoteStatus(q.id, user.id))
        );
        // Reload if any synced
        if (sentQuotes.length > 0) {
          const [refreshedQuotes, refreshedStats] = await Promise.all([
            getAllQuotes(),
            getQuoteStats(),
          ]);
          setQuotes(refreshedQuotes);
          setStats(refreshedStats);
          setCompanySettings(settings);
          return;
        }
      }

      setQuotes(quotesData);
      setStats(statsData);
      setCompanySettings(settings);
    } catch (error) {
      console.error('Error loading quotes:', error);
      toast.error('Failed to load quotes');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenSendModal = (quote: Quote) => {
    setSelectedQuote(quote);
    setSendQuoteModalOpen(true);
  };

  const handleDeleteQuote = async (quoteId: string) => {
    if (!user) return;
    if (!confirm('Are you sure you want to delete this draft quote?')) return;

    try {
      await deleteQuote(quoteId, user.id);
      toast.success('Quote deleted');
      loadData();
    } catch (error: any) {
      console.error('Error deleting quote:', error);
      toast.error(error.message || 'Failed to delete quote');
    }
  };

  const handleCreateInvoice = async (quoteId: string) => {
    if (!user) return;

    try {
      await createInvoiceFromQuote(quoteId, user.id);
      toast.success('Invoice created successfully');
      loadData();
    } catch (error: any) {
      console.error('Error creating invoice:', error);
      toast.error(error.message || 'Failed to create invoice');
    }
  };

  const fetchJobForQuote = async (quote: Quote): Promise<Job | undefined> => {
    try {
      const job = await getJobById(quote.jobId);
      return job || undefined;
    } catch {
      return undefined;
    }
  };

  const handleDownloadPDF = async (quote: Quote) => {
    if (!companySettings) {
      toast.error('Company settings not configured');
      return;
    }
    try {
      const job = await fetchJobForQuote(quote);
      await printQuoteHTML(quote, companySettings, job);
    } catch (error) {
      console.error('Error downloading PDF:', error);
      toast.error('Failed to download PDF');
    }
  };

  const handlePrintPDF = async (quote: Quote) => {
    if (!companySettings) {
      toast.error('Company settings not configured');
      return;
    }
    try {
      const job = await fetchJobForQuote(quote);
      await printQuoteHTML(quote, companySettings, job);
    } catch (error) {
      console.error('Error printing PDF:', error);
      toast.error('Failed to print PDF');
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
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <FileText className="h-8 w-8 text-primary" />
          {t('quotes.title')}
        </h1>
        <p className="text-muted-foreground mt-1">
          {t('quotes.subtitle')}
        </p>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
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
              <CardTitle className="text-sm font-medium text-muted-foreground">{t('quotes.draft')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-600">{stats.draft}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{t('quotes.sent')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats.sent}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{t('quotes.approved')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.approved}</div>
            </CardContent>
          </Card>

        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <div className="relative flex-1 min-w-[300px]">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t('quotes.searchPlaceholder')}
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder={t('quotes.allStatuses')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('quotes.allStatuses')}</SelectItem>
            <SelectItem value="draft">{t('quotes.draft')}</SelectItem>
            <SelectItem value="sent">{t('quotes.sent')}</SelectItem>
            <SelectItem value="viewed">{t('quotes.viewed')}</SelectItem>
            <SelectItem value="approved">{t('quotes.approved')}</SelectItem>
            <SelectItem value="rejected">{t('quotes.rejected')}</SelectItem>
            <SelectItem value="expired">{t('quotes.expired')}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Quotes Table */}
      <div className="rounded-lg border">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium">{t('quotes.quoteNumber')}</th>
                <th className="px-4 py-3 text-left text-sm font-medium">{t('common.customer')}</th>
                <th className="px-4 py-3 text-left text-sm font-medium">{t('jobs.vehicle')}</th>
                <th className="px-4 py-3 text-right text-sm font-medium">{t('common.amount')}</th>
                <th className="px-4 py-3 text-center text-sm font-medium">{t('common.status')}</th>
                <th className="px-4 py-3 text-left text-sm font-medium">{t('quotes.validUntil')}</th>
                <th className="px-4 py-3 text-left text-sm font-medium">{t('common.created')}</th>
                <th className="px-4 py-3 text-center text-sm font-medium">{t('common.actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {pagination.paginatedItems.map(quote => {
                const statusConfig = STATUS_CONFIG[quote.status] || STATUS_CONFIG.draft;
                const StatusIcon = statusConfig.icon;
                const isExpired = new Date(quote.validUntil) < new Date() && quote.status === 'sent';

                return (
                  <tr key={quote.id} className="hover:bg-muted/30">
                    <td className="px-4 py-3">
                      <span className="font-mono font-medium">{quote.quoteNumber}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium">{quote.customer.name}</p>
                        <p className="text-sm text-muted-foreground">{quote.customer.phone}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium">{quote.vehicle.brand} {quote.vehicle.model}</p>
                        <p className="text-sm text-muted-foreground">{quote.vehicle.licensePlate}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1 font-semibold">
                        <Euro className="h-4 w-4" />
                        {quote.grandTotal.toFixed(2)}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {quote.lineItems.length} item{quote.lineItems.length !== 1 ? 's' : ''}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Badge className={`${statusConfig.color} flex items-center gap-1 w-fit mx-auto`}>
                        <StatusIcon className="h-3 w-3" />
                        {statusConfig.label}
                      </Badge>
                      {isExpired && (
                        <span className="text-xs text-amber-600 block mt-1">Expired</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={isExpired ? 'text-amber-600' : ''}>
                        {format(new Date(quote.validUntil), 'dd MMM yyyy')}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {format(new Date(quote.createdAt), 'dd MMM yyyy')}
                    </td>
                    <td className="px-4 py-3">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => navigate(`/quotes/${quote.id}`)}>
                            <Eye className="h-4 w-4 mr-2" />
                            {t('quotes.viewQuote')}
                          </DropdownMenuItem>

                          <DropdownMenuItem onClick={() => navigate(`/jobs/${quote.jobId}`)}>
                            <FileText className="h-4 w-4 mr-2" />
                            {t('quotes.viewJob')}
                          </DropdownMenuItem>

                          <DropdownMenuItem onClick={() => handleDownloadPDF(quote)}>
                            <Download className="h-4 w-4 mr-2" />
                            {t('quotes.downloadPDF')}
                          </DropdownMenuItem>

                          <DropdownMenuItem onClick={() => handlePrintPDF(quote)}>
                            <Printer className="h-4 w-4 mr-2" />
                            {t('quotes.printQuote')}
                          </DropdownMenuItem>

                          {quote.status === 'draft' && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={() => handleDeleteQuote(quote.id)}
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                {t('common.delete')}
                              </DropdownMenuItem>
                            </>
                          )}

                          {quote.status === 'approved' && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => handleCreateInvoice(quote.id)}>
                                <Receipt className="h-4 w-4 mr-2" />
                                {t('quotes.createInvoice')}
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {pagination.totalItems === 0 && (
          <div className="text-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">{t('quotes.noQuotesFound')}</p>
            <p className="text-sm text-muted-foreground mt-1">
              {t('quotes.createFromJob')}
            </p>
          </div>
        )}

        {/* Pagination */}
        <div className="border-t px-4">
          <PaginationControls
            currentPage={pagination.currentPage}
            totalPages={pagination.totalPages}
            totalItems={pagination.totalItems}
            pageSize={pagination.pageSize}
            onPageChange={pagination.onPageChange}
            onPageSizeChange={pagination.onPageSizeChange}
            pageSizeOptions={[10, 15, 25, 50]}
          />
        </div>
      </div>

      {/* Send Quote Modal */}
      {selectedQuote && user && (
        <SendQuoteModal
          quote={selectedQuote}
          open={sendQuoteModalOpen}
          onOpenChange={setSendQuoteModalOpen}
          onSent={loadData}
          userId={user.id}
        />
      )}
    </div>
  );
}
