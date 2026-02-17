import React from 'react';
import {
  CheckCircle,
  Clock,
  User,
  Car,
  FileText,
  Calendar,
  AlertTriangle,
  Package,
  ShoppingCart,
  Warehouse,
  Wrench,
  Phone,
  Mail,
  Gauge,
  Zap,
  Trophy,
  Timer,
  Disc,
  Droplets,
  Wind,
  Settings,
  Layers,
  Shield,
  Lightbulb,
  ThermometerSun,
  Cog,
  Radio,
  CircleDot,
  LucideIcon,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useLanguage } from '@/contexts/LanguageContext';
import { Job, Vehicle } from '@/lib/types';
import { getTranslatedProblemDescription } from '@/lib/jobTranslation';

interface JobCompletionSummaryProps {
  job: Job;
  vehicle: Vehicle | null;
  mechanic: any;
  creator: any;
  isMechanic?: boolean;
}

const CATEGORY_ICONS: Record<string, LucideIcon> = {
  brakes: Disc,
  fluids: Droplets,
  electrical: Zap,
  air_system: Wind,
  gauges: Gauge,
  transmission: Settings,
  suspension: Layers,
  body: Shield,
  lighting: Lightbulb,
  cooling: ThermometerSun,
  engine: Wrench,
  drivetrain: Cog,
  audio: Radio,
  wheels: CircleDot,
  accessories: Package,
};

const calculateDuration = (assignedAt?: string, completedAt?: string): string => {
  if (!assignedAt || !completedAt) return 'N/A';

  const start = new Date(assignedAt);
  const end = new Date(completedAt);
  const diffMs = end.getTime() - start.getTime();

  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
};

const formatDate = (dateString?: string): string => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${day}/${month}/${year} ${hours}:${minutes}`;
};

export function JobCompletionSummary({ job, vehicle, mechanic, creator, isMechanic = false }: JobCompletionSummaryProps) {
  const { t, language } = useLanguage();

  const duration = calculateDuration(job.assignedAt, job.completedAt);

  const getCategoryLabel = (id: string) => {
    return t(`modal.parts.category.${id}`);
  };

  const partsToOrder = job.partsNeeded?.filter(part => part.status === 'order') || [];
  const partsInStock = job.partsNeeded?.filter(part => part.status === 'in_stock') || [];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Premium Completion Header */}
      <Card className="glass-strong border-0 overflow-hidden relative">
        <div className="absolute inset-0 gradient-gold-radial opacity-10 pointer-events-none" />
        <div className="absolute top-0 left-0 right-0 h-1 gradient-gold" />
        <CardContent className="pt-8 pb-6 relative">
          <div className="text-center">
            <div className="w-20 h-20 flex items-center justify-center mx-auto mb-4 animate-scale-in">
              <img
                src="/celebration.gif"
                alt={t('jobDetail.celebration')}
                className="w-20 h-20 object-contain"
              />
            </div>
            <h2 className="text-3xl font-bold text-gradient-gold mb-2">{t('jobs.completed.title')}</h2>
            <p className="text-muted-foreground">
              {t('jobs.completed.subtitle')}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
