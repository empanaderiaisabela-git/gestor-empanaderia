import { and, eq, gte, inArray, lte } from 'drizzle-orm';
import { db } from '@/lib/db';
import { saleLineItems, saleLines } from '@/lib/db/order-schema';
import { salePayments, sales, users } from '@/lib/db/schema';
import { stockLosses } from '@/lib/db/stock-schema';
import type { DbTransaction } from '@/lib/db/transaction';
import type { StatsSale, StatsSnapshot } from '@/features/stats/domain/stats.schema';
import type { WorkdayRange } from '@/features/stats/domain/workday';

const CONSISTENT_READ = { isolationLevel: 'repeatable read', accessMode: 'read only' } as const;
const SALE_COLUMNS = { id: sales.id, createdAt: sales.createdAt, total: sales.total, buyerName: sales.buyerName, vendor: users.username };

async function detailsOf(tx: DbTransaction, ids: string[]) {
  const lines = await tx.select({ saleId: saleLines.saleId, line: { group: saleLines.group, subtotal: saleLines.subtotal } }).from(saleLines).where(inArray(saleLines.saleId, ids));
  const items = await tx
    .select({ saleId: saleLines.saleId, item: { units: saleLineItems.units, unitCost: saleLineItems.unitCost } })
    .from(saleLineItems)
    .innerJoin(saleLines, eq(saleLineItems.saleLineId, saleLines.id))
    .where(inArray(saleLines.saleId, ids));
  const payments = await tx
    .select({ saleId: salePayments.saleId, payment: { type: salePayments.type, amount: salePayments.amount, surchargeAmount: salePayments.surchargeAmount } })
    .from(salePayments)
    .where(inArray(salePayments.saleId, ids));
  return { lines, items, payments };
}

async function salesIn(tx: DbTransaction, { start, end }: WorkdayRange): Promise<StatsSale[]> {
  const rows = await tx.select(SALE_COLUMNS).from(sales).innerJoin(users, eq(sales.vendorId, users.id)).where(and(gte(sales.createdAt, start), lte(sales.createdAt, end)));
  if (rows.length === 0) return [];
  const { lines, items, payments } = await detailsOf(tx, rows.map((row) => row.id));
  return rows.map(({ id, ...sale }) => ({
    ...sale,
    lines: lines.filter((row) => row.saleId === id).map(({ line }) => line),
    items: items.filter((row) => row.saleId === id).map(({ item }) => item),
    payments: payments.filter((row) => row.saleId === id).map(({ payment }) => payment),
  }));
}

export async function getWorkdaySnapshot(range: WorkdayRange): Promise<StatsSnapshot> {
  return db.transaction(async (tx) => {
    const salesRows = await salesIn(tx, range);
    const losses = await tx
      .select({ quantity: stockLosses.quantity, unitCost: stockLosses.unitCost })
      .from(stockLosses)
      .where(and(gte(stockLosses.createdAt, range.start), lte(stockLosses.createdAt, range.end)));
    return { sales: salesRows, losses };
  }, CONSISTENT_READ);
}
