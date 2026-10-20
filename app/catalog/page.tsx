'use client';

import React, { useMemo, useState } from 'react';
import { Plus, Search, Pencil, Trash2, Package, Filter } from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader } from '@/components/page-header';
import { EmptyState } from '@/components/empty-state';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { CatalogTypeBadge } from '@/components/status-badges';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tabs,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useStore } from '@/lib/store';
import { CatalogItem, CatalogType } from '@/lib/types';
import { formatCurrency } from '@/lib/format';

interface FormState {
  name: string;
  description: string;
  type: CatalogType;
  price: string;
  stock: string;
}

const emptyForm: FormState = {
  name: '',
  description: '',
  type: 'product',
  price: '',
  stock: '',
};

type Errors = Partial<Record<keyof FormState, string>>;

function validate(form: FormState): Errors {
  const e: Errors = {};
  if (!form.name.trim()) e.name = 'Name is required.';
  else if (form.name.trim().length < 2) e.name = 'Name must be at least 2 characters.';

  if (!form.price.trim()) e.price = 'Price is required.';
  else {
    const n = Number(form.price);
    if (Number.isNaN(n)) e.price = 'Price must be a number.';
    else if (n < 0) e.price = 'Price cannot be negative.';
  }

  if (form.type === 'product') {
    if (!form.stock.trim()) e.stock = 'Stock is required for products.';
    else {
      const s = Number(form.stock);
      if (Number.isNaN(s) || !Number.isInteger(s)) e.stock = 'Stock must be a whole number.';
      else if (s < 0) e.stock = 'Stock cannot be negative.';
    }
  }
  return e;
}

function toForm(item: CatalogItem): FormState {
  return {
    name: item.name,
    description: item.description,
    type: item.type,
    price: String(item.price),
    stock: item.stock === null ? '' : String(item.stock),
  };
}

export default function CatalogPage() {
  const { catalog, addCatalogItem, updateCatalogItem, deleteCatalogItem } = useStore();
  const [tab, setTab] = useState<'all' | CatalogType>('all');
  const [search, setSearch] = useState('');

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [errors, setErrors] = useState<Errors>({});
  const [submitting, setSubmitting] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<CatalogItem | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return catalog.filter((c) => {
      const matchesTab = tab === 'all' || c.type === tab;
      const matchesSearch =
        !q || c.name.toLowerCase().includes(q) || c.description.toLowerCase().includes(q);
      return matchesTab && matchesSearch;
    });
  }, [catalog, tab, search]);

  function openAdd() {
    setEditingId(null);
    setForm({ ...emptyForm, type: tab === 'service' ? 'service' : 'product' });
    setErrors({});
    setDialogOpen(true);
  }

  function openEdit(item: CatalogItem) {
    setEditingId(item.id);
    setForm(toForm(item));
    setErrors({});
    setDialogOpen(true);
  }

  function updateField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => {
      const next = { ...prev, [key]: value };
      if (key === 'type' && value === 'service') next.stock = '';
      return next;
    });
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const validation = validate(form);
    setErrors(validation);
    if (Object.keys(validation).length > 0) return;

    setSubmitting(true);
    const payload = {
      name: form.name.trim(),
      description: form.description.trim(),
      type: form.type,
      price: Number(form.price),
      stock: form.type === 'product' ? Number(form.stock) : null,
    };
    try {
      if (editingId) {
        updateCatalogItem(editingId, payload);
        toast.success('Item updated', { description: payload.name });
      } else {
        addCatalogItem(payload);
        toast.success('Item added', { description: payload.name });
      }
      setDialogOpen(false);
    } finally {
      setSubmitting(false);
    }
  }

  function confirmDelete() {
    if (!deleteTarget) return;
    deleteCatalogItem(deleteTarget.id);
    toast.success('Item removed', { description: deleteTarget.name });
    setDeleteTarget(null);
  }

  return (
    <div>
      <PageHeader
        title="Products & Services"
        description={`${catalog.length} items in your catalog`}
        action={
          <Button onClick={openAdd}>
            <Plus className="mr-2 h-4 w-4" /> Add item
          </Button>
        }
      />

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Tabs value={tab} onValueChange={(v) => setTab(v as 'all' | CatalogType)}>
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="product">Products</TabsTrigger>
            <TabsTrigger value="service">Services</TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="relative sm:w-72">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search catalog"
            className="pl-9"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={Package}
          title={catalog.length === 0 ? 'No catalog items yet' : 'No matching items'}
          description={
            catalog.length === 0
              ? 'Add a product or service to start selling it to your customers.'
              : 'Try a different search or tab.'
          }
          action={
            catalog.length === 0 ? (
              <Button onClick={openAdd}>
                <Plus className="mr-2 h-4 w-4" /> Add item
              </Button>
            ) : (
              <Button variant="outline" onClick={() => { setSearch(''); setTab('all'); }}>
                Clear filters
              </Button>
            )
          }
        />
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-6">Name</TableHead>
                  <TableHead className="hidden md:table-cell">Description</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Price</TableHead>
                  <TableHead className="hidden sm:table-cell text-right">Stock</TableHead>
                  <TableHead className="pr-6 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="pl-6 font-medium">{item.name}</TableCell>
                    <TableCell className="hidden md:table-cell max-w-xs truncate text-muted-foreground">
                      {item.description || '—'}
                    </TableCell>
                    <TableCell><CatalogTypeBadge type={item.type} /></TableCell>
                    <TableCell className="text-right font-medium">{formatCurrency(item.price)}</TableCell>
                    <TableCell className="hidden sm:table-cell text-right text-muted-foreground">
                      {item.stock === null ? '—' : item.stock}
                    </TableCell>
                    <TableCell className="pr-6 text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(item)} aria-label={`Edit ${item.name}`}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeleteTarget(item)}
                          aria-label={`Delete ${item.name}`}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <form onSubmit={handleSubmit} noValidate>
            <DialogHeader>
              <DialogTitle>{editingId ? 'Edit item' : 'Add catalog item'}</DialogTitle>
              <DialogDescription>
                {editingId ? 'Update product or service details.' : 'Create a new product or service.'}
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={form.name}
                  onChange={(e) => updateField('name', e.target.value)}
                  placeholder="Wireless headset"
                  aria-invalid={!!errors.name}
                />
                {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={form.description}
                  onChange={(e) => updateField('description', e.target.value)}
                  placeholder="Short description (optional)"
                  rows={3}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="type">Type</Label>
                <Select value={form.type} onValueChange={(v) => updateField('type', v as CatalogType)}>
                  <SelectTrigger id="type">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="product">Product</SelectItem>
                    <SelectItem value="service">Service</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="price">Price (USD)</Label>
                  <Input
                    id="price"
                    inputMode="decimal"
                    value={form.price}
                    onChange={(e) => updateField('price', e.target.value)}
                    placeholder="0.00"
                    aria-invalid={!!errors.price}
                  />
                  {errors.price && <p className="text-sm text-destructive">{errors.price}</p>}
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="stock">Stock</Label>
                  <Input
                    id="stock"
                    inputMode="numeric"
                    value={form.stock}
                    onChange={(e) => updateField('stock', e.target.value)}
                    placeholder={form.type === 'service' ? 'N/A' : '0'}
                    disabled={form.type === 'service'}
                    aria-invalid={!!errors.stock}
                  />
                  {errors.stock && <p className="text-sm text-destructive">{errors.stock}</p>}
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={submitting}>
                {editingId ? 'Save changes' : 'Add item'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Remove item?"
        description={
          deleteTarget
            ? `This will remove ${deleteTarget.name} from your catalog. This action cannot be undone.`
            : ''
        }
        confirmLabel="Remove"
        onConfirm={confirmDelete}
      />
    </div>
  );
}
