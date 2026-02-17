import React, { useState, useMemo } from 'react';
import { Sparkles, Search, X } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { getTemplatesForRole, getTemplateText, getCategoryLabel as getTemplateCategoryLabel, categoryEmojis } from '@/lib/messageTemplates';
import { TemplateCategory } from '@/lib/types';
import { cn } from '@/lib/utils';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';

interface MessageTemplatesPanelProps {
  onSelectTemplate: (text: string) => void;
}

const ALL_CATEGORIES: Array<TemplateCategory | 'all'> = [
  'all', 'status', 'diagnostic', 'parts', 'issue', 'scheduling', 'payment', 'approval', 'follow_up', 'greeting',
];

const allLabels: Record<string, Record<string, string>> = {
  all: { en: 'All', fr: 'Tous', ro: 'Toate', pt: 'Todos', ru: 'Все' },
};

const quickRepliesLabel: Record<string, string> = {
  en: 'Quick Replies',
  fr: 'Réponses rapides',
  ro: 'Răspunsuri rapide',
  pt: 'Respostas rápidas',
  ru: 'Быстрые ответы',
};

const searchPlaceholder: Record<string, string> = {
  en: 'Search replies...',
  fr: 'Chercher...',
  ro: 'Caută...',
  pt: 'Pesquisar...',
  ru: 'Поиск...',
};

export function MessageTemplatesPanel({ onSelectTemplate }: MessageTemplatesPanelProps) {
  const { user } = useAuth();
  const { language } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<TemplateCategory | 'all'>('all');
  const [search, setSearch] = useState('');

  if (!user) return null;

  const templates = getTemplatesForRole(user.role);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    templates.forEach(t => {
      counts[t.category] = (counts[t.category] || 0) + 1;
    });
    return counts;
  }, [templates]);

  const visibleCategories = ALL_CATEGORIES.filter(
    cat => cat === 'all' || (categoryCounts[cat] || 0) > 0
  );

  const filteredTemplates = useMemo(() => {
    let list = selectedCategory === 'all'
      ? templates
      : templates.filter(t => t.category === selectedCategory);

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(t => getTemplateText(t, language).toLowerCase().includes(q));
    }
    return list;
  }, [templates, selectedCategory, search, language]);

  if (templates.length === 0) return null;

  const getCatLabel = (cat: string) => {
    if (cat === 'all') return allLabels.all[language] || 'All';
    return getTemplateCategoryLabel(cat, language);
  };

  const handleSelect = (text: string) => {
    // Blur any focused input before inserting text so keyboard closes on mobile
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    onSelectTemplate(text);
    setIsOpen(false);
    setSearch('');
  };

  const handleTriggerPointerDown = (e: React.PointerEvent) => {
    // Prevent the underlying text input from focusing (which opens the keyboard)
    e.preventDefault();
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open) => {
      if (!open && document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
      }
      setIsOpen(open);
    }}>
      <SheetTrigger asChild>
        <button
          onPointerDown={handleTriggerPointerDown}
          className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-primary hover:bg-primary/10 rounded-lg transition-colors"
        >
          <Sparkles className="h-4 w-4" />
          <span>{quickRepliesLabel[language] || 'Quick Replies'}</span>
          <span className="text-xs text-muted-foreground ml-1">({templates.length})</span>
        </button>
      </SheetTrigger>

      <SheetContent side="bottom" className="rounded-t-2xl max-h-[70vh] p-0 flex flex-col">
        {/* Header */}
        <SheetHeader className="px-4 pt-4 pb-2">
          <div className="w-10 h-1 rounded-full bg-muted-foreground/30 mx-auto mb-2" />
          <SheetTitle className="text-base flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            {quickRepliesLabel[language] || 'Quick Replies'}
          </SheetTitle>
        </SheetHeader>

        {/* Search */}
        <div className="px-4 pb-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="search"
              inputMode="search"
              autoComplete="off"
              autoFocus={false}
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={searchPlaceholder[language] || 'Search...'}
              className="w-full pl-9 pr-8 py-2 text-sm rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-muted rounded"
              >
                <X className="h-3 w-3 text-muted-foreground" />
              </button>
            )}
          </div>
        </div>

        {/* Category pills — horizontal scroll */}
        <div className="px-4 pb-3 overflow-x-auto scrollbar-hide">
          <div className="flex gap-2 min-w-max">
            {visibleCategories.map(cat => {
              const count = cat === 'all' ? templates.length : (categoryCounts[cat] || 0);
              const emoji = cat !== 'all' ? categoryEmojis[cat] : undefined;
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={cn(
                    'flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap',
                    selectedCategory === cat
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'bg-secondary/70 text-secondary-foreground hover:bg-secondary'
                  )}
                >
                  {emoji && <span className="text-[11px]">{emoji}</span>}
                  {getCatLabel(cat)}
                  <span className="opacity-60">({count})</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Template grid */}
        <div className="flex-1 overflow-y-auto px-4 pb-4">
          {filteredTemplates.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {filteredTemplates.map(template => {
                const text = getTemplateText(template, language);
                const emoji = categoryEmojis[template.category] || '';
                return (
                  <button
                    key={template.id}
                    onPointerDown={e => e.preventDefault()}
                    onClick={() => handleSelect(text)}
                    className="text-left px-3 py-2.5 rounded-xl border border-border/50 bg-card hover:bg-accent hover:border-primary/30 transition-all group"
                  >
                    <span className="text-xs leading-relaxed line-clamp-2">
                      <span className="mr-1">{emoji}</span>
                      {text}
                    </span>
                  </button>
                );
              })}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground text-center py-8">
              {language === 'fr' ? 'Aucun résultat' :
               language === 'ro' ? 'Niciun rezultat' :
               language === 'pt' ? 'Sem resultados' :
               language === 'ru' ? 'Нет результатов' :
               'No results found'}
            </p>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
