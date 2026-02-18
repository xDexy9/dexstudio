import { AdminLayout } from '@/components/layout/AdminLayout';
import { LocationManager } from '@/components/admin/LocationManager';

const Locations = () => (
  <AdminLayout>
    <section className="p-8">
      <div className="max-w-7xl mx-auto">
        <LocationManager />
      </div>
    </section>
  </AdminLayout>
);

export default Locations;
