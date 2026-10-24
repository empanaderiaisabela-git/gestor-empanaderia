import { and, gte, lte } from 'drizzle-orm';
import { db } from '@/lib/db';
import { productLosses, products, sales } from '@/lib/db/schema';
import type { DashboardRange, DashboardSnapshot } from '@/features/stats/domain/stats.schema';

const CONSISTENT_READ = { isolationLevel: 'repeatable read', accessMode: 'read only' } as const;

export async function getDashboardSnapshot({ start, end }: DashboardRange): Promise<DashboardSnapshot> {
  return db.transaction(async (tx) => {
    const productRows = await tx.select({ stock: products.stock, purchasePrice: products.purchasePrice }).from(products);
    const saleRows = await tx.query.sales.findMany({
      where: and(gte(sales.createdAt, start), lte(sales.createdAt, end)),
      columns: { total: true, vendorId: true },
      with: { vendor: { columns: { username: true } }, items: { columns: { unitCost: true, quantity: true } }, payments: { columns: { type: true, amount: true } } },
    });
    const lossRows = await tx.query.productLosses.findMany({
      where: and(gte(productLosses.createdAt, start), lte(productLosses.createdAt, end)),
      columns: { quantity: true },
      with: { product: { columns: { purchasePrice: true } } },
    });
    return { products: productRows, sales: saleRows, losses: lossRows };
  }, CONSISTENT_READ);
}
