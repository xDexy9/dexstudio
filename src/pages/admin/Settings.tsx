import { AdminLayout } from '@/components/layout/AdminLayout';
import { GlowingCard } from '@/components/effects/GlowingCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { mockBusinessHours } from '@/data/mockData';

const Settings = () => (
  <AdminLayout>
    <section className="p-8">
      <div className="max-w-2xl">
        <h1 className="text-3xl font-bold mb-8">Admin <span className="text-gradient">Settings</span></h1>
        
        <GlowingCard hover={false} className="mb-6">
          <h2 className="text-xl font-semibold mb-4">Business Information</h2>
          <div className="space-y-4">
            <div className="space-y-2"><Label>Business Name</Label><Input defaultValue="Joe Service" className="bg-secondary/50" /></div>
            <div className="space-y-2"><Label>Phone</Label><Input defaultValue="(555) 987-6543" className="bg-secondary/50" /></div>
            <div className="space-y-2"><Label>Email</Label><Input defaultValue="info@joeservice.com" className="bg-secondary/50" /></div>
          </div>
        </GlowingCard>

        <GlowingCard hover={false}>
          <h2 className="text-xl font-semibold mb-4">Business Hours</h2>
          <div className="space-y-3">
            {mockBusinessHours.map(h => (
              <div key={h.day} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                <span className="font-medium">{h.day}</span>
                <span className="text-muted-foreground">{h.isClosed ? 'Closed' : `${h.open} - ${h.close}`}</span>
              </div>
            ))}
          </div>
          <Button className="w-full mt-4 btn-glow text-primary-foreground">Save Changes</Button>
        </GlowingCard>
      </div>
    </section>
  </AdminLayout>
);

export default Settings;
