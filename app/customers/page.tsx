'use client';

import React, { useMemo, useState } from 'react';
import { Plus, Search, Pencil, Trash2, Users, Filter } from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader } from '@/components/page-header';
import { EmptyState } from '@/components/empty-state';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { CustomerStatusBadge } from '@/components/status-badges';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useStore } from '@/lib/store';
import { Customer, CustomerStatus } from '@/lib/types';
import { formatDate } from '@/lib/format';

interface FormState {
  name: string;
  email: string;
  phone: string;
  company: string;
  status: CustomerStatus;
}

const emptyForm: FormState = {
  name: '',
  email: '',
  phone: '',
  company: '',
  status: 'active',
};

type Errors = Partial<Record<keyof FormState, string>>;

function validate(form: FormState): Errors {
  const e: Errors = {};
  if (!form.name.trim()) e.name = 'Name is required.';
  else if (form.name.trim().length < 2) e.name = 'Name must be at least 2 characters.';

  if (!form.email.trim()) e.email = 'Email is required.';
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim()))
    e.email = 'Enter a valid email address.';

  if (form.phone && form.phone.trim().length < 6) e.phone = 'Phone number looks too short.';

  if (!form.company.trim()) e.company = 'Company is required.';
  return e;
}

export default function CustomersPage() {
  const { customers, addCustomer, updateCustomer, deleteCustomer } = useStore();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | CustomerStatus>('all');

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [errors, setErrors] = useState<Errors>({});
  const [submitting, setSubmitting] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<Customer | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return customers.filter((c) => {
      const matchesSearch =
        !q ||
        c.name.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        c.company.toLowerCase().includes(q) ||
        c.phone.toLowerCase().includes(q);
      const matchesStatus = statusFilter === 'all' || c.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [customers, search, statusFilter]);

  function openAdd() {
    setEditingId(null);
    setForm(emptyForm);
    setErrors({});
    setDialogOpen(true);
  }

  function openEdit(c: Customer) {
    setEditingId(c.id);
    setForm({
      name: c.name,
      email: c.email,
      phone: c.phone,
      company: c.company,
      status: c.status,
    });
    setErrors({});
    setDialogOpen(true);
  }

  function updateField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
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
      email: form.email.trim(),
      phone: form.phone.trim(),
      company: form.company.trim(),
      status: form.status,
    };
    try {
      if (editingId) {
        updateCustomer(editingId, payload);
        toast.success('Customer updated', { description: payload.name });
      } else {
        addCustomer(payload);
        toast.success('Customer added', { description: payload.name });
      }
      setDialogOpen(false);
    } finally {
      setSubmitting(false);
    }
  }

  function confirmDelete() {
    if (!deleteTarget) return;
    deleteCustomer(deleteTarget.id);
    toast.success('Customer removed', { description: deleteTarget.name });
    setDeleteTarget(null);
  }

  return (
    <div>
      <PageHeader
        title="Customers"
        description={`${customers.length} contacts in your directory`}
        action={
          <Button onClick={openAdd}>
            <Plus className="mr-2 h-4 w-4" /> Add customer
          </Button>
        }
      />

      <Card className="mb-4">
        <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, email, company or phone"
              className="pl-9"
            />
          </div>
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as 'all' | CustomerStatus)}>
            <SelectTrigger className="sm:w-44">
              <Filter className="mr-2 h-4 w-4 text-muted-foreground" />
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
              <SelectItem value="lead">Lead</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {filtered.length === 0 ? (
        <EmptyState
          icon={Users}
          title={customers.length === 0 ? 'No customers yet' : 'No matching customers'}
          description={
            customers.length === 0
              ? 'Add your first customer to start tracking your business relationships.'
              : 'Try adjusting your search or filter.'
          }
          action={
            customers.length === 0 ? (
              <Button onClick={openAdd}>
                <Plus className="mr-2 h-4 w-4" /> Add customer
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
                  <TableHead className="pl-6">Name</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead className="hidden md:table-cell">Email</TableHead>
                  <TableHead className="hidden lg:table-cell">Phone</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden md:table-cell">Added</TableHead>
                  <TableHead className="pr-6 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="pl-6 font-medium">{c.name}</TableCell>
                    <TableCell className="text-muted-foreground">{c.company}</TableCell>
                    <TableCell className="hidden md:table-cell text-muted-foreground">{c.email}</TableCell>
                    <TableCell className="hidden lg:table-cell text-muted-foreground">{c.phone}</TableCell>
                    <TableCell><CustomerStatusBadge status={c.status} /></TableCell>
                    <TableCell className="hidden md:table-cell text-muted-foreground">{formatDate(c.createdAt)}</TableCell>
                    <TableCell className="pr-6 text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(c)} aria-label={`Edit ${c.name}`}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeleteTarget(c)}
                          aria-label={`Delete ${c.name}`}
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
              <DialogTitle>{editingId ? 'Edit customer' : 'Add customer'}</DialogTitle>
              <DialogDescription>
                {editingId ? 'Update contact details below.' : 'Fill in the details to add a new customer.'}
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Full name</Label>
                <Input
                  id="name"
                  value={form.name}
                  onChange={(e) => updateField('name', e.target.value)}
                  placeholder="Jane Doe"
                  aria-invalid={!!errors.name}
                />
                {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="company">Company</Label>
                <Input
                  id="company"
                  value={form.company}
                  onChange={(e) => updateField('company', e.target.value)}
                  placeholder="Acme Inc."
                  aria-invalid={!!errors.company}
                />
                {errors.company && <p className="text-sm text-destructive">{errors.company}</p>}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={form.email}
                  onChange={(e) => updateField('email', e.target.value)}
                  placeholder="jane@acme.com"
                  aria-invalid={!!errors.email}
                />
                {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={form.phone}
                  onChange={(e) => updateField('phone', e.target.value)}
                  placeholder="+1 (555) 000-0000"
                  aria-invalid={!!errors.phone}
                />
                {errors.phone && <p className="text-sm text-destructive">{errors.phone}</p>}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="status">Status</Label>
                <Select value={form.status} onValueChange={(v) => updateField('status', v as CustomerStatus)}>
                  <SelectTrigger id="status">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="lead">Lead</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={submitting}>
                {editingId ? 'Save changes' : 'Add customer'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Remove customer?"
        description={
          deleteTarget
            ? `This will remove ${deleteTarget.name} from your directory. This action cannot be undone.`
            : ''
        }
        confirmLabel="Remove"
        onConfirm={confirmDelete}
      />
    </div>
  );
}
