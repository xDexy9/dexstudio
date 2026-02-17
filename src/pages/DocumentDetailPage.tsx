import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  ArrowLeft,
  Download,
  Printer,
  Pencil,
  Send,
  FileText,
  Receipt,
  AlertTriangle,
  CheckCircle,
  Clock,
  User,
  Car,
  Phone,
  Mail,
  MapPin,
  Hash,
  Calendar,
  Wrench,
  ChevronDown,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { getJobById } from '@/services/firestoreService';
import { getInvoiceById, getInvoicesForJob } from '@/services/invoiceService';
import { getQuoteById, getQuotesForJob } from '@/services/quoteService';
import { getCompanySettings } from '@/services/companySettingsService';
import { printInvoiceHTML, printQuoteHTML } from '@/utils/pdfGenerator';
import { Job, Invoice, Quote, QuoteLineItem, CompanySettings } from '@/lib/types';
import { QuoteBuilderModal } from '@/components/quotes/QuoteBuilderModal';
import { SendQuoteModal } from '@/components/quotes/SendQuoteModal';
import { toast } from 'sonner';

type DocumentType = 'invoice' | 'quote';

export default function DocumentDetailPage() {
  const { quoteId, invoiceId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useLanguage();

  const documentType: DocumentType = location.pathname.startsWith('/invoices') ? 'invoice' : 'quote';
  const documentId = documentType === 'invoice' ? invoiceId : quoteId;

  const [document, setDocument] = useState<Invoice | Quote | null>(null);
  const [job, setJob] = useState<Job | null>(null);
  const [settings, setSettings] = useState<CompanySettings | null>(null);
  const [allVersions, setAllVersions] = useState<(Invoice | Quote)[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showSendModal, setShowSendModal] = useState(false);
  const [showVersionDropdown, setShowVersionDropdown] = useState(false);

  const loadDocument = async (id?: string) => {
    const targetId = id || documentId;
    if (!targetId) {
      setError('No document ID provided');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Fetch document
      const doc = documentType === 'invoice'
        ? await getInvoiceById(targetId)
        : await getQuoteById(targetId);

      if (!doc) {
        setError('Document not found');
        setIsLoading(false);
        return;
      }

      setDocument(doc);

      // Fetch job + settings in parallel (versions separately to handle index errors)
      const [foundJob, foundSettings] = await Promise.all([
        getJobById(doc.jobId),
        getCompanySettings(),
      ]);

      setJob(foundJob);
      setSettings(foundSettings);

      // Fetch versions - may fail if Firestore index doesn't exist yet
      try {
        const versions = documentType === 'invoice'
          ? await getInvoicesForJob(doc.jobId)
          : await getQuotesForJob(doc.jobId);
        setAllVersions(versions.sort((a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        ));
      } catch (versionErr) {
        console.warn('Could not fetch versions (index may be needed):', versionErr);
        setAllVersions([doc]);
      }
    } catch (err) {
      console.error('Error loading document:', err);
      setError('Failed to load document');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDocument();
  }, [documentId, documentType]);

  const handleDownloadPDF = async () => {
    if (!document || !settings) return;
    try {
      if (documentType === 'invoice') {
        await printInvoiceHTML(document as Invoice, settings, job || undefined);
      } else {
        await printQuoteHTML(document as Quote, settings, job || undefined);
      }
    } catch (err) {
      console.error('PDF download error:', err);
    }
  };

  const handlePrint = async () => {
    if (!document || !settings) return;
    try {
      if (documentType === 'invoice') {
        await printInvoiceHTML(document as Invoice, settings, job || undefined);
      } else {
        await printQuoteHTML(document as Quote, settings, job || undefined);
      }
    } catch (err) {
      console.error('PDF print error:', err);
    }
  };

  const handleVersionSelect = (versionId: string) => {
    setShowVersionDropdown(false);
    if (versionId !== document?.id) {
      loadDocument(versionId);
      // Update URL without full navigation
      const newPath = documentType === 'invoice' ? `/invoices/${versionId}` : `/quotes/${versionId}`;
      navigate(newPath, { replace: true });
    }
  };

  const getDocumentNumber = () => {
    if (!document) return '';
    return documentType === 'invoice'
      ? (document as Invoice).invoiceNumber
      : (document as Quote).quoteNumber;
  };

  const getStatusBadge = () => {
    if (!document) return null;

    if (documentType === 'invoice') {
      const inv = document as Invoice;
      const colors: Record<string, string> = {
        unpaid: 'bg-red-100 text-red-700',
        partial: 'bg-amber-100 text-amber-700',
        paid: 'bg-green-100 text-green-700',
        overdue: 'bg-red-200 text-red-800',
        cancelled: 'bg-gray-100 text-gray-600',
      };
      return (
        <Badge className={colors[inv.paymentStatus] || 'bg-gray-100'}>
          {inv.paymentStatus.toUpperCase()}
        </Badge>
      );
    } else {
      const q = document as Quote;
      const colors: Record<string, string> = {
        draft: 'bg-gray-100 text-gray-700',
        sent: 'bg-blue-100 text-blue-700',
        viewed: 'bg-cyan-100 text-cyan-700',
        approved: 'bg-green-100 text-green-700',
        rejected: 'bg-red-100 text-red-700',
        expired: 'bg-amber-100 text-amber-700',
        converted: 'bg-purple-100 text-purple-700',
      };
      return (
        <Badge className={colors[q.status] || 'bg-gray-100'}>
          {q.status.toUpperCase()}
        </Badge>
      );
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('en-GB', {
        day: '2-digit', month: 'short', year: 'numeric',
      });
    } catch { return dateStr; }
  };

  const formatCurrency = (amount: number) => {
    return `€${amount.toFixed(2)}`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (error || !document) {
    return (
      <div className="safe-top pb-8 px-4 pt-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="text-center mt-12">
          <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">{error || 'Document not found'}</p>
        </div>
      </div>
    );
  }

  const invoice = documentType === 'invoice' ? (document as Invoice) : null;
  const quote = documentType === 'quote' ? (document as Quote) : null;
  const currentVersionIndex = allVersions.findIndex(v => v.id === document.id);

  return (
    <div className="safe-top pb-8">
      {/* Header */}
      <div className="px-4 pt-4 pb-3">
        <div className="flex items-center gap-3 mb-3">
          <Button variant="ghost" size="icon" onClick={() => {
            if (job) navigate(`/jobs/${job.id}`);
            else navigate(-1);
          }}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              {documentType === 'invoice'
                ? <Receipt className="h-5 w-5 text-green-600" />
                : <FileText className="h-5 w-5 text-blue-600" />
              }
              <h1 className="text-lg font-bold font-mono">{getDocumentNumber()}</h1>
              {getStatusBadge()}
            </div>
            {job && (
              <p className="text-xs text-muted-foreground mt-1">
                {t('document.backToJob')}: {job.customerName} - {job.problemDescription?.substring(0, 40)}...
              </p>
            )}
          </div>
        </div>

        {/* Version selector */}
        {allVersions.length > 1 && (
          <div className="relative mb-3">
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-between"
              onClick={() => setShowVersionDropdown(!showVersionDropdown)}
            >
              <span>{t('document.version')} {allVersions.length - currentVersionIndex} / {allVersions.length}</span>
              <ChevronDown className="h-4 w-4 ml-2" />
            </Button>
            {showVersionDropdown && (
              <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-background border rounded-lg shadow-lg max-h-48 overflow-y-auto">
                {allVersions.map((v, i) => {
                  const num = documentType === 'invoice'
                    ? (v as Invoice).invoiceNumber
                    : (v as Quote).quoteNumber;
                  const isActive = v.id === document.id;
                  return (
                    <button
                      key={v.id}
                      className={`w-full text-left px-3 py-2 text-sm hover:bg-accent flex items-center justify-between ${isActive ? 'bg-accent font-medium' : ''}`}
                      onClick={() => handleVersionSelect(v.id)}
                    >
                      <span>v{allVersions.length - i} - {num}</span>
                      <span className="text-xs text-muted-foreground">
                        {formatDate(v.createdAt)} - {formatCurrency((v as any).grandTotal)}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Action buttons */}
        <div className="flex gap-2 flex-wrap">
          {job && (
            <Button size="sm" variant="outline" onClick={() => setShowEditModal(true)}>
              <Pencil className="h-4 w-4 mr-1" />
              {t('document.editDocument')}
            </Button>
          )}
          <Button size="sm" variant="outline" onClick={handleDownloadPDF} disabled={!settings}>
            <Download className="h-4 w-4 mr-1" />
            {t('document.downloadPDF')}
          </Button>
          <Button size="sm" variant="outline" onClick={handlePrint} disabled={!settings}>
            <Printer className="h-4 w-4 mr-1" />
            {t('document.print')}
          </Button>
        </div>
      </div>

      <div className="px-4 space-y-4">
        {/* PDF-like preview card */}
        <Card className="shadow-lg border-0 bg-white document-preview">
          <CardContent className="p-6 space-y-6">

            {/* Document Header */}
            <div className="flex justify-between items-start">
              <div>
                {settings?.companyName && (
                  <h2 className="text-xl font-bold">{settings.companyName}</h2>
                )}
                {settings?.address && (
                  <p className="text-xs text-muted-foreground mt-1 whitespace-pre-line">
                    {settings.address.street}{'\n'}{settings.address.city}, {settings.address.postalCode}{'\n'}{settings.address.country}
                  </p>
                )}
                {settings?.phone && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                    <Phone className="h-3 w-3" />{settings.phone}
                  </p>
                )}
                {settings?.email && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Mail className="h-3 w-3" />{settings.email}
                  </p>
                )}
              </div>
              <div className="text-right">
                <h3 className="text-lg font-bold text-primary uppercase">
                  {documentType === 'invoice' ? 'INVOICE' : 'QUOTE'}
                </h3>
                <p className="font-mono font-bold text-sm">{getDocumentNumber()}</p>
                <div className="text-xs text-muted-foreground mt-2 space-y-0.5">
                  <p>{t('document.issueDate')}: {formatDate(document.issueDate || (document as any).createdAt)}</p>
                  {invoice?.dueDate && <p>{t('document.dueDate')}: {formatDate(invoice.dueDate)}</p>}
                  {quote?.validUntil && <p>{t('document.validUntil')}: {formatDate(quote.validUntil)}</p>}
                </div>
              </div>
            </div>

            <Separator />

            {/* Customer + Vehicle */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-muted/50 rounded-lg p-3">
                <p className="text-xs font-semibold text-muted-foreground uppercase mb-2 flex items-center gap-1">
                  <User className="h-3 w-3" /> {t('document.customer')}
                </p>
                <p className="font-medium text-sm">{document.customer.name}</p>
                {document.customer.phone && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                    <Phone className="h-3 w-3" />{document.customer.phone}
                  </p>
                )}
                {document.customer.email && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Mail className="h-3 w-3" />{document.customer.email}
                  </p>
                )}
                {(document.customer.postCode || document.customer.region) && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {[document.customer.postCode, document.customer.region].filter(Boolean).join(' ')}
                  </p>
                )}
              </div>
              <div className="bg-muted/50 rounded-lg p-3">
                <p className="text-xs font-semibold text-muted-foreground uppercase mb-2 flex items-center gap-1">
                  <Car className="h-3 w-3" /> {t('document.vehicle')}
                </p>
                <p className="font-medium text-sm">{document.vehicle.brand} {document.vehicle.model}</p>
                <p className="text-xs text-muted-foreground">{document.vehicle.year}</p>
                <p className="text-xs font-mono font-bold mt-1">{document.vehicle.licensePlate}</p>
                {document.vehicle.vin && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                    <Hash className="h-3 w-3" />VIN: {document.vehicle.vin}
                  </p>
                )}
              </div>
            </div>

            {/* Customer notes (quotes) */}
            {quote?.customerNotes && (
              <>
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">{t('document.customerNotes')}</p>
                  <p className="text-sm bg-blue-50 p-3 rounded-lg italic">{quote.customerNotes}</p>
                </div>
              </>
            )}

            <Separator />

            {/* Line Items Table */}
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase mb-3 flex items-center gap-1">
                {t('document.partsServices')}
              </p>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/30">
                      <th className="text-left py-2 px-2 font-medium text-xs">{t('document.description')}</th>
                      <th className="text-center py-2 px-1 font-medium text-xs w-12">{t('document.qty')}</th>
                      <th className="text-right py-2 px-1 font-medium text-xs w-20">{t('document.price')}</th>
                      <th className="text-right py-2 px-1 font-medium text-xs w-14">{t('document.disc')}</th>
                      <th className="text-right py-2 px-1 font-medium text-xs w-14">{t('document.tax')}</th>
                      <th className="text-right py-2 px-2 font-medium text-xs w-20">{t('document.total')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {document.lineItems.map((item: QuoteLineItem, i: number) => (
                      <tr key={item.id || i} className="border-b border-muted/50">
                        <td className="py-2 px-2">
                          <div className="flex items-center gap-1.5">
                            <Badge variant="outline" className="text-[9px] px-1 py-0 shrink-0">
                              {item.type === 'part' ? 'P' : item.type === 'service' ? 'S' : 'C'}
                            </Badge>
                            <span className="text-sm">{item.description}</span>
                          </div>
                        </td>
                        <td className="text-center py-2 px-1 text-xs">{item.quantity}</td>
                        <td className="text-right py-2 px-1 text-xs">{formatCurrency(item.unitPrice)}</td>
                        <td className="text-right py-2 px-1 text-xs">
                          {item.discount > 0 ? `${item.discount}%` : '-'}
                        </td>
                        <td className="text-right py-2 px-1 text-xs">
                          {item.taxRate > 0 ? `${item.taxRate.toFixed(0)}%` : '-'}
                        </td>
                        <td className="text-right py-2 px-2 text-xs font-medium">{formatCurrency(item.total)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Totals */}
            <div className="flex justify-end">
              <div className="w-64 space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{t('document.subtotal')}</span>
                  <span>{formatCurrency(document.subtotal)}</span>
                </div>
                {document.discountTotal > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>{t('document.discount')}</span>
                    <span>-{formatCurrency(document.discountTotal)}</span>
                  </div>
                )}
                {document.taxTotal > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{t('document.tax')}</span>
                    <span>{formatCurrency(document.taxTotal)}</span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between font-bold text-base">
                  <span>{t('document.total')}</span>
                  <span>{formatCurrency(document.grandTotal)}</span>
                </div>
              </div>
            </div>

            {/* Payment status for invoices */}
            {invoice && (
              <div className="flex items-center justify-between bg-muted/50 rounded-lg p-3">
                <div>
                  <p className="text-xs text-muted-foreground">{t('document.paymentStatus')}</p>
                  <div className="flex items-center gap-2 mt-1">
                    {invoice.paidAmount > 0 && (
                      <span className="text-xs text-muted-foreground">
                        {formatCurrency(invoice.paidAmount)} / {formatCurrency(invoice.grandTotal)}
                      </span>
                    )}
                  </div>
                </div>
                {invoice.remainingAmount > 0 && (
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">{t('document.remaining')}</p>
                    <p className="font-bold text-red-600">{formatCurrency(invoice.remainingAmount)}</p>
                  </div>
                )}
              </div>
            )}

            {/* Notes */}
            {document.notes && (
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">{t('document.notes')}</p>
                <p className="text-sm text-muted-foreground">{document.notes}</p>
              </div>
            )}

          </CardContent>
        </Card>

        {/* Version History */}
        {allVersions.length > 1 && (
          <div>
            <p className="text-sm font-semibold mb-2">{t('document.versionHistory')}</p>
            <div className="flex gap-2 overflow-x-auto pb-2">
              {allVersions.map((v, i) => {
                const num = documentType === 'invoice'
                  ? (v as Invoice).invoiceNumber
                  : (v as Quote).quoteNumber;
                const isActive = v.id === document.id;
                return (
                  <Card
                    key={v.id}
                    className={`shrink-0 cursor-pointer transition-all ${isActive ? 'ring-2 ring-primary' : 'hover:bg-accent'}`}
                    onClick={() => handleVersionSelect(v.id)}
                  >
                    <CardContent className="p-3 min-w-[140px]">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold">v{allVersions.length - i}</span>
                        {isActive && <CheckCircle className="h-3.5 w-3.5 text-primary" />}
                      </div>
                      <p className="text-xs font-mono">{num}</p>
                      <p className="text-[10px] text-muted-foreground mt-1">{formatDate(v.createdAt)}</p>
                      <p className="text-sm font-bold mt-1">{formatCurrency((v as any).grandTotal)}</p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {job && document && (
        <QuoteBuilderModal
          job={job}
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          mode={documentType}
          existingLineItems={document.lineItems}
          existingNotes={document.notes || ''}
          existingCustomerNotes={quote?.customerNotes || ''}
          onQuoteCreated={(id) => {
            setShowEditModal(false);
            loadDocument(id);
            const newPath = documentType === 'invoice' ? `/invoices/${id}` : `/quotes/${id}`;
            navigate(newPath, { replace: true });
          }}
        />
      )}

      {/* Send Quote Modal */}
      {quote && user && (
        <SendQuoteModal
          quote={quote}
          open={showSendModal}
          onOpenChange={setShowSendModal}
          onSent={() => {
            setShowSendModal(false);
            loadDocument();
          }}
          userId={user.id}
        />
      )}
    </div>
  );
}
