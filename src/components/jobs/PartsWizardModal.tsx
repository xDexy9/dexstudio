import React, { useState } from 'react';
import {
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
  Package,
  Check,
  ChevronRight,
  ChevronLeft,
  ShoppingCart,
  Warehouse,
  LucideIcon,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';

interface PartsWizardModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete: (data: { partsNeeded: Array<{ categoryId: string; status: 'order' | 'in_stock' }> }) => void;
  existingParts?: Array<{ categoryId: string; status: 'order' | 'in_stock' }>;
}

const PART_CATEGORY_IDS = [
  'brakes',
  'fluids',
  'electrical',
  'air_system',
  'gauges',
  'transmission',
  'suspension',
  'body',
  'lighting',
  'cooling',
  'engine',
  'drivetrain',
  'audio',
  'wheels',
  'accessories',
] as const;

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

export function PartsWizardModal({
  open,
  onOpenChange,
  onComplete,
  existingParts = [],
}: PartsWizardModalProps) {
  const { t } = useLanguage();
  const [step, setStep] = useState(1);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [categoryStatuses, setCategoryStatuses] = useState<Record<string, 'order' | 'in_stock'>>({});

  const existingPartIds = existingParts.map(p => p.categoryId);

  const handleCategoryToggle = (categoryId: string) => {
    // Don't allow toggling parts that already exist
    if (existingPartIds.includes(categoryId)) return;

    setSelectedCategories((prev) =>
      prev.includes(categoryId)
        ? prev.filter((id) => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const handleComplete = () => {
    // Build the parts needed array with individual statuses
    const partsNeeded = selectedCategories.map(categoryId => ({
      categoryId,
      status: categoryStatuses[categoryId] || 'order' as 'order' | 'in_stock'
    }));

    // Reset state first
    setStep(1);
    setSelectedCategories([]);
    setCategoryStatuses({});

    // Call onComplete - parent will handle closing the modal after async operation
    onComplete({ partsNeeded });
  };

  const handleClose = (open: boolean) => {
    if (!open) {
      setStep(1);
      setSelectedCategories([]);
      setCategoryStatuses({});
    }
    onOpenChange(open);
  };

  const getCategoryLabel = (id: string) => {
    return t(`modal.parts.category.${id}`);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5 text-primary" />
            {t('modal.parts.title')}
          </DialogTitle>
          <DialogDescription>
            {step === 1 && t('modal.parts.step1')}
            {step === 2 && t('modal.parts.step2')}
            {step === 3 && t('modal.parts.step3')}
          </DialogDescription>
        </DialogHeader>

        {/* Progress Indicator */}
        <div className="flex items-center justify-center gap-2 py-2">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={cn(
                'h-2 w-16 rounded-full transition-colors',
                s <= step ? 'bg-primary' : 'bg-muted'
              )}
            />
          ))}
        </div>

        {/* Step 1: Category Selection */}
        {step === 1 && (
          <div className="py-4">
            {existingParts.length > 0 && (
              <p className="text-xs text-muted-foreground mb-3 text-center">
                {existingParts.length} {existingParts.length === 1 ? 'part' : 'parts'} already added (grayed out)
              </p>
            )}
            <div className="grid grid-cols-3 gap-2 sm:max-h-[400px] sm:overflow-y-auto pr-2">
              {PART_CATEGORY_IDS.map((id) => {
                const isSelected = selectedCategories.includes(id);
                const isAlreadyAdded = existingPartIds.includes(id);
                const Icon = CATEGORY_ICONS[id];
                return (
                  <div
                    key={id}
                    role="button"
                    tabIndex={isAlreadyAdded ? -1 : 0}
                    aria-disabled={isAlreadyAdded}
                    onPointerUp={(e) => {
                      e.preventDefault();
                      if (!isAlreadyAdded) handleCategoryToggle(id);
                    }}
                    className={cn(
                      'relative flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-all touch-manipulation select-none cursor-pointer',
                      isAlreadyAdded
                        ? 'border-border bg-muted/50 opacity-60 pointer-events-none'
                        : isSelected
                        ? 'border-primary bg-primary/10'
                        : 'border-border hover:border-primary/50 bg-card active:bg-muted'
                    )}
                  >
                    <div
                      className={cn(
                        'p-2 rounded-full transition-colors',
                        isAlreadyAdded
                          ? 'bg-muted'
                          : isSelected
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted'
                      )}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    <span className="text-xs font-medium text-center leading-tight">
                      {getCategoryLabel(id)}
                    </span>
                    {isAlreadyAdded && (
                      <Check className="h-4 w-4 text-green-600 absolute top-1 right-1" />
                    )}
                    {!isAlreadyAdded && isSelected && (
                      <Check className="h-4 w-4 text-primary absolute top-1 right-1" />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Step 2: Individual Stock Status */}
        {step === 2 && (
          <div className="py-4">
            <p className="text-sm text-muted-foreground mb-4 text-center">
              For each part category, select whether it needs to be ordered or is in stock
            </p>
            <div className="space-y-3 sm:max-h-[400px] sm:overflow-y-auto pr-2">
              {selectedCategories.map((categoryId) => {
                const Icon = CATEGORY_ICONS[categoryId];
                const currentStatus = categoryStatuses[categoryId];

                return (
                  <div
                    key={categoryId}
                    className="flex items-center justify-between p-4 rounded-lg border-2 border-border bg-card"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-full bg-primary/10">
                        <Icon className="h-5 w-5 text-primary" />
                      </div>
                      <span className="font-medium">{getCategoryLabel(categoryId)}</span>
                    </div>

                    <div className="flex gap-2">
                      <div
                        role="button"
                        tabIndex={0}
                        onPointerUp={(e) => {
                          e.preventDefault();
                          setCategoryStatuses(prev => ({ ...prev, [categoryId]: 'order' }));
                        }}
                        className={cn(
                          'flex items-center gap-2 px-4 py-2 rounded-lg border-2 transition-all touch-manipulation select-none cursor-pointer',
                          currentStatus === 'order'
                            ? 'border-amber-500 bg-amber-500/10 text-amber-700'
                            : 'border-border hover:border-amber-500/50 active:bg-amber-500/5'
                        )}
                      >
                        <ShoppingCart className="h-4 w-4" />
                        <span className="text-sm font-medium">Order</span>
                      </div>

                      <div
                        role="button"
                        tabIndex={0}
                        onPointerUp={(e) => {
                          e.preventDefault();
                          setCategoryStatuses(prev => ({ ...prev, [categoryId]: 'in_stock' }));
                        }}
                        className={cn(
                          'flex items-center gap-2 px-4 py-2 rounded-lg border-2 transition-all touch-manipulation select-none cursor-pointer',
                          currentStatus === 'in_stock'
                            ? 'border-green-500 bg-green-500/10 text-green-700'
                            : 'border-border hover:border-green-500/50 active:bg-green-500/5'
                        )}
                      >
                        <Warehouse className="h-4 w-4" />
                        <span className="text-sm font-medium">In Stock</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Step 3: Summary */}
        {step === 3 && (
          <div className="py-6 space-y-4">
            {/* Parts to Order */}
            {selectedCategories.filter(id => categoryStatuses[id] === 'order').length > 0 && (
              <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-4">
                <h4 className="font-medium mb-3 flex items-center gap-2 text-amber-700">
                  <ShoppingCart className="h-4 w-4" />
                  Parts to Order ({selectedCategories.filter(id => categoryStatuses[id] === 'order').length})
                </h4>
                <div className="flex flex-wrap gap-2">
                  {selectedCategories
                    .filter(id => categoryStatuses[id] === 'order')
                    .map((catId) => {
                      const Icon = CATEGORY_ICONS[catId];
                      if (!Icon) return null;
                      return (
                        <div
                          key={catId}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/10 text-amber-700 text-sm border border-amber-500/30"
                        >
                          <Icon className="h-3.5 w-3.5" />
                          {getCategoryLabel(catId)}
                        </div>
                      );
                    })}
                </div>
              </div>
            )}

            {/* Parts In Stock */}
            {selectedCategories.filter(id => categoryStatuses[id] === 'in_stock').length > 0 && (
              <div className="rounded-lg border border-green-500/30 bg-green-500/5 p-4">
                <h4 className="font-medium mb-3 flex items-center gap-2 text-green-700">
                  <Warehouse className="h-4 w-4" />
                  Parts In Stock ({selectedCategories.filter(id => categoryStatuses[id] === 'in_stock').length})
                </h4>
                <div className="flex flex-wrap gap-2">
                  {selectedCategories
                    .filter(id => categoryStatuses[id] === 'in_stock')
                    .map((catId) => {
                      const Icon = CATEGORY_ICONS[catId];
                      if (!Icon) return null;
                      return (
                        <div
                          key={catId}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-green-500/10 text-green-700 text-sm border border-green-500/30"
                        >
                          <Icon className="h-3.5 w-3.5" />
                          {getCategoryLabel(catId)}
                        </div>
                      );
                    })}
                </div>
              </div>
            )}

            <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 text-center">
              <Check className="h-8 w-8 text-primary mx-auto mb-2" />
              <p className="font-medium">{t('modal.parts.readyToSubmit')}</p>
              <p className="text-sm text-muted-foreground">
                Office will be notified about parts that need ordering
              </p>
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex justify-between pt-4 border-t">
          {step > 1 ? (
            <Button variant="outline" onClick={() => setStep(step - 1)}>
              <ChevronLeft className="h-4 w-4 mr-1" />
              {t('common.back')}
            </Button>
          ) : (
            <Button variant="outline" onClick={() => handleClose(false)}>
              {t('common.cancel')}
            </Button>
          )}

          {step < 3 ? (
            <Button
              onClick={() => setStep(step + 1)}
              disabled={
                (step === 1 && selectedCategories.length === 0) ||
                (step === 2 && selectedCategories.some(id => !categoryStatuses[id]))
              }
            >
              {t('common.next')}
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          ) : (
            <Button onClick={handleComplete}>
              <Check className="h-4 w-4 mr-1" />
              {t('modal.parts.submitRequest')}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
