import type { PaymentType } from '@/features/order/domain/order-validation';

export type DashboardRange = {
  start: Date;
  end: Date;
};

export type DashboardItem = { stock: string; unitCost: string };

export type DashboardSale = {
  total: string;
  vendorId: string;
  vendor: { username: string } | null;
  items: { units: string; unitCost: string }[];
  payments: { type: PaymentType; amount: string }[];
};

export type DashboardLoss = { quantity: string; unitCost: string };

export type DashboardSnapshot = {
  items: DashboardItem[];
  sales: DashboardSale[];
  losses: DashboardLoss[];
};

export type TopSeller = {
  username: string;
  total: number;
  count: number;
};

export type DashboardStats = {
  totalUnits: number;
  totalItems: number;
  totalRevenue: number;
  currentInventoryCost: number;
  netProfit: number;
  totalLossCost: number;
  topSellers: TopSeller[];
  salesCount: number;
  cashRevenue: number;
  transferRevenue: number;
  debitRevenue: number;
  creditRevenue: number;
};
