import { Badge } from '@/components/ui/badge';
import { CustomerStatus, OrderStatus, CatalogType } from '@/lib/types';

const customerStatusMap: Record<CustomerStatus, { label: string; className: string }> = {
  active: { label: 'Active', className: 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100' },
  inactive: { label: 'Inactive', className: 'bg-slate-200 text-slate-600 hover:bg-slate-200' },
  lead: { label: 'Lead', className: 'bg-amber-100 text-amber-700 hover:bg-amber-100' },
};

export function CustomerStatusBadge({ status }: { status: CustomerStatus }) {
  const cfg = customerStatusMap[status];
  return <Badge className={cfg.className}>{cfg.label}</Badge>;
}

const orderStatusMap: Record<OrderStatus, { label: string; className: string }> = {
  paid: { label: 'Paid', className: 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100' },
  pending: { label: 'Pending', className: 'bg-amber-100 text-amber-700 hover:bg-amber-100' },
  cancelled: { label: 'Cancelled', className: 'bg-rose-100 text-rose-700 hover:bg-rose-100' },
};

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const cfg = orderStatusMap[status];
  return <Badge className={cfg.className}>{cfg.label}</Badge>;
}

export function CatalogTypeBadge({ type }: { type: CatalogType }) {
  return type === 'service' ? (
    <Badge variant="secondary" className="bg-sky-100 text-sky-700 hover:bg-sky-100">
      Service
    </Badge>
  ) : (
    <Badge variant="secondary" className="bg-indigo-100 text-indigo-700 hover:bg-indigo-100">
      Product
    </Badge>
  );
}
