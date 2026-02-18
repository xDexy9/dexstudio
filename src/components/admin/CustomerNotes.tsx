import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Tag, User, Clock, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { CustomerNote, CustomerTag } from '@/types';

const tagConfig: Record<CustomerTag, { label: string; className: string }> = {
  vip: { label: 'VIP', className: 'bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20' },
  frequent: { label: 'Frequent', className: 'bg-green-500/10 text-green-500 hover:bg-green-500/20' },
  new: { label: 'New', className: 'bg-blue-500/10 text-blue-500 hover:bg-blue-500/20' },
  fleet: { label: 'Fleet', className: 'bg-purple-500/10 text-purple-500 hover:bg-purple-500/20' },
  commercial: { label: 'Commercial', className: 'bg-orange-500/10 text-orange-500 hover:bg-orange-500/20' },
  referred: { label: 'Referred', className: 'bg-pink-500/10 text-pink-500 hover:bg-pink-500/20' },
};

interface CustomerNotesProps {
  customerId: string;
  customerName: string;
  initialTags?: CustomerTag[];
  initialNotes?: CustomerNote[];
}

export const CustomerNotes = ({
  customerId,
  customerName,
  initialTags = ['frequent'],
  initialNotes = [
    {
      id: 'note-1',
      customerId,
      content: 'Prefers morning appointments. Always pays on time.',
      author: 'Joe',
      createdAt: '2024-02-15T10:00:00Z',
      tags: ['vip'],
    },
    {
      id: 'note-2',
      customerId,
      content: 'Owns a small business, might need fleet services.',
      author: 'Mike',
      createdAt: '2024-01-20T14:30:00Z',
      tags: ['commercial'],
    },
  ],
}: CustomerNotesProps) => {
  const [notes, setNotes] = useState<CustomerNote[]>(initialNotes);
  const [customerTags, setCustomerTags] = useState<CustomerTag[]>(initialTags);
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [newNote, setNewNote] = useState('');
  const [selectedTags, setSelectedTags] = useState<CustomerTag[]>([]);

  const handleAddNote = () => {
    if (!newNote.trim()) return;

    const note: CustomerNote = {
      id: `note-${Date.now()}`,
      customerId,
      content: newNote,
      author: 'Admin',
      createdAt: new Date().toISOString(),
      tags: selectedTags,
    };

    setNotes([note, ...notes]);
    setNewNote('');
    setSelectedTags([]);
    setIsAddingNote(false);
  };

  const toggleTag = (tag: CustomerTag) => {
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const toggleCustomerTag = (tag: CustomerTag) => {
    setCustomerTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const deleteNote = (id: string) => {
    setNotes(notes.filter(n => n.id !== id));
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <User className="h-5 w-5 text-primary" />
            Customer Profile
          </CardTitle>
          <Dialog open={isAddingNote} onOpenChange={setIsAddingNote}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline">
                <Plus className="h-4 w-4 mr-1" />
                Add Note
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Note for {customerName}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <Textarea
                  placeholder="Enter your note..."
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  className="min-h-[100px]"
                />
                <div>
                  <p className="text-sm font-medium mb-2">Tags</p>
                  <div className="flex flex-wrap gap-2">
                    {(Object.keys(tagConfig) as CustomerTag[]).map((tag) => (
                      <Badge
                        key={tag}
                        variant="outline"
                        className={cn(
                          'cursor-pointer transition-all',
                          selectedTags.includes(tag)
                            ? tagConfig[tag].className
                            : 'opacity-50 hover:opacity-100'
                        )}
                        onClick={() => toggleTag(tag)}
                      >
                        {tagConfig[tag].label}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddingNote(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddNote}>Save Note</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Customer Tags */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Tag className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Customer Tags</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {(Object.keys(tagConfig) as CustomerTag[]).map((tag) => (
              <Badge
                key={tag}
                variant="outline"
                className={cn(
                  'cursor-pointer transition-all',
                  customerTags.includes(tag)
                    ? tagConfig[tag].className
                    : 'opacity-40 hover:opacity-70'
                )}
                onClick={() => toggleCustomerTag(tag)}
              >
                {tagConfig[tag].label}
              </Badge>
            ))}
          </div>
        </div>

        {/* Notes List */}
        <div className="space-y-3">
          <p className="text-sm font-medium">Notes ({notes.length})</p>
          <AnimatePresence>
            {notes.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                No notes yet. Add one to keep track of important information.
              </p>
            ) : (
              notes.map((note) => (
                <motion.div
                  key={note.id}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, height: 0 }}
                  className="p-3 rounded-lg bg-secondary/50 group relative"
                >
                  <p className="text-sm pr-8">{note.content}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatDate(note.createdAt)} by {note.author}
                    </span>
                    {note.tags.map((tag) => (
                      <Badge
                        key={tag}
                        variant="outline"
                        className={cn('text-xs py-0', tagConfig[tag].className)}
                      >
                        {tagConfig[tag].label}
                      </Badge>
                    ))}
                  </div>
                  <button
                    onClick={() => deleteNote(note.id)}
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-destructive/10 rounded text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>
      </CardContent>
    </Card>
  );
};
