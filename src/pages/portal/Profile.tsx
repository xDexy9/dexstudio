import { MainLayout } from '@/components/layout/MainLayout';
import { GlowingCard } from '@/components/effects/GlowingCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { mockUsers } from '@/data/mockData';

const user = mockUsers[0];

const Profile = () => (
  <MainLayout>
    <section className="pt-32 pb-20">
      <div className="container mx-auto px-4 max-w-2xl">
        <h1 className="text-3xl font-bold mb-8">Profile <span className="text-gradient">Settings</span></h1>
        <GlowingCard hover={false}>
          <form className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>First Name</Label><Input defaultValue={user.name.split(' ')[0]} className="bg-secondary/50" /></div>
              <div className="space-y-2"><Label>Last Name</Label><Input defaultValue={user.name.split(' ')[1]} className="bg-secondary/50" /></div>
            </div>
            <div className="space-y-2"><Label>Email</Label><Input type="email" defaultValue={user.email} className="bg-secondary/50" /></div>
            <div className="space-y-2"><Label>Phone</Label><Input type="tel" defaultValue={user.phone} className="bg-secondary/50" /></div>
            
            <div className="pt-4 border-t border-border">
              <h3 className="font-semibold mb-4">Notification Preferences</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between"><Label>Email Notifications</Label><Switch defaultChecked={user.notificationPreferences.email} /></div>
                <div className="flex items-center justify-between"><Label>SMS Notifications</Label><Switch defaultChecked={user.notificationPreferences.sms} /></div>
                <div className="flex items-center justify-between"><Label>Phone Calls</Label><Switch defaultChecked={user.notificationPreferences.call} /></div>
              </div>
            </div>
            <Button type="submit" className="w-full btn-glow text-primary-foreground">Save Changes</Button>
          </form>
        </GlowingCard>
      </div>
    </section>
  </MainLayout>
);

export default Profile;
