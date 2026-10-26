import { round2 } from '@/features/order/domain/order-pricing';
import { buyerLabel } from '@/features/order/domain/sale-history.schema';
import { SHIFTS, shiftOf } from '@/features/stats/domain/shift';
import type { SaleRow, StatsSale, VendorRow } from '@/features/stats/domain/stats.schema';

export function vendorRows(sales: readonly StatsSale[]): VendorRow[] {
  const rows = new Map<string, VendorRow>();
  for (const sale of sales) {
    const shift = shiftOf(sale.createdAt);
    const key = `${sale.vendor}|${shift}`;
    const row = rows.get(key) ?? { vendor: sale.vendor, shift, count: 0, amount: 0 };
    rows.set(key, { ...row, count: row.count + 1, amount: round2(row.amount + Number(sale.total)) });
  }
  return [...rows.values()].sort((a, b) => a.vendor.localeCompare(b.vendor) || SHIFTS.indexOf(a.shift) - SHIFTS.indexOf(b.shift));
}

export function saleRows(sales: readonly StatsSale[]): SaleRow[] {
  return [...sales]
    .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
    .map((sale) => ({ buyer: buyerLabel(sale.buyerName), at: sale.createdAt.toISOString(), amount: Number(sale.total) }));
}
