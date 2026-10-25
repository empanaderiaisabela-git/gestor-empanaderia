import type { DashboardLoss, DashboardRange, DashboardSale, DashboardSnapshot, DashboardStats, TopSeller } from '@/features/stats/domain/stats.schema';

const TOP_SELLERS_LIMIT = 5;
const UNKNOWN_VENDOR = { id: 'sistema', username: 'Sistema' };

type RangeInput = { startDate?: string; endDate?: string; now?: Date };
type PaymentType = DashboardSale['payments'][number]['type'];

export function toDashboardRange({ startDate, endDate, now = new Date() }: RangeInput): DashboardRange {
  return {
    start: startDate ? new Date(`${startDate}T00:00:00`) : new Date(0),
    end: endDate ? new Date(`${endDate}T23:59:59`) : now,
  };
}

function sumBy<T>(rows: T[], value: (row: T) => number): number {
  return rows.reduce((total, row) => total + value(row), 0);
}

function collected(salesRows: DashboardSale[], type: PaymentType): number {
  const payments = salesRows.flatMap((sale) => sale.payments).filter((payment) => payment.type === type);
  return sumBy(payments, (payment) => Number(payment.amount));
}

function lossCost(loss: DashboardLoss): number {
  return Number(loss.product?.purchasePrice || 0) * (loss.quantity || 0);
}

function topSellers(salesRows: DashboardSale[]): TopSeller[] {
  const byVendor = new Map<string, TopSeller>();
  for (const sale of salesRows) {
    const key = sale.vendorId || UNKNOWN_VENDOR.id;
    const seller = byVendor.get(key) ?? { username: sale.vendor?.username || UNKNOWN_VENDOR.username, total: 0, count: 0 };
    byVendor.set(key, { ...seller, total: seller.total + Number(sale.total), count: seller.count + 1 });
  }
  return [...byVendor.values()].sort((a, b) => b.total - a.total).slice(0, TOP_SELLERS_LIMIT);
}

export function computeDashboardStats({ products, sales, losses }: DashboardSnapshot): DashboardStats {
  const totalRevenue = sumBy(sales, (sale) => Number(sale.total));
  const costOfGoodsSold = sumBy(sales.flatMap((sale) => sale.items), (item) => Number(item.unitCost || 0) * item.quantity);
  const totalLossCost = sumBy(losses, lossCost);
  return {
    totalEquipos: sumBy(products, (product) => Number(product.stock || 0)),
    totalModels: products.length,
    totalRevenue,
    currentInventoryCost: sumBy(products, (product) => Number(product.purchasePrice || 0) * Number(product.stock || 0)),
    netProfit: totalRevenue - costOfGoodsSold - totalLossCost,
    totalLossCost,
    topSellers: topSellers(sales),
    salesCount: sales.length,
    cashRevenue: collected(sales, 'efectivo'),
    transferRevenue: collected(sales, 'transferencia'),
  };
}
