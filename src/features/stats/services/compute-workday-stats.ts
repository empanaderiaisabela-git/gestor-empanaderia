import { MENU_GROUPS, type MenuGroup } from '@/features/menu/domain/menu-groups';
import { round2 } from '@/features/order/domain/order-pricing';
import { PAYMENT_TYPES, type PaymentType } from '@/features/order/domain/order-validation';
import type { StatsSale, StatsSnapshot, WorkdayStats } from '@/features/stats/domain/stats.schema';
import { saleRows, vendorRows } from './workday-tables';

type Shares = { byGroup: Record<MenuGroup, number>; promos: number };

const amount = (value: string | null): number => Number(value ?? 0);
const sumBy = <T>(rows: readonly T[], value: (row: T) => number): number => rows.reduce((total, row) => total + value(row), 0);
const zeroGroups = (): Record<MenuGroup, number> => ({ empanadas: 0, pizzas: 0, sanguches: 0, ciabattas: 0, coca_cola: 0, pepsi: 0 });
const zeroPayments = (): Record<PaymentType, number> => ({ efectivo: 0, transferencia: 0, debito: 0, credito: 0 });

function goodsOf(sale: StatsSale): number {
  return amount(sale.total) - sumBy(sale.payments, (payment) => amount(payment.surchargeAmount));
}

function addShares(sale: StatsSale, shares: Shares): void {
  const subtotal = sumBy(sale.lines, (line) => amount(line.subtotal));
  const factor = subtotal > 0 ? goodsOf(sale) / subtotal : 0;
  for (const line of sale.lines) {
    const share = amount(line.subtotal) * factor;
    if (line.group === null) shares.promos += share;
    else shares.byGroup[line.group] += share;
  }
}

function byPaymentOf(sales: readonly StatsSale[]): Record<PaymentType, number> {
  const totals = zeroPayments();
  for (const payment of sales.flatMap((sale) => sale.payments)) totals[payment.type] += amount(payment.amount) + amount(payment.surchargeAmount);
  for (const type of PAYMENT_TYPES) totals[type] = round2(totals[type]);
  return totals;
}

export function computeWorkdayStats(day: string, { sales, losses }: StatsSnapshot): WorkdayStats {
  const shares: Shares = { byGroup: zeroGroups(), promos: 0 };
  sales.forEach((sale) => addShares(sale, shares));
  for (const group of MENU_GROUPS) shares.byGroup[group] = round2(shares.byGroup[group]);
  const revenue = round2(sumBy(sales, (sale) => amount(sale.total)));
  const cost = sumBy(sales.flatMap((sale) => sale.items), (item) => amount(item.units) * amount(item.unitCost));
  const lost = sumBy(losses, (loss) => amount(loss.quantity) * amount(loss.unitCost));
  const tables = { vendorTable: vendorRows(sales), saleTable: saleRows(sales) };
  return { day, ...tables, byGroup: shares.byGroup, promos: round2(shares.promos), revenue, profit: round2(revenue - cost - lost), salesCount: sales.length, byPayment: byPaymentOf(sales) };
}
