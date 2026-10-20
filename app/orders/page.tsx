'use client';

import React, { useMemo, useState } from 'react';
import { Plus, Search, Pencil, Trash2, Receipt, Eye, X, Filter } from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader } from '@/components/page-header';
import { EmptyState } from '@/components/empty-state';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { OrderStatusBadge } from '@/components/status-badges';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { useStore } from '@/lib/store';
import { Order, OrderLine, OrderStatus } from '@/lib/types';
import { formatCurrency, formatDateTime } from '@/lib/format';

interface DraftLine {
  key: string;
  itemId: string;
  quantity: string;
}

interface FormState {
  customerId: string;
  status: OrderStatus;
  lines: DraftLine[];
}

type Errors = {
  customerId?: string;
  lines?: string;
  quantities?: Record<string, string>;
};

const emptyForm: FormState = {
  customerId: '',
  status: 'pending',
  lines: [],
};

export default function OrdersPage() {
  const { orders, customers, catalog, addOrder, updateOrder, deleteOrder } = useStore();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | OrderStatus>('all');

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [errors, setErrors] = useState<Errors>({});
  const [submitting, setSubmitting] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<Order | null>(null);
  const [viewTarget, setViewTarget] = useState<Order | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return orders.filter((o) => {
      const matchesSearch =
        !q ||
        o.number.toLowerCase().includes(q) ||
        o.customerName.toLowerCase().includes(q);
      const matchesStatus = statusFilter === 'all' || o.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [orders, search, statusFilter]);

  const totalForForm = useMemo(() => {
    return form.lines.reduce((sum, line) => {
      const item = catalog.find((c) => c.id === line.itemId);
      if (!item) return sum;
      const qty = Number(line.quantity) || 0;
      return sum + item.price * qty;
    }, 0);
  }, [form.lines, catalog]);

  function openAdd() {
    setEditingId(null);
    setForm({ customerId: '', status: 'pending', lines: [] });
    setErrors({});
    setDialogOpen(true);
  }

  function openEdit(order: Order) {
    setEditingId(order.id);
    setForm({
      customerId: order.customerId,
      status: order.status,
      lines: order.lines.map((l) => ({ key: `${l.itemId}-${Math.random()}`, itemId: l.itemId, quantity: String(l.quantity) })),
    });
    setErrors({});
    setDialogOpen(true);
  }

  function addLine() {
    setForm((prev) => ({
      ...prev,
      lines: [...prev.lines, { key: `line-${Date.now()}-${Math.random()}`, itemId: '', quantity: '1' }],
    }));
  }

  function updateLine(key: string, patch: Partial<DraftLine>) {
    setForm((prev) => ({
      ...prev,
      lines: prev.lines.map((l) => (l.key === key ? { ...l, ...patch } : l)),
    }));
    setErrors((prev) => {
      if (!prev.quantities) return prev;
      const next = { ...prev.quantities };
      delete next[key];
      return { ...prev, quantities: next };
    });
  }

  function removeLine(key: string) {
    setForm((prev) => ({ ...prev, lines: prev.lines.filter((l) => l.key !== key) }));
  }

  function validate(): Errors {
    const e: Errors = {};
    if (!form.customerId) e.customerId = 'Please select a customer.';
    if (form.lines.length === 0) {
      e.lines = 'Add at least one line item.';
    } else {
      const qErrors: Record<string, string> = {};
      let hasLineError = false;
      form.lines.forEach((l) => {
        if (!l.itemId) {
          qErrors[l.key] = 'Select an item.';
          hasLineError = true;
          return;
        }
        const qty = Number(l.quantity);
        if (!l.quantity.trim() || Number.isNaN(qty) || qty < 1 || !Number.isInteger(qty)) {
          qErrors[l.key] = 'Enter a whole number (min 1).';
          hasLineError = true;
        }
      });
      if (hasLineError) e.quantities = qErrors;
    }
    return e;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const validation = validate();
    setErrors(validation);
    if (Object.keys(validation).length > 0) return;

    setSubmitting(true);
    const customer = customers.find((c) => c.id === form.customerId);
    if (!customer) {
      setSubmitting(false);
      return;
    }
    const lines: OrderLine[] = form.lines.map((l) => {
      const item = catalog.find((c) => c.id === l.itemId)!;
      return {
        itemId: item.id,
        name: item.name,
        unitPrice: item.price,
        quantity: Number(l.quantity),
      };
    });
    const total = lines.reduce((sum, l) => sum + l.unitPrice * l.quantity, 0);
    const payload = {
      customerId: customer.id,
      customerName: customer.company,
      status: form.status,
      lines,
      total,
    };
    try {
      if (editingId) {
        updateOrder(editingId, payload);
        toast.success('Order updated', { description: customer.company });
      } else {
        addOrder(payload);
        toast.success('Order created', { description: customer.company });
      }
      setDialogOpen(false);
    } finally {
      setSubmitting(false);
    }
  }

  function confirmDelete() {
    if (!deleteTarget) return;
    deleteOrder(deleteTarget.id);
    toast.success('Order removed', { description: deleteTarget.number });
    setDeleteTarget(null);
  }

  return (
    <div>
      <PageHeader
        title="Sales & Orders"
        description={`${orders.length} orders tracked`}
        action={
          <Button onClick={openAdd} disabled={customers.length === 0 || catalog.length === 0}>
            <Plus className="mr-2 h-4 w-4" /> New order
          </Button>
        }
      />

      {customers.length === 0 || catalog.length === 0 ? (
        <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
          You need at least one customer and one catalog item before creating an order.
        </div>
      ) : null}

      <Card className="mb-4">
        <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by order number or customer"
              className="pl-9"
            />
          </div>
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as 'all' | OrderStatus)}>
            <SelectTrigger className="sm:w-44">
              <Filter className="mr-2 h-4 w-4 text-muted-foreground" />
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {filtered.length === 0 ? (
        <EmptyState
          icon={Receipt}
          title={orders.length === 0 ? 'No orders yet' : 'No matching orders'}
          description={
            orders.length === 0
              ? 'Create your first order to start tracking sales.'
              : 'Try adjusting your search or filter.'
          }
          action={
            orders.length === 0 ? (
              <Button onClick={openAdd} disabled={customers.length === 0 || catalog.length === 0}>
                <Plus className="mr-2 h-4 w-4" /> New order
              </Button>
            ) : (
              <Button variant="outline" onClick={() => { setSearch(''); setStatusFilter('all'); }}>
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
                  <TableHead className="pl-6">Order</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead className="hidden md:table-cell">Date</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="pr-6 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((o) => (
                  <TableRow key={o.id}>
                    <TableCell className="pl-6 font-medium">{o.number}</TableCell>
                    <TableCell className="text-muted-foreground">{o.customerName}</TableCell>
                    <TableCell className="hidden md:table-cell text-muted-foreground">{formatDateTime(o.createdAt)}</TableCell>
                    <TableCell className="text-muted-foreground">{o.lines.length}</TableCell>
                    <TableCell><OrderStatusBadge status={o.status} /></TableCell>
                    <TableCell className="text-right font-medium">{formatCurrency(o.total)}</TableCell>
                    <TableCell className="pr-6 text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => setViewTarget(o)} aria-label={`View ${o.number}`}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => openEdit(o)} aria-label={`Edit ${o.number}`}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeleteTarget(o)}
                          aria-label={`Delete ${o.number}`}
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

      {/* Add/Edit dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <form onSubmit={handleSubmit} noValidate>
            <DialogHeader>
              <DialogTitle>{editingId ? 'Edit order' : 'New order'}</DialogTitle>
              <DialogDescription>
                {editingId ? 'Update order details and line items.' : 'Select a customer and add line items.'}
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="customer">Customer</Label>
                <Select value={form.customerId} onValueChange={(v) => setForm((p) => ({ ...p, customerId: v }))}>
                  <SelectTrigger id="customer" aria-invalid={!!errors.customerId}>
                    <SelectValue placeholder="Select a customer" />
                  </SelectTrigger>
                  <SelectContent>
                    {customers.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name} — {c.company}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.customerId && <p className="text-sm text-destructive">{errors.customerId}</p>}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="status">Status</Label>
                <Select value={form.status} onValueChange={(v) => setForm((p) => ({ ...p, status: v as OrderStatus }))}>
                  <SelectTrigger id="status">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <div className="flex items-center justify-between">
                  <Label>Line items</Label>
                  <Button type="button" variant="outline" size="sm" onClick={addLine}>
                    <Plus className="mr-1.5 h-4 w-4" /> Add line
                  </Button>
                </div>

                {form.lines.length === 0 ? (
                  <p className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
                    No line items yet. Click "Add line" to add one.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {form.lines.map((line) => {
                      const item = catalog.find((c) => c.id === line.itemId);
                      const lineTotal = item ? item.price * (Number(line.quantity) || 0) : 0;
                      return (
                        <div key={line.key} className="grid grid-cols-[1fr_72px_auto] items-start gap-2 rounded-md border p-2">
                          <div className="grid gap-1">
                            <Select value={line.itemId} onValueChange={(v) => updateLine(line.key, { itemId: v })}>
                              <SelectTrigger className="h-9" aria-invalid={!!errors.quantities?.[line.key]}>
                                <SelectValue placeholder="Select item" />
                              </SelectTrigger>
                              <SelectContent>
                                {catalog.map((c) => (
                                  <SelectItem key={c.id} value={c.id}>
                                    {c.name} — {formatCurrency(c.price)}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            {errors.quantities?.[line.key] && (
                              <p className="text-xs text-destructive">{errors.quantities[line.key]}</p>
                            )}
                          </div>
                          <Input
                            className="h-9"
                            inputMode="numeric"
                            value={line.quantity}
                            onChange={(e) => updateLine(line.key, { quantity: e.target.value })}
                            placeholder="Qty"
                            aria-label="Quantity"
                          />
                          <div className="flex h-9 items-center gap-2">
                            <span className="hidden w-20 text-right text-xs text-muted-foreground sm:inline">
                              {item ? formatCurrency(lineTotal) : ''}
                            </span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:text-destructive"
                              onClick={() => removeLine(line.key)}
                              aria-label="Remove line"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
                {errors.lines && <p className="text-sm text-destructive">{errors.lines}</p>}
              </div>

              <div className="flex items-center justify-between rounded-md bg-secondary px-3 py-2">
                <span className="text-sm text-muted-foreground">Order total</span>
                <span className="text-lg font-semibold">{formatCurrency(totalForForm)}</span>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={submitting}>
                {editingId ? 'Save changes' : 'Create order'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* View dialog */}
      <Dialog open={!!viewTarget} onOpenChange={(open) => !open && setViewTarget(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Order {viewTarget?.number}</DialogTitle>
            <DialogDescription>
              {viewTarget ? formatDateTime(viewTarget.createdAt) : ''}
            </DialogDescription>
          </DialogHeader>
          {viewTarget && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-muted-foreground">Customer</p>
                  <p className="font-medium">{viewTarget.customerName}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Status</p>
                  <OrderStatusBadge status={viewTarget.status} />
                </div>
              </div>
              <Separator />
              <div className="space-y-2">
                {viewTarget.lines.map((l, i) => (
                  <div key={i} className="flex items-center justify-between text-sm">
                    <div>
                      <p className="font-medium">{l.name}</p>
                      <p className="text-muted-foreground">
                        {l.quantity} × {formatCurrency(l.unitPrice)}
                      </p>
                    </div>
                    <span className="font-medium">{formatCurrency(l.unitPrice * l.quantity)}</span>
                  </div>
                ))}
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Total</span>
                <span className="text-lg font-semibold">{formatCurrency(viewTarget.total)}</span>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Remove order?"
        description={
          deleteTarget
            ? `This will permanently remove order ${deleteTarget.number}. This action cannot be undone.`
            : ''
        }
        confirmLabel="Remove"
        onConfirm={confirmDelete}
      />
    </div>
  );
}
