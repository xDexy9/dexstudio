import React, { useState, useEffect, useRef } from 'react';
import { Quote } from '@/lib/types';
import { markQuoteAsSent } from '@/services/quoteService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
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
  Send,
  Copy,
  Check,
  Mail,
  Link,
  Loader2,
  ExternalLink,
  QrCode,
  Printer,
  Download,
} from 'lucide-react';
import { toast } from 'sonner';
import QRCode from 'qrcode';

interface SendQuoteModalProps {
  quote: Quote;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSent: () => void;
  userId: string;
}

export function SendQuoteModal({
  quote,
  open,
  onOpenChange,
  onSent,
  userId,
}: SendQuoteModalProps) {
  const [sending, setSending] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const qrCanvasRef = useRef<HTMLCanvasElement>(null);
  const [emailSubject, setEmailSubject] = useState(
    `Quote ${quote.quoteNumber} from GaragePro`
  );
  const [emailBody, setEmailBody] = useState(
    `Dear ${quote.customer.name},

Please find attached your quote for the following vehicle:
${quote.vehicle.brand} ${quote.vehicle.model} (${quote.vehicle.licensePlate})

Quote Number: ${quote.quoteNumber}
Total Amount: €${quote.grandTotal.toFixed(2)}
Valid Until: ${new Date(quote.validUntil).toLocaleDateString('en-GB')}

You can review and approve the quote by clicking the link below:
${getQuoteApprovalUrl(quote.publicToken)}

If you have any questions, please don't hesitate to contact us.

Best regards,
GaragePro Team`
  );

  function getQuoteApprovalUrl(token: string): string {
    return `${window.location.origin}/quote/approve/${token}`;
  }

  // Generate QR code when modal opens or when toggling QR view
  useEffect(() => {
    if (showQR) {
      generateQRCode();
    }
  }, [showQR]);

  const generateQRCode = async () => {
    const url = getQuoteApprovalUrl(quote.publicToken);
    try {
      const dataUrl = await QRCode.toDataURL(url, {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#ffffff',
        },
      });
      setQrDataUrl(dataUrl);
    } catch (err) {
      console.error('Error generating QR code:', err);
    }
  };

  const handleCopyLink = async () => {
    const link = getQuoteApprovalUrl(quote.publicToken);
    await navigator.clipboard.writeText(link);
    setCopied(true);
    toast.success('Link copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleOpenLink = () => {
    const link = getQuoteApprovalUrl(quote.publicToken);
    window.open(link, '_blank');
  };

  const handleDownloadQR = () => {
    if (!qrDataUrl) return;
    const link = document.createElement('a');
    link.download = `quote-${quote.quoteNumber}-qr.png`;
    link.href = qrDataUrl;
    link.click();
  };

  const handlePrintQR = () => {
    if (!qrDataUrl) return;
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head><title>Quote ${quote.quoteNumber} - QR Code</title></head>
        <body style="display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100vh;font-family:system-ui,sans-serif;">
          <h2 style="margin-bottom:8px;">Quote ${quote.quoteNumber}</h2>
          <p style="color:#666;margin-bottom:24px;">${quote.customer.name} - ${quote.vehicle.brand} ${quote.vehicle.model}</p>
          <img src="${qrDataUrl}" style="width:300px;height:300px;" />
          <p style="margin-top:16px;color:#666;font-size:14px;">Scan to view and approve quote</p>
          <p style="margin-top:8px;color:#999;font-size:12px;">Total: €${quote.grandTotal.toFixed(2)} | Valid until: ${new Date(quote.validUntil).toLocaleDateString('en-GB')}</p>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const handleSendQuote = async () => {
    try {
      setSending(true);

      // Mark the quote as sent in the database (also publishes to public collection)
      await markQuoteAsSent(quote.id, userId);

      // Open mail client
      const mailtoLink = `mailto:${quote.customer.email || ''}?subject=${encodeURIComponent(
        emailSubject
      )}&body=${encodeURIComponent(emailBody)}`;

      window.location.href = mailtoLink;

      toast.success('Quote marked as sent! Email client opened.');
      onOpenChange(false);
      onSent();
    } catch (error) {
      console.error('Error sending quote:', error);
      toast.error('Failed to send quote');
    } finally {
      setSending(false);
    }
  };

  const handleMarkAsSentOnly = async () => {
    try {
      setSending(true);
      await markQuoteAsSent(quote.id, userId);
      toast.success('Quote marked as sent');
      onOpenChange(false);
      onSent();
    } catch (error) {
      console.error('Error marking quote as sent:', error);
      toast.error('Failed to mark quote as sent');
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Send className="h-5 w-5" />
            Send Quote {quote.quoteNumber}
          </DialogTitle>
          <DialogDescription>
            Send this quote to {quote.customer.name} for approval
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Customer Info */}
          <div className="bg-muted/50 p-3 rounded-lg">
            <p className="font-medium">{quote.customer.name}</p>
            <p className="text-sm text-muted-foreground">{quote.customer.email || 'No email on file'}</p>
            <p className="text-sm text-muted-foreground">{quote.customer.phone}</p>
          </div>

          {/* Quote Link */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Link className="h-4 w-4" />
              Approval Link
            </Label>
            <div className="flex gap-2">
              <Input
                value={getQuoteApprovalUrl(quote.publicToken)}
                readOnly
                className="font-mono text-sm"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={handleCopyLink}
                title="Copy link"
              >
                {copied ? (
                  <Check className="h-4 w-4 text-green-600" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={handleOpenLink}
                title="Open link"
              >
                <ExternalLink className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Share this link with the customer to allow them to approve or reject the quote
            </p>
          </div>

          {/* QR Code Section */}
          <div className="space-y-2">
            <Button
              variant="outline"
              size="sm"
              className="gap-2 w-full"
              onClick={() => setShowQR(!showQR)}
            >
              <QrCode className="h-4 w-4" />
              {showQR ? 'Hide QR Code' : 'Show QR Code'}
            </Button>

            {showQR && qrDataUrl && (
              <div className="flex flex-col items-center gap-3 p-4 bg-white rounded-lg border">
                <img src={qrDataUrl} alt="QR Code" className="w-48 h-48" />
                <p className="text-xs text-muted-foreground text-center">
                  Customer can scan this QR code to view and approve the quote
                </p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="gap-1" onClick={handleDownloadQR}>
                    <Download className="h-3 w-3" />
                    Download
                  </Button>
                  <Button variant="outline" size="sm" className="gap-1" onClick={handlePrintQR}>
                    <Printer className="h-3 w-3" />
                    Print
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Email Preview */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Email Preview
            </Label>
            <Input
              value={emailSubject}
              onChange={(e) => setEmailSubject(e.target.value)}
              placeholder="Email subject"
            />
            <Textarea
              value={emailBody}
              onChange={(e) => setEmailBody(e.target.value)}
              rows={10}
              className="font-mono text-sm"
            />
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            variant="secondary"
            onClick={handleMarkAsSentOnly}
            disabled={sending}
          >
            <Check className="h-4 w-4 mr-2" />
            Mark as Sent
          </Button>
          <Button onClick={handleSendQuote} disabled={sending}>
            {sending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Send via Email
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
