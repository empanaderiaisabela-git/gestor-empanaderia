import { eq } from 'drizzle-orm';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { db } from '@/lib/db';
import { menuItems } from '@/lib/db/menu-schema';
import { saleLineItems, saleLines } from '@/lib/db/order-schema';
import { auditLogs, salePayments, sales } from '@/lib/db/schema';
import { TEST_USER_IDS } from '@/test/as-user';
import { seedBases } from '@/test/seed-bases';
import { seedTestUser } from '@/test/seed-test-user';
import { truncateAll } from '@/test/truncate-all';
import { checkoutService } from './checkout.service';
import { saleHistoryService } from './sale-history.service';

const VENDOR = { id: TEST_USER_IDS.vendedor };
const ADMIN = { id: TEST_USER_IDS.admin };

async function stockOf(id: string): Promise<number> {
  const [row] = await db.select({ stock: menuItems.stock }).from(menuItems).where(eq(menuItems.id, id));
  return Number(row.stock);
}

async function insertPizza(name: string, price1: string): Promise<string> {
  const [row] = await db.insert(menuItems).values({ group: 'pizzas', name, unitCost: '4000.00', stock: '0', price1 }).returning({ id: menuItems.id });
  return row.id;
}

describe('historial y anulación contra Postgres (US-7)', () => {
  let muzza: string;
  let napo: string;
  let prepizza: string;
  let saleId: string;

  beforeEach(async () => {
    await truncateAll();
    await seedTestUser('vendedor');
    await seedTestUser('admin');
    ({ pizzas: prepizza } = await seedBases(3));
    muzza = await insertPizza('Muzza', '11000.00');
    napo = await insertPizza('Napolitana', '12000.00');
    const half = { group: 'pizzas' as const, presentationKey: 'pizza_2', flavors: [{ menuItemId: muzza, units: 0.5 }, { menuItemId: napo, units: 0.5 }], quantity: 1 };
    const whole = { group: 'pizzas' as const, presentationKey: 'pizza_1', flavors: [{ menuItemId: muzza, units: 1 }], quantity: 2 };
    const payments = [{ type: 'efectivo' as const, amount: 20000 }, { type: 'transferencia' as const, amount: 14000 }];
    ({ saleId } = await checkoutService.checkout(VENDOR, { buyer: { customerId: null, name: 'Rocío', phone: '', address: '' }, lines: [half, whole], discountPercentage: 0, discountAmount: 0, payments }));
  });

  afterAll(async () => {
    await db.$client.end();
  });

  it('lista la venta con el vendedor, las líneas en el orden en que se cargaron y los dos pagos (CA-1)', async () => {
    const [sale] = await saleHistoryService.list();
    expect(sale).toMatchObject({ id: saleId, buyerName: 'Rocío', vendorName: 'vendedor', total: '34000.00' });
    expect(sale.lines.map(({ presentationKey, quantity, description }) => [presentationKey, quantity, description])).toEqual([
      ['pizza_2', 1, 'Muzza / Napolitana'],
      ['pizza_1', 2, 'Muzza'],
    ]);
    expect(sale.payments.map((payment) => payment.type).sort()).toEqual(['efectivo', 'transferencia']);
  });

  it('el cobro descontó 3 prepizzas, y otra pizza sin prepizzas da INSUFFICIENT_STOCK (US-29 CA-3)', async () => {
    expect([await stockOf(prepizza), await stockOf(muzza), await stockOf(napo)]).toEqual([0, 0, 0]);
    const one = { group: 'pizzas' as const, presentationKey: 'pizza_1', flavors: [{ menuItemId: napo, units: 1 }], quantity: 1 };
    const input = { buyer: { customerId: null, name: 'Rocío', phone: '', address: '' }, lines: [one], discountPercentage: 0, discountAmount: 0, payments: [{ type: 'efectivo' as const, amount: 12000 }] };
    await expect(checkoutService.checkout(VENDOR, input)).rejects.toMatchObject({ code: 'INSUFFICIENT_STOCK', message: 'No hay stock suficiente de Prepizza.' });
  });

  it('anular devuelve las 3 prepizzas (½ + ½ y 2 enteras), y borra líneas y pagos (CA-3; US-29 CA-4)', async () => {
    await saleHistoryService.voidSale(ADMIN, saleId);
    expect([await stockOf(prepizza), await stockOf(muzza), await stockOf(napo)]).toEqual([3, 0, 0]);
    expect([await db.select().from(sales), await db.select().from(saleLines), await db.select().from(saleLineItems), await db.select().from(salePayments)]).toEqual([[], [], [], []]);
    expect(await db.select({ action: auditLogs.action }).from(auditLogs).where(eq(auditLogs.entityId, saleId))).toEqual(expect.arrayContaining([{ action: 'CREAR' }, { action: 'ELIMINAR' }]));
  });

  it('dos anulaciones simultáneas: una anula y la otra recibe NOT_FOUND, sin reponer dos veces', async () => {
    const results = await Promise.allSettled([saleHistoryService.voidSale(ADMIN, saleId), saleHistoryService.voidSale(ADMIN, saleId)]);
    expect(results.map((result) => result.status).sort()).toEqual(['fulfilled', 'rejected']);
    expect(results.find((result) => result.status === 'rejected')).toMatchObject({ reason: { code: 'NOT_FOUND' } });
    expect(await stockOf(prepizza)).toBe(3);
  });

  it('una venta del modelo viejo, sin líneas, no aparece ni se puede anular', async () => {
    const [legacy] = await db.insert(sales).values({ vendorId: VENDOR.id, total: '100.00' }).returning({ id: sales.id });
    expect((await saleHistoryService.list()).map((sale) => sale.id)).toEqual([saleId]);
    await expect(saleHistoryService.voidSale(ADMIN, legacy.id)).rejects.toMatchObject({ code: 'NOT_FOUND' });
  });
});
