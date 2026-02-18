import { AdminLayout } from '@/components/layout/AdminLayout';
import { ServiceReminders } from '@/components/admin/ServiceReminders';

const Reminders = () => (
  <AdminLayout>
    <section className="p-8">
      <div className="max-w-7xl mx-auto">
        <ServiceReminders />
      </div>
    </section>
  </AdminLayout>
);

export default Reminders;
