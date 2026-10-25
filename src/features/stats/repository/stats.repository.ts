import { and, eq, gte, inArray, lte } from 'drizzle-orm';
import { db } from '@/lib/db';
import { menuItems } from '@/lib/db/menu-schema';
import { saleLineItems, saleLines } from '@/lib/db/order-schema';
import { salePayments, sales, users } from '@/lib/db/schema';
import { stockLosses } from '@/lib/db/stock-schema';
import type { DbTransaction } from '@/lib/db/transaction';
import type { DashboardRange, DashboardSale, DashboardSnapshot } from '@/features/stats/domain/stats.schema';

const CONSISTENT_READ = { isolationLevel: 'repeatable read', accessMode: 'read only' } as const;

async function salesIn(tx: DbTransaction, { start, end }: DashboardRange): Promise<DashboardSale[]> {
  const rows = await tx
    .select({ id: sales.id, total: sales.total, vendorId: sales.vendorId, username: users.username })
    .from(sales)
    .innerJoin(users, eq(sales.vendorId, users.id))
    .where(and(gte(sales.createdAt, start), lte(sales.createdAt, end)));
  if (rows.length === 0) return [];
  const ids = rows.map((row) => row.id);
  const items = await tx
    .select({ saleId: saleLines.saleId, item: { units: saleLineItems.units, unitCost: saleLineItems.unitCost } })
    .from(saleLineItems)
    .innerJoin(saleLines, eq(saleLineItems.saleLineId, saleLines.id))
    .where(inArray(saleLines.saleId, ids));
  const payments = await tx.select({ saleId: salePayments.saleId, payment: { type: salePayments.type, amount: salePayments.amount } }).from(salePayments).where(inArray(salePayments.saleId, ids));
  return rows.map(({ id, total, vendorId, username }) => ({
    total,
    vendorId,
    vendor: { username },
    items: items.filter(({ saleId }) => saleId === id).map(({ item }) => item),
    payments: payments.filter(({ saleId }) => saleId === id).map(({ payment }) => payment),
  }));
}

export async function getDashboardSnapshot(range: DashboardRange): Promise<DashboardSnapshot> {
  return db.transaction(async (tx) => {
    const items = await tx.select({ stock: menuItems.stock, unitCost: menuItems.unitCost }).from(menuItems).where(eq(menuItems.isActive, true));
    const salesRows = await salesIn(tx, range);
    const losses = await tx
      .select({ quantity: stockLosses.quantity, unitCost: stockLosses.unitCost })
      .from(stockLosses)
      .where(and(gte(stockLosses.createdAt, range.start), lte(stockLosses.createdAt, range.end)));
    return { items, sales: salesRows, losses };
  }, CONSISTENT_READ);
}
