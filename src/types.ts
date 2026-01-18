// Tipos principales de la aplicación

// ========== SISTEMA DE DIVISAS ==========
export type Currency = 'ARS' | 'USD';

export interface ExchangeRate {
  id: string;
  fromCurrency: Currency;
  toCurrency: Currency;
  rate: number; // Ej: 1 USD = 1000 ARS
  date: Date;
  source: string; // Ej: "Manual", "DolarHoy", etc.
}

export interface CurrencyAmount {
  amount: number;
  currency: Currency;
}

// Información de conversión usada en una operación
export interface ConversionSnapshot {
  originalAmount: number;
  originalCurrency: Currency;
  convertedAmount: number;
  convertedCurrency: Currency;
  exchangeRate: number;
  exchangeRateDate: Date;
}

export type UserRole = 'owner' | 'seller';

export interface User {
  id: string;
  username: string;
  password: string; // En un entorno real, esto sería un hash
  name: string;
  role: UserRole;
  createdAt: Date;
}

export type ProductStatus = 'in_stock' | 'incoming' | 'reserved';

export interface Product {
  id: string;
  code: string; // Generado automáticamente
  name: string;
  description?: string; // Nuevo
  category?: string;    // Nuevo
  size?: string;        // Nuevo: Medida
  color: string;
  cost: number;
  price: number;
  currency: Currency; // ARS o USD
  stock: number;
  minStock: number;
  supplier: string;
  image_url?: string;   // Nuevo
  status: ProductStatus;
  createdAt: Date;
  updatedAt: Date;
  syncStatus?: 'synced' | 'pending';
}

export interface Customer {
  id: string;
  name: string;
  lastName: string;
  phone: string;
  email: string;
  cuil?: string; // Nuevo
  address: string;
  city?: string;     // Nuevo
  province?: string; // Nuevo
  notes?: string;    // Nuevo
  createdAt: Date;
  updatedAt: Date;
  syncStatus?: 'synced' | 'pending';
}

export interface StockMovement {
  id: string;
  productId: string;
  quantity: number;
  cost: number;
  type: 'in' | 'out';
  date: Date;
  notes?: string;
  userId?: string;
  syncStatus?: 'synced' | 'pending';
}

export interface PaymentMethodConfig {
  id: string;
  name: string;
  surchargePercentage: number;
  active: boolean;
  type: 'cash' | 'card' | 'transfer' | 'other';
}

export interface PaymentDetails {
  methodId: string;
  methodName: string;
  subtotal: number;
  surcharge: number;
  total: number;
}

export interface SaleItem {
  productId: string;
  productName: string;
  size?: string; // Nuevo: Medida snapshot
  quantity: number;
  unitPrice: number;
  currency: Currency; // Moneda original del producto
  subtotal: number;
  cost: number;
  profit: number;
}

export type PaymentStatus = 'paid' | 'pending' | 'partial';

export interface Sale {
  id: string;
  saleNumber: string;
  customerId: string;
  customerName: string;
  buyerCuil?: string; // Nuevo
  customerAddress: string;
  items: SaleItem[];
  subtotal: number;
  payment: PaymentDetails;
  total: number;
  currency: Currency; // Moneda en la que se realizó la venta
  exchangeRateSnapshot?: ExchangeRate; // Tipo de cambio congelado al momento de la venta
  // Nuevos campos para control de pagos
  paymentStatus: PaymentStatus;
  amountPaid: number;  // Lo que pagó en el momento
  balance: number;     // Saldo deudor

  totalCost: number;
  totalProfit: number;
  date: Date;
  notes?: string;
  userId?: string;
  userName?: string;
  syncStatus?: 'synced' | 'pending';
}

export type DeliveryType = 'paid' | 'cash_on_delivery' | 'pending';

export interface DeliveryNote {
  id: string;
  noteNumber: string;
  saleId: string;
  customerId: string;
  customerName: string;
  customerAddress: string;
  customerCity?: string;     // Nuevo para remito
  customerProvince?: string; // Nuevo para remito
  items: SaleItem[];
  total: number;
  amountToCollect?: number; // Monto a cobrar contra entrega
  deliveryType: DeliveryType; // Tipo de entrega: pagado, contra entrega o pendiente
  date: Date;
  notes?: string;
}

export interface DashboardStats {
  totalStock: number;
  lowStockProducts: Product[];
  todaySalesCount: number; // Corrección: antes era todaySales number, ahora separo count y total
  todaySalesTotal: number;
  monthSalesCount: number;
  monthSalesTotal: number;
  totalProfit: number; // Deprecated or kept for compatibility? Mejor quitamos si no se usa o adaptamos
  todayProfit: number;
  monthProfit: number;
  topProducts: {
    product: Product;
    quantity: number;
    revenue: number;
  }[];
}

export interface Expense {
  id: string;
  description: string;
  amount: number;
  category: string; // 'alquiler', 'servicios', 'sueldos', 'vrios', 'impuestos', 'otros'
  date: Date;
  notes?: string;
  userId?: string;
}

export type ViewType = 'pos' | 'dashboard' | 'products' | 'stock' | 'customers' | 'sales' | 'delivery-notes' | 'accounts-receivable' | 'reports' | 'expenses' | 'admin' | 'settings';
