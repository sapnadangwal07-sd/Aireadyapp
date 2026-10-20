'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import {
  DollarSign,
  Users,
  ShoppingBag,
  TrendingUp,
  ArrowUpRight,
  Clock,
  Ban,
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
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
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from '@/components/ui/chart';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { Button } from '@/components/ui/button';
import { useStore } from '@/lib/store';
import { formatCurrency, formatDate } from '@/lib/format';
import { OrderStatusBadge } from '@/components/status-badges';

const statusColors: Record<string, string> = {
  paid: 'hsl(var(--chart-3))',
  pending: 'hsl(var(--chart-4))',
  cancelled: 'hsl(var(--destructive))',
};

function StatCard({
  title,
  value,
  icon: Icon,
  hint,
  accent,
}: {
  title: string;
  value: string;
  icon: React.ElementType;
  hint?: string;
  accent: string;
}) {
  return (
    <Card className="relative overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <div className={`flex h-8 w-8 items-center justify-center rounded-md ${accent}`}>
          <Icon className="h-4 w-4" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  const { orders, customers } = useStore();

  const stats = useMemo(() => {
    const paidOrders = orders.filter((o) => o.status === 'paid');
    const pendingOrders = orders.filter((o) => o.status === 'pending');
    const cancelledOrders = orders.filter((o) => o.status === 'cancelled');
    const revenue = paidOrders.reduce((sum, o) => sum + o.total, 0);
    const pendingValue = pendingOrders.reduce((sum, o) => sum + o.total, 0);
    const activeCustomers = customers.filter((c) => c.status === 'active').length;
    return {
      revenue,
      pendingValue,
      activeCustomers,
      paidCount: paidOrders.length,
      pendingCount: pendingOrders.length,
      cancelledCount: cancelledOrders.length,
    };
  }, [orders, customers]);

  const monthlyRevenue = useMemo(() => {
    const byMonth: Record<string, { month: string; revenue: number; orders: number }> = {};
    orders
      .filter((o) => o.status === 'paid')
      .forEach((o) => {
        const d = new Date(o.createdAt);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        const label = d.toLocaleString('en-US', { month: 'short', year: '2-digit' });
        if (!byMonth[key]) byMonth[key] = { month: label, revenue: 0, orders: 0 };
        byMonth[key].revenue += o.total;
        byMonth[key].orders += 1;
      });
    return Object.values(byMonth).sort((a, b) => a.month.localeCompare(b.month));
  }, [orders]);

  const statusBreakdown = useMemo(() => {
    const counts: Record<string, number> = { paid: 0, pending: 0, cancelled: 0 };
    orders.forEach((o) => {
      counts[o.status] += 1;
    });
    return (Object.keys(counts) as Array<keyof typeof counts>).map((key) => ({
      status: key.charAt(0).toUpperCase() + key.slice(1),
      count: counts[key],
      fill: statusColors[key],
    }));
  }, [orders]);

  const recentOrders = useMemo(
    () =>
      [...orders]
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
        .slice(0, 5),
    [orders]
  );

  const revenueConfig: ChartConfig = {
    revenue: { label: 'Revenue', color: 'hsl(var(--chart-1))' },
  };
  const statusConfig: ChartConfig = {
    count: { label: 'Orders' },
  };

  return (
    <div className="space-y-6">
      {/* Summary cards - responsive grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          title="Total Revenue"
          value={formatCurrency(stats.revenue)}
          icon={DollarSign}
          hint={`${stats.paidCount} paid orders`}
          accent="bg-emerald-100 text-emerald-700"
        />
        <StatCard
          title="Total Customers"
          value={String(customers.length)}
          icon={Users}
          hint={`${stats.activeCustomers} active customers`}
          accent="bg-sky-100 text-sky-700"
        />
        <StatCard
          title="Total Sales"
          value={String(orders.length)}
          icon={ShoppingBag}
          hint={`${stats.pendingCount} pending · ${stats.paidCount} paid`}
          accent="bg-indigo-100 text-indigo-700"
        />
      </div>

      {/* Charts row */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingUp className="h-4 w-4 text-primary" />
              Revenue by month
            </CardTitle>
            <CardDescription>Paid orders grouped by month</CardDescription>
          </CardHeader>
          <CardContent>
            {monthlyRevenue.length === 0 ? (
              <p className="py-10 text-center text-sm text-muted-foreground">
                No paid orders yet.
              </p>
            ) : (
              <ChartContainer config={revenueConfig} className="h-[260px] w-full">
                <BarChart data={monthlyRevenue} margin={{ left: 8, right: 8 }}>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" />
                  <XAxis dataKey="month" tickLine={false} axisLine={false} />
                  <YAxis tickLine={false} axisLine={false} width={56} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="revenue" fill="var(--color-revenue)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Orders by status</CardTitle>
            <CardDescription>Distribution across all orders</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={statusConfig} className="mx-auto h-[260px]">
              <PieChart>
                <ChartTooltip content={<ChartTooltipContent nameKey="count" hideLabel />} />
                <Pie
                  data={statusBreakdown}
                  dataKey="count"
                  nameKey="status"
                  innerRadius={50}
                  outerRadius={85}
                  paddingAngle={3}
                >
                  {statusBreakdown.map((entry) => (
                    <Cell key={entry.status} fill={entry.fill} />
                  ))}
                </Pie>
                <ChartLegend content={<ChartLegendContent nameKey="status" />} />
              </PieChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Recent orders table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle className="text-base">Recent orders</CardTitle>
            <CardDescription>Latest activity in your workspace</CardDescription>
          </div>
          <Button asChild variant="outline" size="sm">
            <Link href="/orders">
              View all <ArrowUpRight className="ml-1.5 h-4 w-4" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent className="px-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-6">Order</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden sm:table-cell">Date</TableHead>
                  <TableHead className="text-right pr-6">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentOrders.map((o) => (
                  <TableRow key={o.id}>
                    <TableCell className="pl-6 font-medium">{o.number}</TableCell>
                    <TableCell className="text-muted-foreground">{o.customerName}</TableCell>
                    <TableCell><OrderStatusBadge status={o.status} /></TableCell>
                    <TableCell className="hidden sm:table-cell text-muted-foreground">
                      {formatDate(o.createdAt)}
                    </TableCell>
                    <TableCell className="text-right pr-6 font-medium">
                      {formatCurrency(o.total)}
                    </TableCell>
                  </TableRow>
                ))}
                {recentOrders.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="py-8 text-center text-sm text-muted-foreground">
                      No orders yet.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Secondary status cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Paid orders</CardTitle>
            <ShoppingBag className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.paidCount}</div>
            <p className="mt-1 text-xs text-muted-foreground">Completed transactions</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending orders</CardTitle>
            <Clock className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingCount}</div>
            <p className="mt-1 text-xs text-muted-foreground">Awaiting payment</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Cancelled orders</CardTitle>
            <Ban className="h-4 w-4 text-rose-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.cancelledCount}</div>
            <p className="mt-1 text-xs text-muted-foreground">Voided transactions</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
