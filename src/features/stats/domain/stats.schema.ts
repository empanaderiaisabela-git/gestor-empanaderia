import type { productLosses, products, saleItems, salePayments, sales } from '@/lib/db/schema';

type ProductRow = typeof products.$inferSelect;

export type DashboardRange = {
  start: Date;
  end: Date;
};

export type DashboardSale = Pick<typeof sales.$inferSelect, 'total' | 'vendorId'> & {
  vendor: { username: string } | null;
  items: Pick<typeof saleItems.$inferSelect, 'unitCost' | 'quantity'>[];
  payments: Pick<typeof salePayments.$inferSelect, 'type' | 'amount'>[];
};

export type DashboardLoss = Pick<typeof productLosses.$inferSelect, 'quantity'> & {
  product: Pick<ProductRow, 'purchasePrice'> | null;
};

export type DashboardSnapshot = {
  products: Pick<ProductRow, 'stock' | 'purchasePrice'>[];
  sales: DashboardSale[];
  losses: DashboardLoss[];
};

export type TopSeller = {
  username: string;
  total: number;
  count: number;
};

export type DashboardStats = {
  totalEquipos: number;
  totalModels: number;
  totalRevenue: number;
  currentInventoryCost: number;
  netProfit: number;
  totalLossCost: number;
  topSellers: TopSeller[];
  salesCount: number;
  cashRevenue: number;
  transferRevenue: number;
};
