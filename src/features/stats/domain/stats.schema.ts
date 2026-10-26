import type { MenuGroup } from '@/features/menu/domain/menu-groups';
import type { PaymentType } from '@/features/order/domain/order-validation';

export type StatsLine = { group: MenuGroup | null; subtotal: string };
export type StatsPayment = { type: PaymentType; amount: string; surchargeAmount: string | null };

export type StatsSale = {
  createdAt: Date;
  total: string;
  buyerName: string | null;
  vendor: string;
  lines: StatsLine[];
  items: { units: string; unitCost: string }[];
  payments: StatsPayment[];
};

export type StatsSnapshot = { sales: StatsSale[]; losses: { quantity: string; unitCost: string }[] };

export type WorkdayStats = {
  day: string;
  byGroup: Record<MenuGroup, number>;
  promos: number;
  revenue: number;
  profit: number;
  salesCount: number;
  byPayment: Record<PaymentType, number>;
};
