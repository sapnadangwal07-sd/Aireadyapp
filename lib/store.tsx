'use client';

import React, { createContext, useContext, useMemo, useState } from 'react';
import { CatalogItem, Customer, Order } from '@/lib/types';
import { demoCatalog, demoCustomers, demoOrders } from '@/lib/demo-data';
import { uid } from '@/lib/format';

interface StoreValue {
  customers: Customer[];
  catalog: CatalogItem[];
  orders: Order[];
  addCustomer: (c: Omit<Customer, 'id' | 'createdAt'>) => Customer;
  updateCustomer: (id: string, c: Omit<Customer, 'id' | 'createdAt'>) => void;
  deleteCustomer: (id: string) => void;
  addCatalogItem: (c: Omit<CatalogItem, 'id' | 'createdAt'>) => CatalogItem;
  updateCatalogItem: (id: string, c: Omit<CatalogItem, 'id' | 'createdAt'>) => void;
  deleteCatalogItem: (id: string) => void;
  addOrder: (o: Omit<Order, 'id' | 'createdAt' | 'number'>) => Order;
  updateOrder: (id: string, o: Omit<Order, 'id' | 'createdAt' | 'number'>) => void;
  deleteOrder: (id: string) => void;
  resetDemoData: () => void;
}

const StoreContext = createContext<StoreValue | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [customers, setCustomers] = useState<Customer[]>(demoCustomers);
  const [catalog, setCatalog] = useState<CatalogItem[]>(demoCatalog);
  const [orders, setOrders] = useState<Order[]>(demoOrders);

  const value = useMemo<StoreValue>(() => {
    const addCustomer: StoreValue['addCustomer'] = (c) => {
      const created: Customer = {
        ...c,
        id: uid('c'),
        createdAt: new Date().toISOString(),
      };
      setCustomers((prev) => [created, ...prev]);
      return created;
    };
    const updateCustomer: StoreValue['updateCustomer'] = (id, c) => {
      setCustomers((prev) =>
        prev.map((item) => (item.id === id ? { ...item, ...c } : item))
      );
    };
    const deleteCustomer: StoreValue['deleteCustomer'] = (id) => {
      setCustomers((prev) => prev.filter((item) => item.id !== id));
    };

    const addCatalogItem: StoreValue['addCatalogItem'] = (c) => {
      const created: CatalogItem = {
        ...c,
        id: uid(c.type === 'service' ? 's' : 'p'),
        createdAt: new Date().toISOString(),
      };
      setCatalog((prev) => [created, ...prev]);
      return created;
    };
    const updateCatalogItem: StoreValue['updateCatalogItem'] = (id, c) => {
      setCatalog((prev) =>
        prev.map((item) => (item.id === id ? { ...item, ...c } : item))
      );
    };
    const deleteCatalogItem: StoreValue['deleteCatalogItem'] = (id) => {
      setCatalog((prev) => prev.filter((item) => item.id !== id));
    };

    const addOrder: StoreValue['addOrder'] = (o) => {
      const nextNum = `ORD-${1047 + orders.length}`;
      const created: Order = {
        ...o,
        id: uid('o'),
        number: nextNum,
        createdAt: new Date().toISOString(),
      };
      setOrders((prev) => [created, ...prev]);
      return created;
    };
    const updateOrder: StoreValue['updateOrder'] = (id, o) => {
      setOrders((prev) =>
        prev.map((item) => (item.id === id ? { ...item, ...o } : item))
      );
    };
    const deleteOrder: StoreValue['deleteOrder'] = (id) => {
      setOrders((prev) => prev.filter((item) => item.id !== id));
    };

    const resetDemoData: StoreValue['resetDemoData'] = () => {
      setCustomers(demoCustomers);
      setCatalog(demoCatalog);
      setOrders(demoOrders);
    };

    return {
      customers,
      catalog,
      orders,
      addCustomer,
      updateCustomer,
      deleteCustomer,
      addCatalogItem,
      updateCatalogItem,
      deleteCatalogItem,
      addOrder,
      updateOrder,
      deleteOrder,
      resetDemoData,
    };
  }, [customers, catalog, orders]);

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): StoreValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used within StoreProvider');
  return ctx;
}
