import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  CreditCard,
  DollarSign,
  FileText,
  Send,
  CheckCircle,
  Clock,
  AlertCircle,
  Download,
  Plus,
  Search,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { Invoice, InvoiceItem } from '@/types';

const mockInvoices: Invoice[] = [
  {
    id: 'inv-1',
    invoiceNumber: 'INV-2024-001',
    customerId: 'user-1',
    customerName: 'John Smith',
    customerEmail: 'john.smith@email.com',
    appointmentId: 'apt-1',
    items: [
      { id: '1', description: 'Oil Change - Synthetic 5W-30', quantity: 1, unitPrice: 65, total: 65 },
      { id: '2', description: 'Air Filter Replacement', quantity: 1, unitPrice: 25, total: 25 },
    ],
    subtotal: 90,
    taxRate: 0.08,
    taxAmount: 7.2,
    total: 97.2,
    status: 'paid',
    dueDate: '2024-02-20',
    paidAt: '2024-02-18',
    paymentMethod: 'card',
    createdAt: '2024-02-15',
  },
  {
    id: 'inv-2',
    invoiceNumber: 'INV-2024-002',
    customerId: 'user-2',
    customerName: 'Sarah Johnson',
    customerEmail: 'sarah.j@email.com',
    appointmentId: 'apt-2',
    items: [
      { id: '1', description: 'Brake Pad Replacement - Front', quantity: 1, unitPrice: 180, total: 180 },
      { id: '2', description: 'Brake Rotor Resurfacing', quantity: 2, unitPrice: 45, total: 90 },
      { id: '3', description: 'O2 Sensor Replacement', quantity: 1, unitPrice: 120, total: 120 },
      { id: '4', description: 'Diagnostic Fee', quantity: 1, unitPrice: 75, total: 75 },
    ],
    subtotal: 465,
    taxRate: 0.08,
    taxAmount: 37.2,
    total: 502.2,
    status: 'sent',
    dueDate: '2024-02-28',
    createdAt: '2024-02-20',
  },
  {
    id: 'inv-3',
    invoiceNumber: 'INV-2024-003',
    customerId: 'user-3',
    customerName: 'Michael Chen',
    customerEmail: 'mchen@email.com',
    appointmentId: 'apt-3',
    items: [
      { id: '1', description: 'Water Pump Replacement', quantity: 1, unitPrice: 450, total: 450 },
      { id: '2', description: 'Coolant Flush', quantity: 1, unitPrice: 85, total: 85 },
      { id: '3', description: 'Thermostat Replacement', quantity: 1, unitPrice: 120, total: 120 },
    ],
    subtotal: 655,
    taxRate: 0.08,
    taxAmount: 52.4,
    total: 707.4,
    status: 'draft',
    dueDate: '2024-03-01',
    createdAt: '2024-02-22',
  },
];

const statusConfig = {
  draft: { label: 'Draft', icon: FileText, className: 'bg-secondary text-secondary-foreground' },
  sent: { label: 'Sent', icon: Send, className: 'bg-blue-500/10 text-blue-500' },
  paid: { label: 'Paid', icon: CheckCircle, className: 'bg-green-500/10 text-green-500' },
  overdue: { label: 'Overdue', icon: AlertCircle, className: 'bg-destructive/10 text-destructive' },
  cancelled: { label: 'Cancelled', icon: AlertCircle, className: 'bg-muted text-muted-foreground' },
};

export const PaymentCenter = () => {
  const [invoices, setInvoices] = useState<Invoice[]>(mockInvoices);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  const filteredInvoices = invoices.filter((inv) => {
    const matchesSearch =
      inv.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === 'all' || inv.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: invoices.reduce((sum, inv) => sum + inv.total, 0),
    paid: invoices.filter((i) => i.status === 'paid').reduce((sum, inv) => sum + inv.total, 0),
    pending: invoices
      .filter((i) => i.status === 'sent' || i.status === 'draft')
      .reduce((sum, inv) => sum + inv.total, 0),
    overdue: invoices.filter((i) => i.status === 'overdue').reduce((sum, inv) => sum + inv.total, 0),
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const sendInvoice = (id: string) => {
    setInvoices((prev) =>
      prev.map((inv) => (inv.id === id ? { ...inv, status: 'sent' as const } : inv))
    );
  };

  const markAsPaid = (id: string) => {
    setInvoices((prev) =>
      prev.map((inv) =>
        inv.id === id
          ? { ...inv, status: 'paid' as const, paidAt: new Date().toISOString(), paymentMethod: 'card' as const }
          : inv
      )
    );
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Invoiced', value: stats.total, icon: FileText, color: 'text-primary' },
          { label: 'Paid', value: stats.paid, icon: CheckCircle, color: 'text-green-500' },
          { label: 'Pending', value: stats.pending, icon: Clock, color: 'text-yellow-500' },
          { label: 'Overdue', value: stats.overdue, icon: AlertCircle, color: 'text-destructive' },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className={cn('p-3 rounded-xl bg-secondary', stat.color)}>
                    <stat.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{formatCurrency(stat.value)}</p>
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Invoices List */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-primary" />
              Invoices
            </CardTitle>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search invoices..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 w-[200px]"
                />
              </div>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-[130px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="sent">Sent</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="overdue">Overdue</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={() => setIsCreateOpen(true)}>
                <Plus className="h-4 w-4 mr-1" />
                New Invoice
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredInvoices.map((invoice) => {
              const StatusIcon = statusConfig[invoice.status].icon;
              return (
                <motion.div
                  key={invoice.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-secondary/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <FileText className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{invoice.invoiceNumber}</p>
                      <p className="text-sm text-muted-foreground">{invoice.customerName}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <p className="font-semibold">{formatCurrency(invoice.total)}</p>
                      <p className="text-xs text-muted-foreground">
                        Due: {new Date(invoice.dueDate).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge className={statusConfig[invoice.status].className}>
                      <StatusIcon className="h-3 w-3 mr-1" />
                      {statusConfig[invoice.status].label}
                    </Badge>
                    <div className="flex items-center gap-2">
                      {invoice.status === 'draft' && (
                        <Button size="sm" onClick={() => sendInvoice(invoice.id)}>
                          <Send className="h-4 w-4 mr-1" />
                          Send
                        </Button>
                      )}
                      {invoice.status === 'sent' && (
                        <Button size="sm" variant="outline" onClick={() => markAsPaid(invoice.id)}>
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Mark Paid
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setSelectedInvoice(invoice)}
                      >
                        View
                      </Button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Invoice Detail Dialog */}
      <Dialog open={!!selectedInvoice} onOpenChange={() => setSelectedInvoice(null)}>
        <DialogContent className="max-w-2xl">
          {selectedInvoice && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center justify-between">
                  <span>Invoice {selectedInvoice.invoiceNumber}</span>
                  <Badge className={statusConfig[selectedInvoice.status].className}>
                    {statusConfig[selectedInvoice.status].label}
                  </Badge>
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Bill To</p>
                    <p className="font-medium">{selectedInvoice.customerName}</p>
                    <p className="text-sm">{selectedInvoice.customerEmail}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Due Date</p>
                    <p className="font-medium">
                      {new Date(selectedInvoice.dueDate).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <Separator />
                <div>
                  <table className="w-full">
                    <thead>
                      <tr className="text-sm text-muted-foreground">
                        <th className="text-left pb-2">Description</th>
                        <th className="text-center pb-2">Qty</th>
                        <th className="text-right pb-2">Price</th>
                        <th className="text-right pb-2">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {selectedInvoice.items.map((item) => (
                        <tr key={item.id}>
                          <td className="py-2">{item.description}</td>
                          <td className="text-center py-2">{item.quantity}</td>
                          <td className="text-right py-2">{formatCurrency(item.unitPrice)}</td>
                          <td className="text-right py-2">{formatCurrency(item.total)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <Separator />
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Subtotal</span>
                    <span>{formatCurrency(selectedInvoice.subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Tax ({(selectedInvoice.taxRate * 100).toFixed(0)}%)</span>
                    <span>{formatCurrency(selectedInvoice.taxAmount)}</span>
                  </div>
                  <div className="flex justify-between font-semibold text-lg">
                    <span>Total</span>
                    <span>{formatCurrency(selectedInvoice.total)}</span>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline">
                  <Download className="h-4 w-4 mr-1" />
                  Download PDF
                </Button>
                {selectedInvoice.status === 'draft' && (
                  <Button onClick={() => sendInvoice(selectedInvoice.id)}>
                    <Send className="h-4 w-4 mr-1" />
                    Send Invoice
                  </Button>
                )}
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
