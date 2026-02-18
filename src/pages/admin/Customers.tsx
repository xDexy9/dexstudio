import { useState } from 'react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { GlowingCard } from '@/components/effects/GlowingCard';
import { CustomerNotes } from '@/components/admin/CustomerNotes';
import { mockUsers } from '@/data/mockData';
import { motion } from 'framer-motion';
import { Users, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const customers = mockUsers.filter(u => u.role === 'customer');

const Customers = () => {
  const [selectedCustomer, setSelectedCustomer] = useState<string | null>(customers[0]?.id || null);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredCustomers = customers.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const currentCustomer = customers.find(c => c.id === selectedCustomer);

  return (
    <AdminLayout>
      <section className="p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Users className="h-8 w-8 text-primary" />
              Customers <span className="text-gradient">Manager</span>
            </h1>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search customers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 w-[250px]"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Customer List */}
            <div className="lg:col-span-1 space-y-4">
              <p className="text-sm text-muted-foreground">
                {filteredCustomers.length} customers
              </p>
              {filteredCustomers.map((c, i) => (
                <motion.div 
                  key={c.id} 
                  initial={{ opacity: 0, y: 20 }} 
                  animate={{ opacity: 1, y: 0 }} 
                  transition={{ delay: i * 0.05 }}
                >
                  <div
                    className={cn(
                      'p-4 rounded-lg border cursor-pointer transition-all',
                      selectedCustomer === c.id
                        ? 'border-primary bg-primary/5 shadow-glow'
                        : 'border-border hover:border-primary/50 bg-card'
                    )}
                    onClick={() => setSelectedCustomer(c.id)}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold shrink-0">
                        {c.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold truncate">{c.name}</p>
                        <p className="text-sm text-muted-foreground truncate">{c.email}</p>
                        <p className="text-sm text-muted-foreground">{c.phone}</p>
                      </div>
                      <Badge variant="secondary" className="shrink-0">
                        3 visits
                      </Badge>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Customer Details */}
            <div className="lg:col-span-2">
              {currentCustomer ? (
                <motion.div
                  key={currentCustomer.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="space-y-6"
                >
                  {/* Customer Header */}
                  <GlowingCard>
                    <div className="flex items-center gap-6">
                      <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center text-primary text-2xl font-bold">
                        {currentCustomer.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold">{currentCustomer.name}</h2>
                        <p className="text-muted-foreground">{currentCustomer.email}</p>
                        <p className="text-muted-foreground">{currentCustomer.phone}</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          Customer since {new Date(currentCustomer.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </GlowingCard>

                  {/* Customer Notes */}
                  <CustomerNotes
                    customerId={currentCustomer.id}
                    customerName={currentCustomer.name}
                  />
                </motion.div>
              ) : (
                <div className="flex items-center justify-center h-64 text-muted-foreground">
                  Select a customer to view details
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </AdminLayout>
  );
};

export default Customers;
