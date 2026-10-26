import { db } from '@/lib/db';
import { menuItems } from '@/lib/db/menu-schema';
import { saleLineItems, saleLines } from '@/lib/db/order-schema';
import { salePayments, sales, users } from '@/lib/db/schema';
import { stockLosses } from '@/lib/db/stock-schema';

export const SEEDED_WORKDAY = '2026-10-25';

const MOMENTS = {
  previousNight: new Date('2026-10-25T06:30:00-03:00'),
  lunch: new Date('2026-10-25T13:00:00-03:00'),
  afterMidnight: new Date('2026-10-26T00:30:00-03:00'),
  nextMorning: new Date('2026-10-26T07:00:00-03:00'),
};

type SaleSeed = { vendorId: string; menuItemId: string; createdAt: Date };

async function insertSale({ vendorId, menuItemId, createdAt }: SaleSeed): Promise<void> {
  const [sale] = await db.insert(sales).values({ vendorId, buyerName: 'Marta', total: '500.00', createdAt }).returning({ id: sales.id });
  const line = { saleId: sale.id, group: 'empanadas' as const, presentationKey: 'u1', quantity: 2, unitPrice: '250.00', subtotal: '500.00', description: 'Carne' };
  const [saleLine] = await db.insert(saleLines).values(line).returning({ id: saleLines.id });
  await db.insert(saleLineItems).values({ saleLineId: saleLine.id, menuItemId, units: '2', unitCost: '100.00' });
  await db.insert(salePayments).values([
    { saleId: sale.id, type: 'efectivo', amount: '300.00' },
    { saleId: sale.id, type: 'transferencia', amount: '200.00' },
  ]);
}

export async function seedWorkday(): Promise<void> {
  const [vendor] = await db.insert(users).values({ username: 'vendedora', passwordHash: 'hash-de-prueba', role: 'vendedor' }).returning({ id: users.id });
  const [item] = await db.insert(menuItems).values({ group: 'empanadas', name: 'Carne', unitCost: '100.00', stock: '10' }).returning({ id: menuItems.id });
  for (const createdAt of Object.values(MOMENTS)) await insertSale({ vendorId: vendor.id, menuItemId: item.id, createdAt });
  await db.insert(stockLosses).values({ menuItemId: item.id, userId: vendor.id, quantity: '1', unitCost: '100.00', reason: 'Rotura', createdAt: MOMENTS.lunch });
}
