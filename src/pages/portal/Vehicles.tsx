import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { GlowingCard } from '@/components/effects/GlowingCard';
import { VehicleHistoryPDF } from '@/components/portal/VehicleHistoryPDF';
import { Button } from '@/components/ui/button';
import { Plus, Car, FileText } from 'lucide-react';
import { mockVehicles } from '@/data/mockData';
import { motion } from 'framer-motion';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

const Vehicles = () => {
  const [selectedVehicle, setSelectedVehicle] = useState<typeof mockVehicles[0] | null>(null);

  return (
    <MainLayout>
      <section className="pt-32 pb-20">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold">My <span className="text-gradient">Vehicles</span></h1>
              <p className="text-muted-foreground">Manage your registered vehicles</p>
            </div>
            <Button className="btn-glow gap-2 text-primary-foreground">
              <Plus className="w-4 h-4" />Add Vehicle
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {mockVehicles.slice(0, 2).map((v, i) => (
              <motion.div key={v.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
                <GlowingCard>
                  <div className="w-16 h-16 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                    <Car className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold">{v.year} {v.make} {v.model}</h3>
                  <p className="text-muted-foreground">{v.plate} • {v.color}</p>
                  <div className="mt-4 flex gap-2">
                    <Button variant="outline" size="sm">Edit</Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setSelectedVehicle(v)}
                    >
                      <FileText className="w-4 h-4 mr-1" />
                      History
                    </Button>
                    <Button variant="ghost" size="sm" className="text-destructive">Remove</Button>
                  </div>
                </GlowingCard>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Vehicle History Dialog */}
      <Dialog open={!!selectedVehicle} onOpenChange={() => setSelectedVehicle(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Vehicle Service History
            </DialogTitle>
          </DialogHeader>
          {selectedVehicle && (
            <VehicleHistoryPDF vehicle={selectedVehicle} />
          )}
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
};

export default Vehicles;
