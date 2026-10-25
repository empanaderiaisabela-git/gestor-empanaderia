import type { PaymentType } from '@/features/order/domain/order-validation';
import type { DashboardRange, DashboardSale, DashboardSnapshot, DashboardStats, TopSeller } from '@/features/stats/domain/stats.schema';

const TOP_SELLERS_LIMIT = 5;
const UNKNOWN_VENDOR = { id: 'sistema', username: 'Sistema' };

type RangeInput = { startDate?: string; endDate?: string; now?: Date };

export function toDashboardRange({ startDate, endDate, now = new Date() }: RangeInput): DashboardRange {
  return {
    start: startDate ? new Date(`${startDate}T00:00:00`) : new Date(0),
    end: endDate ? new Date(`${endDate}T23:59:59`) : now,
  };
}

function sumBy<T>(rows: T[], value: (row: T) => number): number {
  return rows.reduce((total, row) => total + value(row), 0);
}

const amount = (value: string): number => Number(value || 0);

function collected(salesRows: DashboardSale[], type: PaymentType): number {
  const payments = salesRows.flatMap((sale) => sale.payments).filter((payment) => payment.type === type);
  return sumBy(payments, (payment) => amount(payment.amount));
}

function topSellers(salesRows: DashboardSale[]): TopSeller[] {
  const byVendor = new Map<string, TopSeller>();
  for (const sale of salesRows) {
    const key = sale.vendorId || UNKNOWN_VENDOR.id;
    const seller = byVendor.get(key) ?? { username: sale.vendor?.username || UNKNOWN_VENDOR.username, total: 0, count: 0 };
    byVendor.set(key, { ...seller, total: seller.total + amount(sale.total), count: seller.count + 1 });
  }
  return [...byVendor.values()].sort((a, b) => b.total - a.total).slice(0, TOP_SELLERS_LIMIT);
}

export function computeDashboardStats({ items, sales, losses }: DashboardSnapshot): DashboardStats {
  const totalRevenue = sumBy(sales, (sale) => amount(sale.total));
  const costOfGoodsSold = sumBy(sales.flatMap((sale) => sale.items), (item) => amount(item.unitCost) * amount(item.units));
  const totalLossCost = sumBy(losses, (loss) => amount(loss.unitCost) * amount(loss.quantity));
  return {
    totalUnits: sumBy(items, (item) => amount(item.stock)),
    totalItems: items.length,
    totalRevenue,
    currentInventoryCost: sumBy(items, (item) => amount(item.unitCost) * amount(item.stock)),
    netProfit: totalRevenue - costOfGoodsSold - totalLossCost,
    totalLossCost,
    topSellers: topSellers(sales),
    salesCount: sales.length,
    cashRevenue: collected(sales, 'efectivo'),
    transferRevenue: collected(sales, 'transferencia'),
    debitRevenue: collected(sales, 'debito'),
    creditRevenue: collected(sales, 'credito'),
  };
}
