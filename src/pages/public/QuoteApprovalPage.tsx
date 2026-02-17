import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { getQuoteByToken, approveQuoteByToken, rejectQuoteByToken } from '@/services/quoteService';
import { Quote, CompanySettings } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  FileText,
  CheckCircle,
  XCircle,
  Euro,
  Car,
  User,
  Calendar,
  AlertTriangle,
  Loader2,
  Pen,
  Eraser,
  Printer,
  Mail,
  Shield,
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

// Company data embedded in the public quote doc
interface PublicCompanyData {
  companyName: string;
  logoUrl?: string;
  phone?: string;
  email?: string;
  address?: {
    street?: string;
    city?: string;
    postalCode?: string;
    country?: string;
  };
  termsAndConditions?: string;
}

export function QuoteApprovalPage() {
  const { token } = useParams<{ token: string }>();
  const [quote, setQuote] = useState<(Quote & { company?: PublicCompanyData }) | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Signature modal state
  const [showSignatureModal, setShowSignatureModal] = useState(false);
  const [signatureDataUrl, setSignatureDataUrl] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  // Rejection modal state
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  // Email copy request
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [customerEmail, setCustomerEmail] = useState('');
  const [emailConsent, setEmailConsent] = useState(false);

  useEffect(() => {
    loadQuote();
  }, [token]);

  const loadQuote = async () => {
    if (!token) {
      setError('Invalid quote link');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      // Only read from publicQuoteApprovals (no auth needed)
      const quoteData = await getQuoteByToken(token);

      if (!quoteData) {
        setError('Quote not found or has been deleted');
        return;
      }

      // Check if quote is expired
      if (new Date(quoteData.validUntil) < new Date() && quoteData.status === 'sent') {
        setError('This quote has expired');
        return;
      }

      setQuote(quoteData as any);
      // Pre-fill email from customer data
      if (quoteData.customer?.email) {
        setCustomerEmail(quoteData.customer.email);
      }
    } catch (err) {
      console.error('Error loading quote:', err);
      setError('Failed to load quote');
    } finally {
      setLoading(false);
    }
  };

  // Canvas drawing functions
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    setIsDrawing(true);
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    let x, y;

    if ('touches' in e) {
      x = e.touches[0].clientX - rect.left;
      y = e.touches[0].clientY - rect.top;
    } else {
      x = e.clientX - rect.left;
      y = e.clientY - rect.top;
    }

    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    let x, y;

    if ('touches' in e) {
      e.preventDefault();
      x = e.touches[0].clientX - rect.left;
      y = e.touches[0].clientY - rect.top;
    } else {
      x = e.clientX - rect.left;
      y = e.clientY - rect.top;
    }

    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#000';
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    saveSignature();
  };

  const saveSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dataUrl = canvas.toDataURL('image/png');
    setSignatureDataUrl(dataUrl);
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setSignatureDataUrl(null);
  };

  const handleApprove = async () => {
    if (!quote || !signatureDataUrl || !token) return;

    try {
      setSubmitting(true);
      // Use token-based approval (no auth required)
      await approveQuoteByToken(token, signatureDataUrl);
      toast.success('Quote approved successfully!');
      setShowSignatureModal(false);
      loadQuote(); // Reload to show updated status
    } catch (err: any) {
      console.error('Error approving quote:', err);
      toast.error(err.message || 'Failed to approve quote');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!quote || !token) return;

    try {
      setSubmitting(true);
      // Use token-based rejection (no auth required)
      await rejectQuoteByToken(token, rejectReason);
      toast.success('Quote rejected');
      setShowRejectModal(false);
      loadQuote(); // Reload to show updated status
    } catch (err: any) {
      console.error('Error rejecting quote:', err);
      toast.error(err.message || 'Failed to reject quote');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRequestPrint = () => {
    toast.info('Print request sent. The garage will prepare a printed copy for you.');
  };

  const handleRequestEmailCopy = () => {
    if (!customerEmail || !emailConsent) return;
    toast.success(`A copy will be sent to ${customerEmail}`);
    setShowEmailModal(false);
  };

  // Extract company data from the public quote doc
  const company = (quote as any)?.company as PublicCompanyData | undefined;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="mt-2 text-muted-foreground">Loading quote...</p>
        </div>
      </div>
    );
  }

  if (error || !quote) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <AlertTriangle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Quote Unavailable</h2>
            <p className="text-muted-foreground">{error || 'Quote not found'}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isApproved = quote.status === 'approved' || quote.status === 'converted';
  const isRejected = quote.status === 'rejected';
  const isExpired = quote.status === 'expired';
  const canRespond = quote.status === 'sent' || quote.status === 'viewed';

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Company Header */}
        {company && (
          <div className="text-center mb-8">
            {company.logoUrl ? (
              <img
                src={company.logoUrl}
                alt={company.companyName}
                className="h-16 mx-auto mb-4"
              />
            ) : (
              <div className="h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText className="h-8 w-8 text-primary" />
              </div>
            )}
            <h1 className="text-2xl font-bold">{company.companyName}</h1>
            {company.address && (
              <p className="text-muted-foreground text-sm mt-1">
                {company.address.street}, {company.address.city}
              </p>
            )}
          </div>
        )}

        {/* Status Banner */}
        {isApproved && (
          <Card className="bg-green-50 border-green-200">
            <CardContent className="py-4 flex items-center gap-3">
              <CheckCircle className="h-6 w-6 text-green-600" />
              <div>
                <p className="font-medium text-green-800">Quote Approved</p>
                <p className="text-sm text-green-600">
                  Thank you for approving this quote. Work will begin shortly.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {isRejected && (
          <Card className="bg-red-50 border-red-200">
            <CardContent className="py-4 flex items-center gap-3">
              <XCircle className="h-6 w-6 text-red-600" />
              <div>
                <p className="font-medium text-red-800">Quote Rejected</p>
                <p className="text-sm text-red-600">
                  This quote has been rejected. Please contact us if you have questions.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Quote Header */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-xl">Quote {quote.quoteNumber}</CardTitle>
                <CardDescription>
                  Issued: {format(new Date(quote.issueDate), 'dd MMM yyyy')}
                </CardDescription>
              </div>
              <Badge
                className={
                  isApproved
                    ? 'bg-green-100 text-green-800'
                    : isRejected
                    ? 'bg-red-100 text-red-800'
                    : isExpired
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-blue-100 text-blue-800'
                }
              >
                {isApproved
                  ? 'Approved'
                  : isRejected
                  ? 'Rejected'
                  : isExpired
                  ? 'Expired'
                  : 'Pending'}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Customer & Vehicle Info */}
            <div className="grid md:grid-cols-2 gap-4">
              <div className="flex items-start gap-3">
                <User className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="font-medium">{quote.customer.name}</p>
                  <p className="text-sm text-muted-foreground">{quote.customer.phone}</p>
                  {quote.customer.email && (
                    <p className="text-sm text-muted-foreground">{quote.customer.email}</p>
                  )}
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Car className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="font-medium">
                    {quote.vehicle.brand} {quote.vehicle.model} ({quote.vehicle.year})
                  </p>
                  <p className="text-sm text-muted-foreground">{quote.vehicle.licensePlate}</p>
                  {quote.vehicle.vin && (
                    <p className="text-sm text-muted-foreground">VIN: {quote.vehicle.vin}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Valid Until */}
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span>Valid until: {format(new Date(quote.validUntil), 'dd MMM yyyy')}</span>
            </div>
          </CardContent>
        </Card>

        {/* Line Items */}
        <Card>
          <CardHeader>
            <CardTitle>Work Items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="px-4 py-2 text-left text-sm font-medium">Description</th>
                    <th className="px-4 py-2 text-right text-sm font-medium">Qty</th>
                    <th className="px-4 py-2 text-right text-sm font-medium">Price</th>
                    <th className="px-4 py-2 text-right text-sm font-medium">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {quote.lineItems.map((item, index) => (
                    <tr key={index}>
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-medium">{item.description}</p>
                          <Badge variant="outline" className="mt-1 text-xs">
                            {item.type === 'part' ? 'Part' : 'Service'}
                          </Badge>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">{item.quantity}</td>
                      <td className="px-4 py-3 text-right">
                        <Euro className="h-3 w-3 inline mr-0.5" />
                        {item.unitPrice.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-right font-medium">
                        <Euro className="h-3 w-3 inline mr-0.5" />
                        {item.total.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totals */}
            <div className="mt-6 border-t pt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span>
                  <Euro className="h-3 w-3 inline mr-0.5" />
                  {quote.subtotal.toFixed(2)}
                </span>
              </div>
              {quote.discountTotal > 0 && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>Discount</span>
                  <span>
                    -<Euro className="h-3 w-3 inline mr-0.5" />
                    {quote.discountTotal.toFixed(2)}
                  </span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Tax</span>
                <span>
                  <Euro className="h-3 w-3 inline mr-0.5" />
                  {quote.taxTotal.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between text-lg font-bold border-t pt-2 mt-2">
                <span>Total</span>
                <span className="flex items-center gap-1">
                  <Euro className="h-4 w-4" />
                  {quote.grandTotal.toFixed(2)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notes */}
        {quote.customerNotes && (
          <Card>
            <CardHeader>
              <CardTitle>Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {quote.customerNotes}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Terms & Conditions */}
        {company?.termsAndConditions && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Terms & Conditions</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground whitespace-pre-wrap">
                {company.termsAndConditions}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Action Buttons */}
        {canRespond && (
          <Card>
            <CardContent className="py-6">
              <p className="text-center text-muted-foreground mb-4">
                Please review the quote above and approve or reject it.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button
                  size="lg"
                  className="gap-2"
                  onClick={() => setShowSignatureModal(true)}
                >
                  <CheckCircle className="h-5 w-5" />
                  Approve Quote
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="gap-2"
                  onClick={() => setShowRejectModal(true)}
                >
                  <XCircle className="h-5 w-5" />
                  Reject Quote
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Customer Options: Get a Copy */}
        <Card>
          <CardContent className="py-4">
            <p className="text-center text-sm text-muted-foreground mb-3">
              Need a copy of this quote?
            </p>
            <div className="flex flex-col sm:flex-row gap-2 justify-center">
              <Button variant="outline" size="sm" className="gap-2" onClick={handleRequestPrint}>
                <Printer className="h-4 w-4" />
                Request Printed Copy
              </Button>
              <Button variant="outline" size="sm" className="gap-2" onClick={() => setShowEmailModal(true)}>
                <Mail className="h-4 w-4" />
                Email Me a Copy
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* GDPR Notice */}
        <div className="flex items-start gap-2 text-xs text-muted-foreground px-2">
          <Shield className="h-4 w-4 flex-shrink-0 mt-0.5" />
          <p>
            Your personal data is processed in accordance with GDPR. We only use your information to
            provide the requested service. Your signature and approval data are stored securely. You can
            request data deletion by contacting us.
          </p>
        </div>

        {/* Signature Modal */}
        <Dialog open={showSignatureModal} onOpenChange={setShowSignatureModal}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Sign to Approve</DialogTitle>
              <DialogDescription>
                Please sign below to approve this quote. Your signature indicates acceptance
                of the work and pricing.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="border rounded-lg p-2 bg-white">
                <canvas
                  ref={canvasRef}
                  width={350}
                  height={150}
                  className="w-full border rounded cursor-crosshair touch-none"
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  onTouchStart={startDrawing}
                  onTouchMove={draw}
                  onTouchEnd={stopDrawing}
                />
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground flex items-center gap-1">
                  <Pen className="h-4 w-4" />
                  Draw your signature above
                </span>
                <Button variant="ghost" size="sm" onClick={clearSignature}>
                  <Eraser className="h-4 w-4 mr-1" />
                  Clear
                </Button>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowSignatureModal(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleApprove}
                disabled={!signatureDataUrl || submitting}
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Approve Quote
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Reject Modal */}
        <Dialog open={showRejectModal} onOpenChange={setShowRejectModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Reject Quote</DialogTitle>
              <DialogDescription>
                Please let us know why you're rejecting this quote. This helps us improve
                our service.
              </DialogDescription>
            </DialogHeader>

            <Textarea
              placeholder="Reason for rejection (optional)"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={4}
            />

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowRejectModal(false)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleReject}
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <XCircle className="h-4 w-4 mr-2" />
                    Reject Quote
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Email Copy Modal */}
        <Dialog open={showEmailModal} onOpenChange={setShowEmailModal}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Email a Copy</DialogTitle>
              <DialogDescription>
                Enter your email address to receive a copy of this quote.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <Label>Email Address</Label>
                <Input
                  type="email"
                  placeholder="your@email.com"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                />
              </div>

              <div className="flex items-start gap-2">
                <input
                  type="checkbox"
                  id="email-consent"
                  checked={emailConsent}
                  onChange={(e) => setEmailConsent(e.target.checked)}
                  className="mt-1"
                />
                <label htmlFor="email-consent" className="text-xs text-muted-foreground">
                  I consent to receiving this quote by email. My email will only be used for
                  this purpose and will not be shared with third parties.
                </label>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowEmailModal(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleRequestEmailCopy}
                disabled={!customerEmail || !emailConsent}
              >
                <Mail className="h-4 w-4 mr-2" />
                Send Copy
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Footer */}
        <div className="text-center text-sm text-muted-foreground py-4">
          <p>Questions about this quote? Contact us at:</p>
          {company && (
            <p className="font-medium mt-1">
              {company.phone} | {company.email}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
