import Dexie, { type Table } from 'dexie';

export interface Product {
  id?: number;
  name: string;
  stock: number;
  purchasePrice: number; // Cost per unit (auto-calculated)
  sellingPrice: number;  // Set by user later
  unit: string;          // Default 'kg' or from last purchase
  supplier?: string;
  expiryDate?: string;   // Updated on every purchase
}

export interface Purchase {
  id?: number;
  productId: number;
  productName: string;
  quantity: number;
  unit: string;
  totalAmount: number;   // User enters this
  purchasePrice: number; // calculated: totalAmount / quantity
  amountPaid: number;
  remainingAmount: number;
  supplier: string;
  isPaid: boolean;
  date: Date;
  expiryDate?: string;
  billImageUrl?: string;
  payments?: {
    amount: number;
    date: Date;
    signature?: string;
  }[];
}

export interface SaleItem {
  productId: number;
  name: string;
  quantity: number;
  price: number;
  purchasePrice: number; // For profit calculation
}

export interface Sale {
  id?: number;
  date: Date;
  totalAmount: number;
  profit: number;
  items: SaleItem[];
  paymentMethod: 'cash' | 'upi' | 'credit';
  customerName?: string;
  isPaid: boolean;
}

export interface DailySummary {
  date: string; // YYYY-MM-DD
  totalSales: number;
  totalProfit: number;
}

export class VanigamDB extends Dexie {
  products!: Table<Product>;
  purchases!: Table<Purchase>;
  sales!: Table<Sale>;
  dailySummary!: Table<DailySummary>;

  constructor() {
    super('VanigamDB');
    this.version(3).stores({
      products: '++id, name, supplier, expiryDate',
      purchases: '++id, productId, productName, supplier, date, remainingAmount',
      sales: '++id, date, customerName, paymentMethod, isPaid',
      dailySummary: 'date'
    });
  }
}

export const db = new VanigamDB();
