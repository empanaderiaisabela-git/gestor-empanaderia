import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { db } from '@/lib/db';
import { menuItems } from '@/lib/db/menu-schema';
import { TEST_USER_IDS } from '@/test/as-user';
import { seedBases } from '@/test/seed-bases';
import { seedTestUser } from '@/test/seed-test-user';
import { truncateAll } from '@/test/truncate-all';
import { checkoutService } from './checkout.service';
import { saleHistoryService } from './sale-history.service';

const VENDOR = { id: TEST_USER_IDS.vendedor };
const BUYER = { customerId: null, name: 'Rocío', phone: '', address: '' };
const cash = (amount: number) => [{ type: 'efectivo' as const, amount }];

describe('lo que lee la comanda del historial contra Postgres (US-65)', () => {
  let muzza: string;
  let napo: string;

  beforeEach(async () => {
    await truncateAll();
    await seedTestUser('vendedor');
    await seedBases(3);
    [{ id: muzza }, { id: napo }] = await db.insert(menuItems).values([{ group: 'pizzas', name: 'Muzza', unitCost: '4000.00', stock: '0', price1: '11000.00' }, { group: 'pizzas', name: 'Napolitana', unitCost: '4000.00', stock: '0', price1: '12000.00' }]).returning({ id: menuItems.id });
  });

  afterAll(async () => {
    await db.$client.end();
  });

  it('cada venta trae su número de pedido correlativo y cada línea sus gustos con las unidades, sin las bases', async () => {
    const half = { group: 'pizzas' as const, presentationKey: 'pizza_2', flavors: [{ menuItemId: muzza, units: 0.5 }, { menuItemId: napo, units: 0.5 }], quantity: 1 };
    const whole = { group: 'pizzas' as const, presentationKey: 'pizza_1', flavors: [{ menuItemId: muzza, units: 1 }], quantity: 2 };
    await checkoutService.checkout(VENDOR, { buyer: BUYER, lines: [whole], discountPercentage: 0, discountAmount: 0, payments: cash(22000) });
    await checkoutService.checkout(VENDOR, { buyer: BUYER, lines: [half], discountPercentage: 0, discountAmount: 0, payments: cash(12000) });
    const [last, first] = await saleHistoryService.list();
    expect(last.orderNumber).toBe(first.orderNumber + 1);
    expect(first.lines).toMatchObject([{ promotionName: null, items: [{ name: 'Muzza', units: '2.0' }] }]);
    expect(last.lines[0].items.map(({ name, units }) => `${units} ${name}`).sort()).toEqual(['0.5 Muzza', '0.5 Napolitana']);
  });
});
