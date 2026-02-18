import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  Phone, 
  Calendar, 
  Star, 
  Car, 
  Clock, 
  Shield,
  ChevronRight,
  Droplet,
  Activity,
  CircleStop,
  Cog,
  Circle,
  Wrench
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MainLayout } from '@/components/layout/MainLayout';
import { ParticleField } from '@/components/effects/ParticleField';
import { TypewriterText } from '@/components/effects/TypewriterText';
import { AnimatedCounter } from '@/components/effects/AnimatedCounter';
import { GlowingCard } from '@/components/effects/GlowingCard';
import { mockServices, mockTestimonials } from '@/data/mockData';
import logo from '@/assets/logo.png';

const serviceIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  'Droplet': Droplet,
  'Activity': Activity,
  'CircleStop': CircleStop,
  'Cog': Cog,
  'Circle': Circle,
  'Wrench': Wrench,
};

const Index = () => {
  const { t } = useTranslation();

  const stats = [
    { value: 25, suffix: '+', label: t('stats.yearsExperience') },
    { value: 15000, suffix: '+', label: t('stats.carsServiced') },
    { value: 4.9, suffix: '', label: t('stats.averageRating'), isDecimal: true },
    { value: 100, suffix: '%', label: t('stats.satisfactionRate') },
  ];

  const trustBadges = [
    { icon: Shield, label: t('trustBadges.aseCertified') },
    { icon: Clock, label: t('trustBadges.sameDayService') },
    { icon: Car, label: t('trustBadges.allMakesModels') },
    { icon: Star, label: t('trustBadges.fiveStarRated') },
  ];

  const typewriterTexts = [
    t('hero.services.engineDiagnostics'),
    t('hero.services.brakeService'),
    t('hero.services.oilChanges'),
    t('hero.services.customWork'),
    t('hero.services.tireServices'),
  ];

  return (
    <MainLayout>
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
        {/* Professional gradient background */}
        <div className="absolute inset-0 bg-gradient-to-b from-secondary/30 via-background to-background" />
        <div 
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[1200px] h-[800px] rounded-full blur-[120px] opacity-50"
          style={{ background: 'radial-gradient(circle, hsl(200 100% 50% / 0.15) 0%, hsl(220 100% 30% / 0.1) 50%, transparent 70%)' }}
        />
        <ParticleField count={30} />
        
        {/* Subtle animated car silhouettes */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <motion.div
            className="absolute bottom-20 -left-20 w-40 h-20 opacity-5"
            animate={{ x: ['0%', '400%'] }}
            transition={{ duration: 25, repeat: Infinity, ease: 'linear' }}
          >
            <Car className="w-full h-full text-foreground" />
          </motion.div>
          <motion.div
            className="absolute top-1/3 -right-20 w-32 h-16 opacity-[0.03]"
            animate={{ x: ['0%', '-500%'] }}
            transition={{ duration: 30, repeat: Infinity, ease: 'linear', delay: 5 }}
          >
            <Car className="w-full h-full text-foreground" />
          </motion.div>
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            {/* Logo animation */}
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ duration: 0.8, type: 'spring', bounce: 0.4 }}
              className="mb-8 inline-block"
            >
              <div className="relative">
                <img src={logo} alt="Joe Service" className="h-[10.5rem] w-auto" />
                <div className="absolute inset-0 rounded-2xl bg-white/10 blur-2xl" />
              </div>
            </motion.div>

            {/* Main heading */}
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            className="text-5xl md:text-7xl font-bold mb-6 text-white"
            >
              {t('hero.welcome')}
            </motion.h1>

            {/* Animated tagline */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="text-xl md:text-2xl text-white/70 mb-8"
            >
              {t('hero.specialize')}{' '}
              <TypewriterText
                texts={typewriterTexts}
                className="text-accent font-semibold"
              />
            </motion.div>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.7 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4"
            >
              <Link to="/portal/book">
                <Button className="btn-glow text-lg px-8 py-6 gap-2 text-primary-foreground">
                  <Calendar className="w-5 h-5" />
                  {t('hero.bookAppointment')}
                </Button>
              </Link>
              <a href="tel:+15559876543">
                <Button variant="outline" className="btn-glow-outline text-lg px-8 py-6 gap-2">
                  <Phone className="w-5 h-5" />
                  {t('nav.callNow')}
                </Button>
              </a>
            </motion.div>

            {/* Trust badges */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.9 }}
              className="mt-16 flex flex-wrap items-center justify-center gap-8"
            >
              {trustBadges.map((badge) => (
                <motion.div
                  key={badge.label}
                  whileHover={{ scale: 1.1, y: -5 }}
                  className="flex items-center gap-2 text-white/60"
                >
                  <badge.icon className="w-5 h-5 text-accent" />
                  <span className="text-sm">{badge.label}</span>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
        >
          <motion.div
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="w-6 h-10 rounded-full border-2 border-muted-foreground/30 flex items-start justify-center pt-2"
          >
            <div className="w-1 h-2 rounded-full bg-primary" />
          </motion.div>
        </motion.div>
      </section>

      {/* Stats Section */}
      <section className="py-20 relative">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="text-center"
              >
                <div className="text-4xl md:text-5xl font-bold text-white mb-2">
                  {stat.isDecimal ? (
                    <span>{stat.value}{stat.suffix}</span>
                  ) : (
                    <AnimatedCounter target={stat.value} suffix={stat.suffix} />
                  )}
                </div>
                <div className="text-white/60 text-sm">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-20 relative">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-white">
              {t('sections.ourServices')} <span className="text-accent">{t('sections.servicesHighlight')}</span>
            </h2>
            <p className="text-white/60 max-w-2xl mx-auto">
              {t('sections.servicesDescription')}
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {mockServices.map((service, index) => {
              const Icon = serviceIcons[service.icon] || Wrench;
              return (
                <motion.div
                  key={service.id}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <GlowingCard className="h-full">
                    <div className="flex flex-col h-full">
                      <div className="w-14 h-14 rounded-xl bg-accent/20 flex items-center justify-center mb-4">
                        <Icon className="w-7 h-7 text-accent" />
                      </div>
                      <h3 className="text-xl font-semibold mb-2 text-white">{service.name}</h3>
                      <p className="text-white/60 text-sm mb-4 flex-grow">
                        {service.description}
                      </p>
                      <div className="flex items-center justify-between pt-4 border-t border-white/10">
                        <span className="text-accent font-semibold">{service.priceRange}</span>
                        <Link to="/portal/book">
                          <Button variant="ghost" size="sm" className="gap-1 text-white hover:text-accent">
                            {t('sections.bookNow')}
                            <ChevronRight className="w-4 h-4" />
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </GlowingCard>
                </motion.div>
              );
            })}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mt-12"
          >
            <Link to="/services">
              <Button variant="outline" className="btn-glow-outline gap-2">
                {t('sections.viewAllServices')}
                <ChevronRight className="w-4 h-4" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 relative bg-secondary/20">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-white">
              {t('sections.whatCustomersSay')} <span className="text-accent">{t('sections.customersSayHighlight')}</span>
            </h2>
            <p className="text-white/60 max-w-2xl mx-auto">
              {t('sections.customersDescription')}
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {mockTestimonials.map((testimonial, index) => (
              <motion.div
                key={testimonial.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <GlowingCard className="h-full">
                  <div className="flex flex-col h-full">
                    <div className="flex items-center gap-4 mb-4">
                      <img
                        src={testimonial.avatar}
                        alt={testimonial.customerName}
                        className="w-12 h-12 rounded-full object-cover ring-2 ring-accent/30"
                      />
                      <div>
                        <h4 className="font-semibold text-white">{testimonial.customerName}</h4>
                        <p className="text-white/50 text-sm">{testimonial.service}</p>
                      </div>
                    </div>
                    <div className="flex gap-1 mb-4">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={`w-4 h-4 ${
                            i < testimonial.rating
                              ? 'text-warning fill-warning'
                              : 'text-white/20'
                          }`}
                        />
                      ))}
                    </div>
                    <p className="text-white/70 text-sm flex-grow">
                      "{testimonial.content}"
                    </p>
                  </div>
                </GlowingCard>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-accent/5 to-transparent" />
        <ParticleField count={20} />
        
        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="glass-card p-12 md:p-16 text-center max-w-4xl mx-auto"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-white">
              {t('sections.readyToGet')} <span className="text-accent">{t('sections.servicedHighlight')}</span>
            </h2>
            <p className="text-white/60 mb-8 max-w-2xl mx-auto">
              {t('sections.readyDescription')}
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/portal/book">
                <Button className="btn-glow text-lg px-8 py-6 gap-2">
                  <Calendar className="w-5 h-5" />
                  {t('hero.bookAppointment')}
                </Button>
              </Link>
              <Link to="/contact">
                <Button variant="outline" className="btn-glow-outline text-lg px-8 py-6">
                  {t('sections.contactUs')}
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </MainLayout>
  );
};

export default Index;
