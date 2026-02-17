import React, { useState } from 'react';
import { Trash2, AlertTriangle, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { store, persistStore } from '@/lib/mockStore';

type CollectionName = 'quotes' | 'invoices' | 'vehicles' | 'customers' | 'jobs';

interface DataCollection {
  name: CollectionName;
  label: string;
  description: string;
  icon: typeof Trash2;
  warningLevel: 'high' | 'medium';
}

export default function DataManagementPage() {
  const { t } = useLanguage();
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<CollectionName | null>(null);
  const [deletedCounts, setDeletedCounts] = useState<Record<string, number>>({});

  const collections: DataCollection[] = [
    { name: 'quotes', label: 'Quotes', description: 'All customer quotes and estimates', icon: Trash2, warningLevel: 'medium' },
    { name: 'invoices', label: 'Invoices', description: 'All invoices and payment records', icon: Trash2, warningLevel: 'high' },
    { name: 'vehicles', label: 'Vehicles', description: 'All vehicle records', icon: Trash2, warningLevel: 'medium' },
    { name: 'customers', label: 'Customers', description: 'All customer contact information', icon: Trash2, warningLevel: 'medium' },
    { name: 'jobs', label: 'Jobs', description: 'All work orders and job history', icon: Trash2, warningLevel: 'high' },
  ];

  const handleDeleteCollection = async (collectionName: CollectionName) => {
    setIsDeleting(true);
    try {
      const count = (store[collectionName] as any[]).length;
      (store[collectionName] as any[]).length = 0;
      persistStore();
      setDeletedCounts(prev => ({ ...prev, [collectionName]: count }));
      toast.success('Data cleared successfully', {
        description: `Deleted ${count} ${collectionName} records`,
        icon: <CheckCircle className="h-4 w-4" />,
      });
    } catch (error) {
      toast.error('Failed to clear data', { description: error instanceof Error ? error.message : 'An error occurred' });
    } finally {
      setIsDeleting(false);
      setDeleteTarget(null);
    }
  };

  const handleClearAll = async () => {
    setIsDeleting(true);
    try {
      for (const coll of collections) {
        const count = (store[coll.name] as any[]).length;
        (store[coll.name] as any[]).length = 0;
        setDeletedCounts(prev => ({ ...prev, [coll.name]: count }));
      }
      persistStore();
      toast.success('All data cleared', { description: 'All collections have been cleared', icon: <CheckCircle className="h-4 w-4" /> });
    } catch (error) {
      toast.error('Failed to clear all data');
    } finally {
      setIsDeleting(false);
      setDeleteTarget(null);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Data Management</h1>
        <p className="text-muted-foreground">Clear demo data collections. This action cannot be undone.</p>
      </div>

      <Card className="border-destructive/50 bg-destructive/5">
        <CardContent className="pt-6">
          <div className="flex gap-3">
            <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-destructive mb-1">Warning: Permanent Deletion</h3>
              <p className="text-sm text-muted-foreground">
                Deleting data is permanent for this session. User accounts will NOT be deleted.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Clear All Data</CardTitle>
          <CardDescription>Delete all quotes, invoices, vehicles, customers, and jobs in one action</CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="destructive" size="lg" onClick={() => setDeleteTarget('jobs' as CollectionName)}
            disabled={isDeleting} className="w-full">
            <Trash2 className="h-4 w-4 mr-2" />
            {isDeleting ? 'Clearing...' : 'Clear All Data'}
          </Button>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Clear Individual Collections</h2>
        <div className="grid gap-4">
          {collections.map((coll) => (
            <Card key={coll.name}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold mb-1">{coll.label}</h3>
                    <p className="text-sm text-muted-foreground">{coll.description}</p>
                    {deletedCounts[coll.name] && (
                      <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                        Deleted {deletedCounts[coll.name]} records
                      </p>
                    )}
                  </div>
                  <Button variant={coll.warningLevel === 'high' ? 'destructive' : 'outline'}
                    onClick={() => setDeleteTarget(coll.name)} disabled={isDeleting}>
                    <Trash2 className="h-4 w-4 mr-2" />Clear
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <AlertDialog open={deleteTarget !== null} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />Confirm Deletion
            </AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget === 'jobs' ? (
                <>
                  <p className="mb-3"><strong>You are about to delete ALL data:</strong></p>
                  <ul className="list-disc list-inside space-y-1 mb-3">
                    <li>All quotes</li><li>All invoices</li><li>All vehicles</li>
                    <li>All customers</li><li>All jobs</li>
                  </ul>
                  <p className="font-semibold text-destructive">This cannot be undone.</p>
                </>
              ) : (
                <>Are you sure you want to delete all <strong className="text-destructive">{deleteTarget}</strong>? This cannot be undone.</>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteTarget === 'jobs') { handleClearAll(); }
                else if (deleteTarget) { handleDeleteCollection(deleteTarget); }
              }}
              disabled={isDeleting}
              className="bg-destructive hover:bg-destructive/90"
            >
              {isDeleting ? 'Deleting...' : 'Delete Permanently'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
