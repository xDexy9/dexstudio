import React, { useState } from 'react';
import { MessageSquareWarning, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { addCustomerComplaint } from '@/services/firestoreService';

interface CustomerComplaintModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customerId: string;
  customerName: string;
  onComplaintAdded: () => void;
}

export function CustomerComplaintModal({
  open,
  onOpenChange,
  customerId,
  customerName,
  onComplaintAdded,
}: CustomerComplaintModalProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!description.trim() || !user) return;

    setIsSubmitting(true);
    try {
      await addCustomerComplaint(customerId, {
        description: description.trim(),
        createdBy: user.id,
        createdByName: user.fullName,
      });
      toast({
        title: 'Complaint added',
        description: `Complaint recorded for ${customerName}.`,
      });
      setDescription('');
      onOpenChange(false);
      onComplaintAdded();
    } catch (error) {
      console.error('Error adding complaint:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to add complaint. Please try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-1">
            <div className="h-10 w-10 rounded-xl bg-amber-500/20 flex items-center justify-center">
              <MessageSquareWarning className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <DialogTitle>Add Complaint</DialogTitle>
              <DialogDescription>
                Record a complaint for {customerName}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="complaint-desc">Complaint Description *</Label>
            <Textarea
              id="complaint-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the complaint or issue..."
              rows={4}
              className="resize-none"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!description.trim() || isSubmitting}
            className="bg-amber-600 hover:bg-amber-700 text-white"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              'Add Complaint'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
