export type CustomerStatus = 'active' | 'inactive' | 'lead';

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  status: CustomerStatus;
  createdAt: string;
}

export type CatalogType = 'product' | 'service';

export interface CatalogItem {
  id: string;
  name: string;
  description: string;
  type: CatalogType;
  price: number;
  stock: number | null; // null for services
  createdAt: string;
}

export type OrderStatus = 'pending' | 'paid' | 'cancelled';

export interface OrderLine {
  itemId: string;
  name: string;
  unitPrice: number;
  quantity: number;
}

export interface Order {
  id: string;
  number: string;
  customerId: string;
  customerName: string;
  status: OrderStatus;
  lines: OrderLine[];
  total: number;
  createdAt: string;
}
