import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Database, CheckCircle, AlertCircle, ArrowLeft, Package, Wrench } from 'lucide-react';
import { store, genId, persistStore } from '@/lib/mockStore';

const problemDescriptions = [
  "Oil change needed, engine making unusual noise",
  "Brake pads worn out, squeaking sound when braking",
  "Check engine light is on, car losing power",
  "Air conditioning not working, no cold air",
  "Tire rotation and alignment needed",
  "Battery not holding charge, car won't start",
  "Transmission slipping, gear changes rough",
  "Coolant leak under the car",
  "Windshield wipers not working properly",
  "Headlight bulb replacement needed",
];

const customerNames = [
  "John Smith", "Maria Silva", "Ahmed Hassan", "Sophie Martin",
  "Carlos Rodriguez", "Emma Wilson", "Liu Wei", "Anna Kowalski",
];

const customerPhones = [
  "+33 6 12 34 56 78", "+33 6 23 45 67 89", "+33 6 34 56 78 90",
  "+33 6 45 67 89 01", "+33 6 56 78 90 12",
];

const statuses: any[] = ['not_started', 'in_progress', 'waiting_for_parts', 'completed'];
const priorities: any[] = ['low', 'normal', 'urgent'];
const serviceTypes: any[] = ['repair', 'maintenance', 'inspection', 'diagnostic'];

function rand<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }
function randDate(daysAgo: number): string {
  const d = new Date();
  d.setDate(d.getDate() - Math.floor(Math.random() * daysAgo));
  return d.toISOString();
}

export default function GenerateMockDataPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string; details?: any } | null>(null);

  const generateMockJobs = async () => {
    if (!user) { setResult({ success: false, message: 'You must be logged in' }); return; }
    setIsGenerating(true);
    setResult(null);

    try {
      const vehicles = store.vehicles;
      const mechanics = store.users.filter(u => u.role === 'mechanic');

      if (vehicles.length === 0) {
        setResult({ success: false, message: 'No vehicles found. The demo store should have vehicles pre-loaded.' });
        setIsGenerating(false);
        return;
      }

      const statusCounts: Record<string, number> = {};
      const priorityCounts: Record<string, number> = {};
      let created = 0;

      for (let i = 0; i < 10; i++) {
        const vehicle = rand(vehicles);
        const status = rand(statuses);
        const priority = rand(priorities);
        const createdAt = randDate(30);

        const jobNumber = Math.random().toString(36).substr(2, 6).toUpperCase();
        store.jobs.unshift({
          id: genId(), jobNumber,
          vehicleId: vehicle.id,
          vehicleLicensePlate: vehicle.licensePlate,
          vehicleBrand: vehicle.brand,
          vehicleModel: vehicle.model,
          vehicleYear: vehicle.year,
          vehicleFuelType: vehicle.fuelType,
          vehicleMileage: vehicle.mileage,
          customerId: vehicle.customerId,
          customerName: rand(customerNames),
          customerPhone: rand(customerPhones),
          problemDescription: rand(problemDescriptions),
          problemDescriptionLanguage: 'en',
          priority, serviceType: rand(serviceTypes), status,
          assignedMechanicId: (status !== 'not_started' && mechanics.length > 0) ? rand(mechanics).id : undefined,
          estimatedDuration: rand([60, 90, 120, 180, 240]),
          createdBy: user.id, createdAt, updatedAt: createdAt,
          version: 1,
          ...(status === 'completed' ? { completedAt: createdAt } : {}),
        } as any);

        statusCounts[status] = (statusCounts[status] || 0) + 1;
        priorityCounts[priority] = (priorityCounts[priority] || 0) + 1;
        created++;
      }

      persistStore();
      setResult({
        success: true,
        message: `Successfully created ${created} mock jobs!`,
        details: { statusCounts, priorityCounts, total: created },
      });
    } catch (error: any) {
      setResult({ success: false, message: error.message || 'Failed to generate jobs' });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="container mx-auto p-8 max-w-4xl">
      <Button variant="ghost" className="mb-6" onClick={() => navigate('/dashboard')}>
        <ArrowLeft className="h-4 w-4 mr-2" /> Back to Dashboard
      </Button>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <Database className="h-6 w-6 text-primary" />
            </div>
            <div>
              <CardTitle>Generate Mock Data</CardTitle>
              <CardDescription>Create sample jobs for testing and demonstration</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <h3 className="font-semibold">What this will do:</h3>
            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
              <li>Create 10 mock jobs using existing demo vehicles</li>
              <li>Distribute jobs across different statuses and priorities</li>
              <li>Assign mechanics to in-progress jobs</li>
            </ul>
          </div>

          {result && (
            <Alert variant={result.success ? 'default' : 'destructive'}>
              {result.success ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
              <AlertDescription>
                <div className="space-y-2">
                  <p>{result.message}</p>
                  {result.details && (
                    <div className="text-sm space-y-1">
                      <p className="font-semibold">Status distribution:</p>
                      {Object.entries(result.details.statusCounts).map(([status, count]) => (
                        <p key={status} className="ml-4">{status}: {count as number}</p>
                      ))}
                    </div>
                  )}
                </div>
              </AlertDescription>
            </Alert>
          )}

          <div className="flex gap-3">
            <Button onClick={generateMockJobs} disabled={isGenerating} className="flex-1">
              {isGenerating ? 'Generating...' : 'Generate Mock Jobs'}
            </Button>
            {result?.success && (
              <Button onClick={() => navigate('/jobs')} variant="outline">View Jobs</Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
