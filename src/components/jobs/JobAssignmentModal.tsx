import React, { useState, useEffect } from 'react';
import { 
  Car, User, Phone, AlertTriangle, Wrench, Calendar, Gauge, 
  Lightbulb, CheckCircle, AlertCircle, Loader2, Sparkles,
  ChevronDown, ChevronUp
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { Job, Vehicle } from '@/lib/types';
import { getTranslatedProblemDescription } from '@/lib/jobTranslation';
import { cn } from '@/lib/utils';
import { CarBrandLogo } from '@/components/ui/car-brand-logo';

interface RepairSuggestions {
  possibleCauses: string[];
  suggestedActions: string[];
  estimatedDifficulty: 'easy' | 'medium' | 'hard';
  warningNotes?: string;
}

// Translated suggestion data per language
const suggestionsByLanguage: Record<string, {
  brake: RepairSuggestions;
  engine: RepairSuggestions;
  oil: RepairSuggestions;
  default: RepairSuggestions;
}> = {
  en: {
    brake: {
      possibleCauses: ['Worn brake pads or discs', 'Brake fluid leak or low level', 'Stuck brake caliper'],
      suggestedActions: ['Inspect brake pad thickness', 'Check brake fluid level and condition', 'Test caliper movement'],
      estimatedDifficulty: 'medium',
      warningNotes: 'Ensure vehicle is safely supported before inspection',
    },
    engine: {
      possibleCauses: ['Battery or charging system issue', 'Fuel delivery problem', 'Ignition system fault'],
      suggestedActions: ['Test battery voltage', 'Check fuel pump operation', 'Scan for diagnostic trouble codes'],
      estimatedDifficulty: 'medium',
    },
    oil: {
      possibleCauses: ['Oil leak from gasket or seal', 'Oil consumption issue', 'Oil filter or drain plug problem'],
      suggestedActions: ['Inspect for visible leaks', 'Check oil level and condition', 'Examine oil filter and drain plug'],
      estimatedDifficulty: 'easy',
    },
    default: {
      possibleCauses: ['Multiple potential causes - diagnosis required', 'Component wear or damage', 'Electrical or sensor issue'],
      suggestedActions: ['Perform visual inspection', 'Run diagnostic scan', 'Test drive to verify symptoms'],
      estimatedDifficulty: 'medium',
    },
  },
  fr: {
    brake: {
      possibleCauses: ['Plaquettes ou disques de frein usés', 'Fuite ou niveau bas de liquide de frein', 'Étrier de frein bloqué'],
      suggestedActions: ['Inspecter l\'épaisseur des plaquettes', 'Vérifier le niveau et l\'état du liquide de frein', 'Tester le mouvement de l\'étrier'],
      estimatedDifficulty: 'medium',
      warningNotes: 'Assurez-vous que le véhicule est correctement supporté avant l\'inspection',
    },
    engine: {
      possibleCauses: ['Problème de batterie ou système de charge', 'Problème d\'alimentation en carburant', 'Défaut du système d\'allumage'],
      suggestedActions: ['Tester la tension de la batterie', 'Vérifier le fonctionnement de la pompe à carburant', 'Scanner les codes de défaut'],
      estimatedDifficulty: 'medium',
    },
    oil: {
      possibleCauses: ['Fuite d\'huile au niveau du joint', 'Consommation excessive d\'huile', 'Problème de filtre ou bouchon de vidange'],
      suggestedActions: ['Inspecter les fuites visibles', 'Vérifier le niveau et l\'état de l\'huile', 'Examiner le filtre à huile et le bouchon de vidange'],
      estimatedDifficulty: 'easy',
    },
    default: {
      possibleCauses: ['Causes multiples possibles - diagnostic requis', 'Usure ou dommage de composant', 'Problème électrique ou capteur'],
      suggestedActions: ['Effectuer une inspection visuelle', 'Lancer un diagnostic électronique', 'Essai routier pour vérifier les symptômes'],
      estimatedDifficulty: 'medium',
    },
  },
  ro: {
    brake: {
      possibleCauses: ['Plăcuțe sau discuri de frână uzate', 'Scurgere sau nivel scăzut de lichid de frână', 'Etrier de frână blocat'],
      suggestedActions: ['Inspectați grosimea plăcuțelor', 'Verificați nivelul și starea lichidului de frână', 'Testați mișcarea etrierului'],
      estimatedDifficulty: 'medium',
      warningNotes: 'Asigurați-vă că vehiculul este susținut în siguranță înainte de inspecție',
    },
    engine: {
      possibleCauses: ['Problemă baterie sau sistem de încărcare', 'Problemă alimentare combustibil', 'Defecțiune sistem aprindere'],
      suggestedActions: ['Testați tensiunea bateriei', 'Verificați funcționarea pompei de combustibil', 'Scanați codurile de eroare'],
      estimatedDifficulty: 'medium',
    },
    oil: {
      possibleCauses: ['Scurgere ulei de la garnitură', 'Consum excesiv de ulei', 'Problemă filtru sau bușon de golire'],
      suggestedActions: ['Inspectați scurgerile vizibile', 'Verificați nivelul și starea uleiului', 'Examinați filtrul de ulei și bușonul'],
      estimatedDifficulty: 'easy',
    },
    default: {
      possibleCauses: ['Cauze multiple posibile - diagnostic necesar', 'Uzură sau deteriorare componentă', 'Problemă electrică sau senzor'],
      suggestedActions: ['Efectuați o inspecție vizuală', 'Rulați diagnosticul electronic', 'Test de drum pentru verificarea simptomelor'],
      estimatedDifficulty: 'medium',
    },
  },
  pt: {
    brake: {
      possibleCauses: ['Pastilhas ou discos de travão gastos', 'Vazamento ou nível baixo de líquido de travão', 'Pinça de travão presa'],
      suggestedActions: ['Inspecionar espessura das pastilhas', 'Verificar nível e condição do líquido de travão', 'Testar movimento da pinça'],
      estimatedDifficulty: 'medium',
      warningNotes: 'Certifique-se de que o veículo está apoiado com segurança antes da inspeção',
    },
    engine: {
      possibleCauses: ['Problema de bateria ou sistema de carga', 'Problema de fornecimento de combustível', 'Falha no sistema de ignição'],
      suggestedActions: ['Testar tensão da bateria', 'Verificar funcionamento da bomba de combustível', 'Escanear códigos de diagnóstico'],
      estimatedDifficulty: 'medium',
    },
    oil: {
      possibleCauses: ['Vazamento de óleo pela junta', 'Consumo excessivo de óleo', 'Problema no filtro ou tampão de drenagem'],
      suggestedActions: ['Inspecionar vazamentos visíveis', 'Verificar nível e condição do óleo', 'Examinar filtro de óleo e tampão'],
      estimatedDifficulty: 'easy',
    },
    default: {
      possibleCauses: ['Múltiplas causas possíveis - diagnóstico necessário', 'Desgaste ou dano de componente', 'Problema elétrico ou sensor'],
      suggestedActions: ['Realizar inspeção visual', 'Executar diagnóstico eletrônico', 'Test drive para verificar sintomas'],
      estimatedDifficulty: 'medium',
    },
  },
  ru: {
    brake: {
      possibleCauses: ['Изношенные тормозные колодки или диски', 'Утечка или низкий уровень тормозной жидкости', 'Заклинивший тормозной суппорт'],
      suggestedActions: ['Проверить толщину тормозных колодок', 'Проверить уровень и состояние тормозной жидкости', 'Проверить движение суппорта'],
      estimatedDifficulty: 'medium',
      warningNotes: 'Убедитесь, что автомобиль надёжно закреплён перед осмотром',
    },
    engine: {
      possibleCauses: ['Проблема аккумулятора или системы зарядки', 'Проблема подачи топлива', 'Неисправность системы зажигания'],
      suggestedActions: ['Проверить напряжение аккумулятора', 'Проверить работу топливного насоса', 'Сканировать коды неисправностей'],
      estimatedDifficulty: 'medium',
    },
    oil: {
      possibleCauses: ['Утечка масла через прокладку', 'Чрезмерный расход масла', 'Проблема масляного фильтра или сливной пробки'],
      suggestedActions: ['Осмотреть видимые утечки', 'Проверить уровень и состояние масла', 'Осмотреть масляный фильтр и пробку'],
      estimatedDifficulty: 'easy',
    },
    default: {
      possibleCauses: ['Множество возможных причин - требуется диагностика', 'Износ или повреждение компонента', 'Электрическая проблема или датчик'],
      suggestedActions: ['Провести визуальный осмотр', 'Запустить электронную диагностику', 'Тест-драйв для проверки симптомов'],
      estimatedDifficulty: 'medium',
    },
  },
};

// Generate repair suggestions in the user's language
async function generateRepairSuggestions(
  problemDescription: string,
  _vehicle: { brand: string; model: string; year: number },
  language: string
): Promise<RepairSuggestions> {
  await new Promise(resolve => setTimeout(resolve, 800));

  const lang = suggestionsByLanguage[language] || suggestionsByLanguage.en;
  const problem = problemDescription.toLowerCase();

  if (problem.includes('brake') || problem.includes('frein') || problem.includes('frână') || problem.includes('travão') || problem.includes('тормоз')) {
    return lang.brake;
  }

  if (problem.includes('engine') || problem.includes('moteur') || problem.includes('motor') || problem.includes('start') || problem.includes('двигатель')) {
    return lang.engine;
  }

  if (problem.includes('oil') || problem.includes('huile') || problem.includes('ulei') || problem.includes('óleo') || problem.includes('масл')) {
    return lang.oil;
  }

  return lang.default;
}

interface JobAssignmentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  job: Job;
  vehicle: Vehicle | null;
  onConfirm: () => void;
}

export function JobAssignmentModal({
  open,
  onOpenChange,
  job,
  vehicle,
  onConfirm,
}: JobAssignmentModalProps) {
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const isMechanic = user?.role === 'mechanic';
  const [suggestions, setSuggestions] = useState<RepairSuggestions | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showVehicleDetails, setShowVehicleDetails] = useState(false);

  // Fetch AI suggestions when modal opens
  useEffect(() => {
    if (open && vehicle && !suggestions) {
      setIsLoading(true);
      generateRepairSuggestions(
        job.problemDescription,
        { brand: vehicle.brand, model: vehicle.model, year: vehicle.year },
        language
      ).then((result) => {
        setSuggestions(result);
        setIsLoading(false);
      });
    }
  }, [open, vehicle, job.problemDescription, language, suggestions]);

  // Reset suggestions when modal closes
  useEffect(() => {
    if (!open) {
      setSuggestions(null);
    }
  }, [open]);

  const serviceTypeLabels: Record<string, string> = {
    repair: t('modal.assignment.serviceType.repair'),
    maintenance: t('modal.assignment.serviceType.maintenance'),
    inspection: t('modal.assignment.serviceType.inspection'),
    diagnostic: t('modal.assignment.serviceType.diagnostic'),
  };

  const priorityConfig = {
    low: { class: 'bg-muted text-muted-foreground', label: t('modal.assignment.priority.low') },
    normal: { class: 'bg-primary/10 text-primary', label: t('modal.assignment.priority.normal') },
    urgent: { class: 'bg-destructive/10 text-destructive', label: t('modal.assignment.priority.urgent') },
  };

  const difficultyConfig = {
    easy: { class: 'bg-green-500/10 text-green-600', label: t('modal.assignment.difficulty.easy') },
    medium: { class: 'bg-amber-500/10 text-amber-600', label: t('modal.assignment.difficulty.medium') },
    hard: { class: 'bg-red-500/10 text-red-600', label: t('modal.assignment.difficulty.hard') },
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wrench className="h-5 w-5 text-primary" />
            {t('modal.assignment.title')}
          </DialogTitle>
          <DialogDescription>
            {t('modal.assignment.description')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Vehicle Info Card - Collapsible */}
          {vehicle && (
            <div className="rounded-lg border bg-secondary/30 overflow-hidden">
              <button
                onClick={() => setShowVehicleDetails(!showVehicleDetails)}
                className="w-full p-4 flex items-center justify-between hover:bg-secondary/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 flex items-center justify-center shrink-0">
                    <CarBrandLogo brand={vehicle.brand} size="md" className="text-primary" />
                  </div>
                  <div className="text-left">
                    <h4 className="font-semibold">
                      {vehicle.year} {vehicle.brand} {vehicle.model}
                    </h4>
                    <p className="text-sm text-muted-foreground font-mono">
                      {vehicle.licensePlate}
                    </p>
                  </div>
                </div>
                {showVehicleDetails ? (
                  <ChevronUp className="h-5 w-5 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-muted-foreground" />
                )}
              </button>
              
              {showVehicleDetails && (
                <div className="px-4 pb-4 pt-0 border-t bg-secondary/20 animate-fade-in">
                  <div className="grid grid-cols-2 gap-3 pt-3">
                    <div>
                      <span className="text-xs text-muted-foreground">{t('vehicle.brand')}</span>
                      <p className="font-medium">{vehicle.brand}</p>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground">{t('vehicle.model')}</span>
                      <p className="font-medium">{vehicle.model}</p>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground">{t('vehicle.year')}</span>
                      <p className="font-medium">{vehicle.year}</p>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground">{t('vehicle.licensePlate')}</span>
                      <p className="font-medium font-mono">{vehicle.licensePlate}</p>
                    </div>
                    {vehicle.vin && (
                      <div className="col-span-2">
                        <span className="text-xs text-muted-foreground">VIN</span>
                        <p className="font-medium font-mono text-sm">{vehicle.vin}</p>
                      </div>
                    )}
                    {vehicle.color && (
                      <div>
                        <span className="text-xs text-muted-foreground">{t('vehicle.color')}</span>
                        <p className="font-medium">{vehicle.color}</p>
                      </div>
                    )}
                    {job.mileage && (
                      <div>
                        <span className="text-xs text-muted-foreground">Kilometers</span>
                        <p className="font-medium flex items-center gap-1">
                          <Gauge className="h-3.5 w-3.5" />
                          {job.mileage.toLocaleString()} km
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Job Type & Priority (visible to all) / Customer Info (hidden from mechanics) */}
          <div className="rounded-lg border p-4">
            <div className="flex items-start gap-3">
              {!isMechanic && (
                <>
                  <div className="rounded-full bg-muted p-2">
                    <User className="h-4 w-4" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{job.customerName}</p>
                    <a
                      href={`tel:${job.customerPhone}`}
                      className="flex items-center gap-1 text-sm text-primary"
                    >
                      <Phone className="h-3 w-3" />
                      {job.customerPhone}
                    </a>
                  </div>
                </>
              )}
              {isMechanic && (
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground mb-2">{t('modal.assignment.jobDetails')}</p>
                </div>
              )}
              {/* Tags */}
              <div className="flex flex-wrap gap-1.5">
                {job.serviceType && (
                  <Badge variant="outline" className="gap-1 text-xs">
                    <Wrench className="h-3 w-3" />
                    {serviceTypeLabels[job.serviceType]}
                  </Badge>
                )}
                <Badge className={cn('text-xs', priorityConfig[job.priority].class)}>
                  {priorityConfig[job.priority].label}
                </Badge>
              </div>
            </div>
          </div>

          {/* Problem Description */}
          <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-medium text-destructive mb-1">
                  {t('jobs.problemDescription')}
                </h4>
                <p className="text-sm text-foreground">
                  {getTranslatedProblemDescription(job, language)}
                </p>
              </div>
            </div>
          </div>

          {/* AI Suggestions Section */}
          <div className="rounded-lg border bg-gradient-to-br from-primary/5 to-primary/10 p-4 space-y-4">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              <h4 className="font-semibold text-primary">
                {t('modal.assignment.aiSuggestions')}
              </h4>
            </div>

            {isLoading ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {t('modal.assignment.aiAnalyzing')}
                </div>
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-5/6" />
              </div>
            ) : suggestions ? (
              <div className="space-y-4">
                {/* Difficulty Badge */}
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{t('modal.assignment.difficulty')}:</span>
                  <Badge className={difficultyConfig[suggestions.estimatedDifficulty].class}>
                    {difficultyConfig[suggestions.estimatedDifficulty].label}
                  </Badge>
                </div>

                {/* Possible Causes */}
                <div>
                  <h5 className="text-sm font-medium mb-2 flex items-center gap-1.5">
                    <AlertCircle className="h-4 w-4 text-amber-500" />
                    {t('modal.assignment.possibleCauses')}
                  </h5>
                  <ul className="space-y-1.5">
                    {suggestions.possibleCauses.map((cause, index) => (
                      <li key={index} className="flex items-start gap-2 text-sm">
                        <div className="h-1.5 w-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                        <span>{cause}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Suggested Actions */}
                <div>
                  <h5 className="text-sm font-medium mb-2 flex items-center gap-1.5">
                    <Lightbulb className="h-4 w-4 text-primary" />
                    {t('modal.assignment.suggestedActions')}
                  </h5>
                  <ul className="space-y-1.5">
                    {suggestions.suggestedActions.map((action, index) => (
                      <li key={index} className="flex items-start gap-2 text-sm">
                        <CheckCircle className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                        <span>{action}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Warning Notes */}
                {suggestions.warningNotes && (
                  <div className="rounded-md bg-amber-500/10 border border-amber-500/20 p-3">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                      <div>
                        <h5 className="text-sm font-medium text-amber-700 mb-0.5">
                          {t('modal.assignment.warning')}
                        </h5>
                        <p className="text-sm text-amber-600">
                          {suggestions.warningNotes}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                {t('modal.assignment.aiUnavailable')}
              </p>
            )}
          </div>

          {/* Scheduled Date */}
          {job.scheduledDate && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>{t('modal.assignment.scheduled')}: {new Date(job.scheduledDate).toLocaleDateString()}</span>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t('common.cancel')}
          </Button>
          <Button onClick={onConfirm} className="gap-2">
            <Wrench className="h-4 w-4" />
            {t('modal.assignment.startWorking')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
