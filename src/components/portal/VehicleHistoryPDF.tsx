import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  FileText,
  Download,
  Car,
  Calendar,
  DollarSign,
  Wrench,
  CheckCircle,
  Printer,
  Mail,
  Share2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { Vehicle, Appointment } from '@/types';
import { mockVehicles, mockAppointments } from '@/data/mockData';

interface ServiceRecord {
  id: string;
  date: string;
  service: string;
  description: string;
  cost: number;
  mileage?: number;
  mechanic: string;
}

const mockServiceHistory: ServiceRecord[] = [
  {
    id: 'rec-1',
    date: '2024-02-15',
    service: 'Oil Change',
    description: 'Synthetic 5W-30 oil change with filter replacement',
    cost: 65,
    mileage: 32500,
    mechanic: 'Mike Thompson',
  },
  {
    id: 'rec-2',
    date: '2024-01-10',
    service: 'Tire Rotation',
    description: 'Rotated all 4 tires, checked pressure',
    cost: 25,
    mileage: 30000,
    mechanic: 'Carlos Rivera',
  },
  {
    id: 'rec-3',
    date: '2023-11-20',
    service: 'Brake Inspection',
    description: 'Inspected brake pads and rotors - all in good condition',
    cost: 0,
    mileage: 27500,
    mechanic: 'Joe Martinez',
  },
  {
    id: 'rec-4',
    date: '2023-09-05',
    service: 'Oil Change',
    description: 'Synthetic 5W-30 oil change with filter replacement',
    cost: 65,
    mileage: 25000,
    mechanic: 'Mike Thompson',
  },
  {
    id: 'rec-5',
    date: '2023-06-15',
    service: 'Air Filter Replacement',
    description: 'Replaced engine and cabin air filters',
    cost: 45,
    mileage: 22000,
    mechanic: 'Carlos Rivera',
  },
];

interface VehicleHistoryPDFProps {
  vehicle?: Vehicle;
}

export const VehicleHistoryPDF = ({ vehicle = mockVehicles[0] }: VehicleHistoryPDFProps) => {
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [selectedRecords, setSelectedRecords] = useState<string[]>(
    mockServiceHistory.map((r) => r.id)
  );
  const [exportFormat, setExportFormat] = useState<'pdf' | 'csv'>('pdf');
  const [includeOptions, setIncludeOptions] = useState({
    vehicleInfo: true,
    serviceHistory: true,
    costSummary: true,
    mileageTracking: true,
  });

  const totalCost = mockServiceHistory
    .filter((r) => selectedRecords.includes(r.id))
    .reduce((sum, r) => sum + r.cost, 0);

  const toggleRecord = (id: string) => {
    setSelectedRecords((prev) =>
      prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id]
    );
  };

  const selectAll = () => {
    setSelectedRecords(mockServiceHistory.map((r) => r.id));
  };

  const selectNone = () => {
    setSelectedRecords([]);
  };

  const handleExport = () => {
    // In a real app, this would generate and download a PDF
    console.log('Exporting...', {
      format: exportFormat,
      records: selectedRecords,
      options: includeOptions,
    });
    // Simulate download
    alert(`${exportFormat.toUpperCase()} export would download here with ${selectedRecords.length} records.`);
    setIsExportOpen(false);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Service History Report
          </CardTitle>
          <Dialog open={isExportOpen} onOpenChange={setIsExportOpen}>
            <DialogTrigger asChild>
              <Button>
                <Download className="h-4 w-4 mr-1" />
                Export Report
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Export Service History</DialogTitle>
              </DialogHeader>
              <div className="space-y-6 py-4">
                {/* Vehicle Info */}
                <div className="flex items-center gap-4 p-4 bg-secondary/50 rounded-lg">
                  <div className="p-3 rounded-xl bg-primary/10">
                    <Car className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold">
                      {vehicle.year} {vehicle.make} {vehicle.model}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {vehicle.plate} • {vehicle.color}
                    </p>
                  </div>
                </div>

                {/* Export Format */}
                <div>
                  <Label className="mb-2 block">Export Format</Label>
                  <Select
                    value={exportFormat}
                    onValueChange={(v) => setExportFormat(v as 'pdf' | 'csv')}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pdf">PDF Document</SelectItem>
                      <SelectItem value="csv">CSV Spreadsheet</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Include Options */}
                <div>
                  <Label className="mb-2 block">Include in Report</Label>
                  <div className="space-y-2">
                    {[
                      { key: 'vehicleInfo', label: 'Vehicle Information' },
                      { key: 'serviceHistory', label: 'Service History Details' },
                      { key: 'costSummary', label: 'Cost Summary' },
                      { key: 'mileageTracking', label: 'Mileage Tracking' },
                    ].map((option) => (
                      <div key={option.key} className="flex items-center gap-2">
                        <Checkbox
                          id={option.key}
                          checked={includeOptions[option.key as keyof typeof includeOptions]}
                          onCheckedChange={(checked) =>
                            setIncludeOptions((prev) => ({
                              ...prev,
                              [option.key]: !!checked,
                            }))
                          }
                        />
                        <Label htmlFor={option.key} className="cursor-pointer">
                          {option.label}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Record Selection */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label>Select Records</Label>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm" onClick={selectAll}>
                        All
                      </Button>
                      <Button variant="ghost" size="sm" onClick={selectNone}>
                        None
                      </Button>
                    </div>
                  </div>
                  <div className="max-h-[200px] overflow-y-auto space-y-2 border border-border rounded-lg p-2">
                    {mockServiceHistory.map((record) => (
                      <div
                        key={record.id}
                        className={cn(
                          'flex items-center gap-2 p-2 rounded cursor-pointer transition-colors',
                          selectedRecords.includes(record.id)
                            ? 'bg-primary/10'
                            : 'hover:bg-secondary'
                        )}
                        onClick={() => toggleRecord(record.id)}
                      >
                        <Checkbox checked={selectedRecords.includes(record.id)} />
                        <div className="flex-1">
                          <p className="text-sm font-medium">{record.service}</p>
                          <p className="text-xs text-muted-foreground">{record.date}</p>
                        </div>
                        <span className="text-sm">{formatCurrency(record.cost)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Summary */}
                <div className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg">
                  <span className="text-sm">
                    {selectedRecords.length} records selected
                  </span>
                  <span className="font-semibold">Total: {formatCurrency(totalCost)}</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    <Printer className="h-4 w-4 mr-1" />
                    Print
                  </Button>
                  <Button variant="outline" size="sm">
                    <Mail className="h-4 w-4 mr-1" />
                    Email
                  </Button>
                </div>
                <Button onClick={handleExport} disabled={selectedRecords.length === 0}>
                  <Download className="h-4 w-4 mr-1" />
                  Export {exportFormat.toUpperCase()}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {/* Vehicle Summary */}
        <div className="flex items-center gap-4 p-4 bg-secondary/30 rounded-lg mb-6">
          <div className="p-3 rounded-xl bg-primary/10">
            <Car className="h-8 w-8 text-primary" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-lg">
              {vehicle.year} {vehicle.make} {vehicle.model}
            </h3>
            <p className="text-muted-foreground">
              {vehicle.plate} • {vehicle.color}
            </p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold">{mockServiceHistory.length}</p>
            <p className="text-sm text-muted-foreground">Total Services</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold">
              {formatCurrency(mockServiceHistory.reduce((sum, r) => sum + r.cost, 0))}
            </p>
            <p className="text-sm text-muted-foreground">Total Spent</p>
          </div>
        </div>

        {/* Service History Table */}
        <div className="space-y-4">
          <h4 className="font-medium flex items-center gap-2">
            <Wrench className="h-4 w-4 text-primary" />
            Service History
          </h4>
          <div className="space-y-3">
            {mockServiceHistory.map((record, i) => (
              <motion.div
                key={record.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="flex items-center gap-4 p-4 border border-border rounded-lg hover:bg-secondary/30 transition-colors"
              >
                <div className="p-2 rounded-lg bg-green-500/10">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{record.service}</p>
                    <Badge variant="secondary" className="text-xs">
                      {record.mechanic}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{record.description}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold">{formatCurrency(record.cost)}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    {new Date(record.date).toLocaleDateString()}
                  </div>
                  {record.mileage && (
                    <p className="text-xs text-muted-foreground">
                      {record.mileage.toLocaleString()} mi
                    </p>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
