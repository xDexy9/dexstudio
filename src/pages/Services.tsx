import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  Droplet,
  Activity,
  CircleStop,
  Cog,
  Circle,
  Wrench,
  ChevronRight,
  Clock,
  DollarSign,
  Filter
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MainLayout } from '@/components/layout/MainLayout';
import { GlowingCard } from '@/components/effects/GlowingCard';
import { mockServices } from '@/data/mockData';
import type { ServiceCategory } from '@/types';

const serviceIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  'Droplet': Droplet,
  'Activity': Activity,
  'CircleStop': CircleStop,
  'Cog': Cog,
  'Circle': Circle,
  'Wrench': Wrench,
};

const Services = () => {
  const { t } = useTranslation();
  const [selectedCategory, setSelectedCategory] = useState<ServiceCategory | 'all'>('all');

  const categories: { value: ServiceCategory | 'all'; label: string }[] = [
    { value: 'all', label: t('services.allServices') },
    { value: 'oil-change', label: t('services.oilFluids') },
    { value: 'diagnostics', label: t('services.diagnostics') },
    { value: 'brakes', label: t('services.brakes') },
    { value: 'engine', label: t('services.engine') },
    { value: 'tires', label: t('services.tires') },
    { value: 'custom', label: t('services.custom') },
  ];

  const filteredServices = selectedCategory === 'all'
    ? mockServices
    : mockServices.filter(s => s.category === selectedCategory);

  return (
    <MainLayout>
      {/* Hero Section */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        <div className="absolute inset-0 radial-gradient" />
        
        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-3xl mx-auto text-center"
          >
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              {t('services.title')} <span className="text-gradient">{t('services.highlight')}</span>
            </h1>
            <p className="text-xl text-muted-foreground">
              {t('services.description')}
            </p>
          </motion.div>
        </div>
      </section>

      {/* Filter Section */}
      <section className="py-8 sticky top-20 z-40 bg-background/80 backdrop-blur-xl border-b border-border">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-4 overflow-x-auto pb-2">
            <Filter className="w-5 h-5 text-muted-foreground flex-shrink-0" />
            {categories.map((category) => (
              <motion.button
                key={category.value}
                onClick={() => setSelectedCategory(category.value)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                  selectedCategory === category.value
                    ? 'bg-primary text-primary-foreground shadow-glow'
                    : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                }`}
              >
                {category.label}
              </motion.button>
            ))}
          </div>
        </div>
      </section>

      {/* Services Grid */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <AnimatePresence mode="wait">
            <motion.div
              key={selectedCategory}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
            >
              {filteredServices.map((service, index) => {
                const Icon = serviceIcons[service.icon] || Wrench;
                const serviceNameKey = {
                  'Oil Change & Filter': 'serviceCards.oilChangeFilter',
                  'Engine Diagnostics': 'serviceCards.engineDiagnostics',
                  'Brake Service': 'serviceCards.brakeService',
                  'Engine Repair': 'serviceCards.engineRepair',
                  'Tire Services': 'serviceCards.tireServices',
                  'Custom Work': 'serviceCards.customWork',
                }[service.name] || service.name;
                
                const serviceDescKey = {
                  'Oil Change & Filter': 'serviceCards.oilChangeDesc',
                  'Engine Diagnostics': 'serviceCards.engineDiagnosticsDesc',
                  'Brake Service': 'serviceCards.brakeServiceDesc',
                  'Engine Repair': 'serviceCards.engineRepairDesc',
                  'Tire Services': 'serviceCards.tireServicesDesc',
                  'Custom Work': 'serviceCards.customWorkDesc',
                }[service.name] || service.description;

                const priceRange = service.priceRange === 'Contact for quote' 
                  ? t('serviceCards.contactForQuote') 
                  : service.priceRange;
                const estimatedTime = service.estimatedTime === 'Varies' 
                  ? t('serviceCards.varies') 
                  : service.estimatedTime;

                return (
                  <motion.div
                    key={service.id}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    layout
                  >
                    <GlowingCard className="h-full group">
                      <div className="flex flex-col h-full">
                        {/* Icon and Category */}
                        <div className="flex items-start justify-between mb-4">
                          <motion.div
                            whileHover={{ rotate: 360 }}
                            transition={{ duration: 0.5 }}
                            className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center"
                          >
                            <Icon className="w-8 h-8 text-primary" />
                          </motion.div>
                          <span className="text-xs px-3 py-1 rounded-full bg-secondary text-secondary-foreground capitalize">
                            {service.category.replace('-', ' ')}
                          </span>
                        </div>

                        {/* Title and Description */}
                        <h3 className="text-xl font-semibold mb-3 group-hover:text-primary transition-colors">
                          {t(serviceNameKey)}
                        </h3>
                        <p className="text-muted-foreground text-sm mb-6 flex-grow">
                          {t(serviceDescKey)}
                        </p>

                        {/* Meta Info */}
                        <div className="flex items-center gap-4 mb-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            <span>{estimatedTime}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <DollarSign className="w-4 h-4" />
                            <span>{priceRange}</span>
                          </div>
                        </div>

                        {/* CTA */}
                        <Link to="/portal/book" className="w-full">
                          <Button className="w-full btn-glow gap-2 text-primary-foreground">
                            {t('services.bookThisService')}
                            <ChevronRight className="w-4 h-4" />
                          </Button>
                        </Link>
                      </div>
                    </GlowingCard>
                  </motion.div>
                );
              })}
            </motion.div>
          </AnimatePresence>

          {filteredServices.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-20"
            >
              <p className="text-muted-foreground text-lg">
                {t('services.noServicesFound')}
              </p>
            </motion.div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-card/50">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="glass-card p-8 md:p-12 text-center max-w-3xl mx-auto"
          >
            <h2 className="text-2xl md:text-3xl font-bold mb-4">
              {t('services.needCustomQuote')} <span className="text-gradient">{t('services.customQuoteHighlight')}</span>
            </h2>
            <p className="text-muted-foreground mb-8">
              {t('services.customQuoteDesc')}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/contact">
                <Button className="btn-glow text-primary-foreground">{t('sections.contactUs')}</Button>
              </Link>
              <a href="tel:+15559876543">
                <Button variant="outline" className="btn-glow-outline">
                  Call (555) 987-6543
                </Button>
              </a>
            </div>
          </motion.div>
        </div>
      </section>
    </MainLayout>
  );
};

export default Services;
