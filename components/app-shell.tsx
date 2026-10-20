'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  Package,
  Receipt,
  Menu,
  Building2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/customers', label: 'Customers', icon: Users },
  { href: '/catalog', label: 'Products & Services', icon: Package },
  { href: '/orders', label: 'Sales & Orders', icon: Receipt },
];

function isActivePath(pathname: string, href: string) {
  return href === '/' ? pathname === '/' : pathname.startsWith(href);
}

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <nav className="flex flex-col gap-1">
      {navItems.map((item) => {
        const isActive = isActivePath(pathname, item.href);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              'group flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors',
              isActive
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
            )}
          >
            <Icon className="h-5 w-5" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

function SidebarContent() {
  return (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center gap-2.5 border-b px-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <Building2 className="h-5 w-5" />
        </div>
        <div className="flex flex-col">
          <span className="text-base font-semibold leading-tight">Mellinks</span>
          <span className="text-xs text-muted-foreground">Business Suite</span>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-3">
        <p className="px-3 pb-2 pt-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Menu
        </p>
        <NavLinks />
      </div>
      <div className="border-t p-4">
        <p className="text-xs text-muted-foreground">
          Demo workspace — data is in-memory and resets on reload.
        </p>
      </div>
    </div>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const active = navItems.find((i) => isActivePath(pathname, i.href));
  const pageTitle = active?.label ?? 'Dashboard';

  return (
    <div className="flex min-h-screen bg-secondary/40">
      <aside className="hidden w-64 shrink-0 border-r bg-card lg:block">
        <SidebarContent />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b bg-card/95 px-4 backdrop-blur lg:px-6">
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Open menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 p-0">
              <SheetTitle className="sr-only">Navigation</SheetTitle>
              <SheetDescription className="sr-only">
                Main application navigation
              </SheetDescription>
              <SidebarContent />
            </SheetContent>
          </Sheet>

          <h1 className="text-lg font-semibold">{pageTitle}</h1>

          <div className="ml-auto flex items-center gap-2">
            <span className="hidden text-sm text-muted-foreground sm:inline">
              Workspace owner
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
              LW
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}
