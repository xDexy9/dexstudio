import { AdminLayout } from '@/components/layout/AdminLayout';
import { PaymentCenter } from '@/components/admin/PaymentCenter';

const Billing = () => (
  <AdminLayout>
    <section className="p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Billing & <span className="text-gradient">Invoices</span></h1>
        <PaymentCenter />
      </div>
    </section>
  </AdminLayout>
);

export default Billing;
