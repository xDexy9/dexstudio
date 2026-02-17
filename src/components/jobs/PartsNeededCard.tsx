import React from 'react';
import {
  Package,
  ShoppingCart,
  Warehouse,
  Disc,
  Droplets,
  Zap,
  Wind,
  Gauge,
  Settings,
  Layers,
  Shield,
  Lightbulb,
  ThermometerSun,
  Wrench,
  Cog,
  Radio,
  CircleDot,
  LucideIcon,
  Plus,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';

interface PartsNeededCardProps {
  partsNeeded: Array<{ categoryId: string; status: 'order' | 'in_stock' }>;
  onAddMoreParts?: () => void;
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

export function PartsNeededCard({ partsNeeded, onAddMoreParts }: PartsNeededCardProps) {
  const { t } = useLanguage();

  const getCategoryLabel = (id: string) => {
    return t(`modal.parts.category.${id}`);
  };

  // Group parts by status
  const partsToOrder = partsNeeded.filter(part => part.status === 'order');
  const partsInStock = partsNeeded.filter(part => part.status === 'in_stock');

  return (
    <Card className="glass-strong border-0 shadow-premium-lg overflow-hidden">
      <div className="absolute inset-0 gradient-royal-radial opacity-5 pointer-events-none" />
      <CardHeader className="pb-3 relative border-b border-border/30">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2 font-semibold">
            <div className="p-2 rounded-lg bg-amber-500/10">
              <Package className="h-5 w-5 text-amber-500" />
            </div>
            {t('modal.parts.title')} ({partsNeeded.length})
          </CardTitle>
          {onAddMoreParts && (
            <Button
              variant="outline"
              size="sm"
              onClick={onAddMoreParts}
              className="relative z-10 h-8 text-xs"
            >
              <Plus className="h-4 w-4 mr-1" />
              Add More
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4 pt-4 relative">
        {/* Parts to Order */}
        {partsToOrder.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 rounded-xl border-2 border-amber-500/30 bg-amber-500/5">
              <div className="p-2 rounded-full bg-amber-500/10">
                <ShoppingCart className="h-5 w-5 text-amber-500" />
              </div>
              <div>
                <p className="font-semibold text-sm text-amber-700">{t('modal.parts.orderRequired')}</p>
                <p className="text-xs text-amber-600">{partsToOrder.length} {partsToOrder.length === 1 ? 'part' : 'parts'} need ordering</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {partsToOrder.map((part) => {
                const Icon = CATEGORY_ICONS[part.categoryId] || Package;
                return (
                  <div
                    key={part.categoryId}
                    className="flex flex-col items-center gap-2 p-3 rounded-lg border-2 border-amber-500/30 bg-amber-500/5"
                  >
                    <div className="p-2 rounded-full bg-amber-500/10">
                      <Icon className="h-4 w-4 text-amber-600" />
                    </div>
                    <span className="text-xs font-medium text-center leading-tight text-amber-700">
                      {getCategoryLabel(part.categoryId)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Parts In Stock */}
        {partsInStock.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 rounded-xl border-2 border-green-500/30 bg-green-500/5">
              <div className="p-2 rounded-full bg-green-500/10">
                <Warehouse className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="font-semibold text-sm text-green-700">{t('modal.parts.inStock')}</p>
                <p className="text-xs text-green-600">{partsInStock.length} {partsInStock.length === 1 ? 'part is' : 'parts are'} available</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {partsInStock.map((part) => {
                const Icon = CATEGORY_ICONS[part.categoryId] || Package;
                return (
                  <div
                    key={part.categoryId}
                    className="flex flex-col items-center gap-2 p-3 rounded-lg border-2 border-green-500/30 bg-green-500/5"
                  >
                    <div className="p-2 rounded-full bg-green-500/10">
                      <Icon className="h-4 w-4 text-green-600" />
                    </div>
                    <span className="text-xs font-medium text-center leading-tight text-green-700">
                      {getCategoryLabel(part.categoryId)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
