import React from 'react';
import { AlertTriangle, MessageSquareWarning, Calendar, User, ArrowLeft, ArrowRight } from 'lucide-react';
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
import { ScrollArea } from '@/components/ui/scroll-area';
import { CustomerComplaint } from '@/lib/types';
import { useLanguage } from '@/contexts/LanguageContext';

interface CustomerComplaintWarningModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customerName: string;
  complaints: CustomerComplaint[];
  onContinue: () => void;
  onGoBack: () => void;
}

export function CustomerComplaintWarningModal({
  open,
  onOpenChange,
  customerName,
  complaints,
  onContinue,
  onGoBack,
}: CustomerComplaintWarningModalProps) {
  const { t } = useLanguage();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-1">
            <div className="h-10 w-10 rounded-xl bg-amber-500/20 flex items-center justify-center">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <DialogTitle className="text-amber-700 dark:text-amber-400">
                {t('complaint.warning.title')}
              </DialogTitle>
              <DialogDescription>
                {complaints.length === 1
                  ? t('complaint.warning.hasComplaint').replace('{name}', customerName).replace('{count}', complaints.length.toString())
                  : t('complaint.warning.hasComplaints').replace('{name}', customerName).replace('{count}', complaints.length.toString())
                }
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="border-2 border-amber-300/50 bg-amber-50/50 dark:bg-amber-950/20 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <MessageSquareWarning className="h-4 w-4 text-amber-600" />
            <span className="text-sm font-semibold text-amber-700 dark:text-amber-400">
              {t('complaint.warning.history')}
            </span>
            <Badge variant="secondary" className="bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-400 ml-auto">
              {complaints.length}
            </Badge>
          </div>

          <ScrollArea className="max-h-52">
            <div className="space-y-3">
              {complaints
                .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                .slice(0, 5)
                .map((complaint) => (
                  <div
                    key={complaint.id}
                    className="bg-white/60 dark:bg-background/40 rounded-lg p-3 border border-amber-200/50"
                  >
                    <p className="text-sm text-foreground leading-relaxed">
                      {complaint.description}
                    </p>
                    <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(complaint.createdAt).toLocaleDateString('en-GB')}
                      </span>
                      <span className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {complaint.createdByName}
                      </span>
                    </div>
                  </div>
                ))}
            </div>
          </ScrollArea>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={onGoBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t('complaint.warning.goBack')}
          </Button>
          <Button
            onClick={onContinue}
            className="bg-amber-600 hover:bg-amber-700 text-white"
          >
            {t('complaint.warning.continue')}
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
