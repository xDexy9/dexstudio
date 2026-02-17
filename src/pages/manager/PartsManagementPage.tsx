import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  getAllParts,
  addPart,
  updatePart,
  deletePart,
  searchParts,
  calculateMarkup,
  calculateSellingPrice,
} from '@/services/partsService';
import { Part } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Package,
  Plus,
  Search,
  Edit,
  Trash2,
  AlertTriangle,
  TrendingUp,
  Euro,
  BarChart3,
} from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const PART_CATEGORIES = [
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
  'filters',
  'belts',
  'hoses',
  'gaskets',
  'other',
];


export function PartsManagementPage() {
  const { user } = useAuth();
  const { t } = useLanguage();

  const PART_UNITS = [
    { value: 'piece', label: t('parts.units.piece') },
    { value: 'liter', label: t('parts.units.liter') },
    { value: 'meter', label: t('parts.units.meter') },
    { value: 'kilogram', label: t('parts.units.kilogram') },
    { value: 'set', label: t('parts.units.set') },
  ];

  const [parts, setParts] = useState<Part[]>([]);
  const [filteredParts, setFilteredParts] = useState<Part[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showLowStock, setShowLowStock] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingPart, setEditingPart] = useState<Part | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    partNumber: '',
    name: '',
    description: '',
    category: '',
    stockQuantity: 0,
    minStockLevel: 5,
    maxStockLevel: 100,
    unit: 'piece' as const,
    location: '',
    costPrice: 0,
    sellingPrice: 0,
    markup: 0,
    taxRate: 20,
    isActive: true,
    notes: '',
  });

  useEffect(() => {
    loadParts();
  }, []);

  useEffect(() => {
    filterParts();
  }, [parts, searchTerm, selectedCategory, showLowStock]);

  const loadParts = async () => {
    try {
      setLoading(true);
      const data = await getAllParts();
      setParts(data);
    } catch (error) {
      console.error('Error loading parts:', error);
      toast.error(t('parts.loadError'));
    } finally {
      setLoading(false);
    }
  };

  const filterParts = () => {
    let filtered = [...parts];

    // Filter by search term
    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      filtered = filtered.filter(
        p =>
          p.name.toLowerCase().includes(lower) ||
          p.partNumber.toLowerCase().includes(lower) ||
          p.description?.toLowerCase().includes(lower)
      );
    }

    // Filter by category
    if (selectedCategory && selectedCategory !== 'all') {
      filtered = filtered.filter(p => p.category === selectedCategory);
    }

    // Filter by low stock
    if (showLowStock) {
      filtered = filtered.filter(p => p.stockQuantity <= p.minStockLevel);
    }

    setFilteredParts(filtered);
  };

  const resetForm = () => {
    setFormData({
      partNumber: '',
      name: '',
      description: '',
      category: '',
      stockQuantity: 0,
      minStockLevel: 5,
      maxStockLevel: 100,
      unit: 'piece',
      location: '',
      costPrice: 0,
      sellingPrice: 0,
      markup: 0,
      taxRate: 20,
      isActive: true,
      notes: '',
    });
  };

  const handleCostPriceChange = (cost: number) => {
    const selling = calculateSellingPrice(cost, formData.markup);
    setFormData(prev => ({
      ...prev,
      costPrice: cost,
      sellingPrice: selling,
    }));
  };

  const handleSellingPriceChange = (selling: number) => {
    const markup = calculateMarkup(formData.costPrice, selling);
    setFormData(prev => ({
      ...prev,
      sellingPrice: selling,
      markup,
    }));
  };

  const handleMarkupChange = (markup: number) => {
    const selling = calculateSellingPrice(formData.costPrice, markup);
    setFormData(prev => ({
      ...prev,
      markup,
      sellingPrice: selling,
    }));
  };

  const handleAddPart = async () => {
    if (!user) return;

    try {
      if (!formData.name || !formData.partNumber || !formData.category) {
        toast.error(t('common.fillRequired'));
        return;
      }

      await addPart(formData, user.id);
      toast.success(t('parts.added'));
      setIsAddModalOpen(false);
      resetForm();
      loadParts();
    } catch (error) {
      console.error('Error adding part:', error);
      toast.error(t('parts.addError'));
    }
  };

  const handleEditPart = async () => {
    if (!user || !editingPart) return;

    try {
      await updatePart(editingPart.id, formData, user.id);
      toast.success(t('parts.updated'));
      setIsEditModalOpen(false);
      setEditingPart(null);
      resetForm();
      loadParts();
    } catch (error) {
      console.error('Error updating part:', error);
      toast.error(t('parts.updateError'));
    }
  };

  const handleDeletePart = async (partId: string) => {
    if (!user) return;

    if (!confirm(t('parts.confirmDelete'))) return;

    try {
      await deletePart(partId, user.id);
      toast.success(t('parts.deleted'));
      setParts(prev => prev.filter(p => p.id !== partId));
    } catch (error) {
      console.error('Error deleting part:', error);
      toast.error(t('parts.deleteError'));
    }
  };

  const openEditModal = (part: Part) => {
    setEditingPart(part);
    setFormData({
      partNumber: part.partNumber,
      name: part.name,
      description: part.description || '',
      category: part.category,
      stockQuantity: part.stockQuantity,
      minStockLevel: part.minStockLevel,
      maxStockLevel: part.maxStockLevel,
      unit: part.unit,
      location: part.location || '',
      costPrice: part.costPrice,
      sellingPrice: part.sellingPrice,
      markup: part.markup,
      taxRate: part.taxRate,
      isActive: part.isActive,
      notes: part.notes || '',
    });
    setIsEditModalOpen(true);
  };

  const stats = {
    total: parts.length,
    active: parts.filter(p => p.isActive).length,
    lowStock: parts.filter(p => p.stockQuantity <= p.minStockLevel).length,
    totalValue: parts.reduce((sum, p) => sum + p.stockQuantity * p.costPrice, 0),
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Package className="h-8 w-8 text-primary" />
            {t('parts.title')}
          </h1>
          <p className="text-muted-foreground mt-1">
            {t('parts.subtitle')}
          </p>
        </div>
        <Button onClick={() => setIsAddModalOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          {t('parts.addNew')}
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t('parts.totalParts')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t('parts.activeParts')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.active}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t('parts.lowStock')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{stats.lowStock}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t('parts.totalValue')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">€{stats.totalValue.toFixed(2)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <div className="relative flex-1 min-w-[300px]">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t('parts.searchPlaceholder')}
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder={t('parts.allCategories')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('parts.allCategories')}</SelectItem>
            {PART_CATEGORIES.map(cat => (
              <SelectItem key={cat} value={cat}>
                {t(`parts.categories.${cat}` as any)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button
          variant={showLowStock ? 'default' : 'outline'}
          onClick={() => setShowLowStock(!showLowStock)}
        >
          <AlertTriangle className="h-4 w-4 mr-2" />
          {t('parts.lowStockOnly')}
        </Button>
      </div>

      {/* Parts Table */}
      <div className="rounded-lg border">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium">{t('parts.partNumber')}</th>
                <th className="px-4 py-3 text-left text-sm font-medium">{t('common.name')}</th>
                <th className="px-4 py-3 text-left text-sm font-medium">{t('parts.category')}</th>
                <th className="px-4 py-3 text-right text-sm font-medium">{t('parts.stock')}</th>
                <th className="px-4 py-3 text-right text-sm font-medium">{t('parts.cost')}</th>
                <th className="px-4 py-3 text-right text-sm font-medium">{t('parts.selling')}</th>
                <th className="px-4 py-3 text-right text-sm font-medium">{t('parts.markup')}</th>
                <th className="px-4 py-3 text-center text-sm font-medium">{t('common.actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredParts.map(part => {
                const isLowStock = part.stockQuantity <= part.minStockLevel;
                return (
                  <tr key={part.id} className="hover:bg-muted/30">
                    <td className="px-4 py-3 text-sm font-mono">{part.partNumber}</td>
                    <td className="px-4 py-3">
                      <div>
                        <div className="font-medium">{part.name}</div>
                        {part.description && (
                          <div className="text-sm text-muted-foreground line-clamp-1">
                            {part.description}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm capitalize">{part.category.replace('_', ' ')}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <span className={isLowStock ? 'text-amber-600 font-semibold' : ''}>
                          {part.stockQuantity}
                        </span>
                        <span className="text-muted-foreground text-sm">{part.unit}</span>
                        {isLowStock && <AlertTriangle className="h-4 w-4 text-amber-500" />}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">€{part.costPrice.toFixed(2)}</td>
                    <td className="px-4 py-3 text-right font-semibold">€{part.sellingPrice.toFixed(2)}</td>
                    <td className="px-4 py-3 text-right">
                      <Badge variant={part.markup > 30 ? 'default' : 'secondary'}>
                        {part.markup.toFixed(1)}%
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditModal(part)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeletePart(part.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredParts.length === 0 && (
          <div className="text-center py-12">
            <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">{t('parts.noPartsFound')}</p>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      <Dialog open={isAddModalOpen || isEditModalOpen} onOpenChange={(open) => {
        if (!open) {
          setIsAddModalOpen(false);
          setIsEditModalOpen(false);
          setEditingPart(null);
          resetForm();
        }
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingPart ? t('parts.editPart') : t('parts.addNew')}
            </DialogTitle>
            <DialogDescription>
              {editingPart ? t('parts.updateDetails') : t('parts.addDescription')}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="partNumber">{t('parts.partNumber')} *</Label>
                <Input
                  id="partNumber"
                  value={formData.partNumber}
                  onChange={e => setFormData(prev => ({ ...prev, partNumber: e.target.value }))}
                  placeholder="e.g., BRK-001"
                />
              </div>

              <div>
                <Label htmlFor="name">{t('common.name')} *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Brake Pad Set"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="description">{t('common.description')}</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder={t('parts.descriptionPlaceholder')}
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="category">{t('parts.category')} *</Label>
                <Select
                  value={formData.category}
                  onValueChange={value => setFormData(prev => ({ ...prev, category: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t('parts.selectCategory')} />
                  </SelectTrigger>
                  <SelectContent>
                    {PART_CATEGORIES.map(cat => (
                      <SelectItem key={cat} value={cat}>
                        {t(`parts.categories.${cat}` as any)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="unit">{t('parts.unit')}</Label>
                <Select
                  value={formData.unit}
                  onValueChange={(value: any) => setFormData(prev => ({ ...prev, unit: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PART_UNITS.map(unit => (
                      <SelectItem key={unit.value} value={unit.value}>
                        {unit.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="stockQuantity">{t('parts.stockQuantity')}</Label>
                <Input
                  id="stockQuantity"
                  type="number"
                  value={formData.stockQuantity || ''}
                  placeholder="0"
                  onFocus={e => e.target.select()}
                  onChange={e => setFormData(prev => ({ ...prev, stockQuantity: Number(e.target.value) }))}
                />
              </div>

              <div>
                <Label htmlFor="minStockLevel">{t('parts.minStock')}</Label>
                <Input
                  id="minStockLevel"
                  type="number"
                  value={formData.minStockLevel || ''}
                  placeholder="0"
                  onFocus={e => e.target.select()}
                  onChange={e => setFormData(prev => ({ ...prev, minStockLevel: Number(e.target.value) }))}
                />
              </div>

              <div>
                <Label htmlFor="maxStockLevel">{t('parts.maxStock')}</Label>
                <Input
                  id="maxStockLevel"
                  type="number"
                  value={formData.maxStockLevel || ''}
                  placeholder="0"
                  onFocus={e => e.target.select()}
                  onChange={e => setFormData(prev => ({ ...prev, maxStockLevel: Number(e.target.value) }))}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="location">{t('parts.storageLocation')}</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={e => setFormData(prev => ({ ...prev, location: e.target.value }))}
                placeholder={t('parts.locationPlaceholder')}
              />
            </div>

            <div className="space-y-3 border-t pt-4">
              <h4 className="font-semibold">{t('parts.pricing')}</h4>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="costPrice">{t('parts.costPrice')}</Label>
                  <Input
                    id="costPrice"
                    type="number"
                    step="0.01"
                    value={formData.costPrice || ''}
                    placeholder="0.00"
                    onFocus={e => e.target.select()}
                    onChange={e => handleCostPriceChange(Number(e.target.value))}
                  />
                </div>

                <div>
                  <Label htmlFor="markup">{t('parts.markupPercent')}</Label>
                  <Input
                    id="markup"
                    type="number"
                    step="0.1"
                    value={formData.markup || ''}
                    placeholder="0"
                    onFocus={e => e.target.select()}
                    onChange={e => handleMarkupChange(Number(e.target.value))}
                  />
                </div>

                <div>
                  <Label htmlFor="sellingPrice">{t('parts.sellingPrice')}</Label>
                  <Input
                    id="sellingPrice"
                    type="number"
                    step="0.01"
                    value={formData.sellingPrice || ''}
                    placeholder="0.00"
                    onFocus={e => e.target.select()}
                    onChange={e => handleSellingPriceChange(Number(e.target.value))}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="taxRate">{t('parts.taxRate')}</Label>
                <Input
                  id="taxRate"
                  type="number"
                  step="0.1"
                  value={formData.taxRate || ''}
                  placeholder="0"
                  onFocus={e => e.target.select()}
                  onChange={e => setFormData(prev => ({ ...prev, taxRate: Number(e.target.value) }))}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="notes">{t('common.notes')}</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={e => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder={t('parts.notesPlaceholder')}
                rows={2}
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => {
                setIsAddModalOpen(false);
                setIsEditModalOpen(false);
                setEditingPart(null);
                resetForm();
              }}
            >
              {t('common.cancel')}
            </Button>
            <Button onClick={editingPart ? handleEditPart : handleAddPart}>
              {editingPart ? t('parts.updatePart') : t('parts.addPart')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
