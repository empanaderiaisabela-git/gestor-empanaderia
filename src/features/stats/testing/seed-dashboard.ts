import { db } from '@/lib/db';
import { menuItems } from '@/lib/db/menu-schema';
import { saleLineItems, saleLines } from '@/lib/db/order-schema';
import { salePayments, sales, users } from '@/lib/db/schema';
import { stockLosses } from '@/lib/db/stock-schema';

export const DASHBOARD_RANGE = { start: new Date('2026-03-01T00:00:00Z'), end: new Date('2026-03-31T23:59:59Z') };

const IN_RANGE = new Date('2026-03-10T15:00:00Z');
const OUT_OF_RANGE = new Date('2025-01-01T12:00:00Z');

type SaleSeed = { vendorId: string; menuItemId: string; createdAt: Date };

async function insertSale({ vendorId, menuItemId, createdAt }: SaleSeed): Promise<void> {
  const [sale] = await db.insert(sales).values({ vendorId, total: '500.00', createdAt }).returning({ id: sales.id });
  const line = { saleId: sale.id, group: 'empanadas' as const, presentationKey: 'u1', quantity: 2, unitPrice: '250.00', subtotal: '500.00', description: 'Carne' };
  const [saleLine] = await db.insert(saleLines).values(line).returning({ id: saleLines.id });
  await db.insert(saleLineItems).values({ saleLineId: saleLine.id, menuItemId, units: '2', unitCost: '100.00' });
  await db.insert(salePayments).values([
    { saleId: sale.id, type: 'efectivo', amount: '300.00' },
    { saleId: sale.id, type: 'transferencia', amount: '200.00' },
  ]);
}

export async function seedDashboard(): Promise<void> {
  const [vendor] = await db.insert(users).values({ username: 'vendedora', passwordHash: 'hash-de-prueba', role: 'vendedor' }).returning({ id: users.id });
  const [item] = await db.insert(menuItems).values({ group: 'empanadas', name: 'Carne', unitCost: '100.00', stock: '10' }).returning({ id: menuItems.id });
  await insertSale({ vendorId: vendor.id, menuItemId: item.id, createdAt: IN_RANGE });
  await insertSale({ vendorId: vendor.id, menuItemId: item.id, createdAt: OUT_OF_RANGE });
  await db.insert(stockLosses).values({ menuItemId: item.id, userId: vendor.id, quantity: '1', unitCost: '100.00', reason: 'Rotura', createdAt: IN_RANGE });
}
