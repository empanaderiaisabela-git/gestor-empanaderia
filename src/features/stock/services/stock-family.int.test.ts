import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { db } from '@/lib/db';
import { menuItems } from '@/lib/db/menu-schema';
import { TEST_USER_IDS } from '@/test/as-user';
import { seedTestUser } from '@/test/seed-test-user';
import { truncateAll } from '@/test/truncate-all';
import { stockService } from './stock.service';

const CALLER = { id: TEST_USER_IDS.admin };
const aquarius = (flavor: string) => ({ group: 'coca_cola' as const, name: `Aquarius 1.5L ${flavor}`, drinkName: 'Aquarius', drinkSize: '1.5L', flavor });

describe('familia de bebidas contra Postgres (US-49 CA-4)', () => {
  beforeEach(async () => {
    await truncateAll();
    await seedTestUser('admin');
  });
  afterAll(async () => {
    await db.$client.end();
  });

  it('el ingreso del primer sabor guarda costo y precio en toda la familia, y el segundo sólo suma stock', async () => {
    const [manzana, pera] = await db.insert(menuItems).values([aquarius('Manzana'), aquarius('Pera')]).returning({ id: menuItems.id });
    await db.insert(menuItems).values([
      { group: 'coca_cola', name: 'Aquarius 1L Pera', drinkName: 'Aquarius', drinkSize: '1L', flavor: 'Pera' },
      { group: 'coca_cola', name: 'Aquarius 1.5L Uva', drinkName: 'aquarius', drinkSize: '1.5L', flavor: 'Uva' },
    ]);
    await stockService.registerEntry(CALLER, { menuItemId: manzana.id, quantity: 6, unitCost: 900, prices: { price1: 2500 } });
    await stockService.registerEntry(CALLER, { menuItemId: pera.id, quantity: 4 });
    const rows = await db.select({ name: menuItems.name, stock: menuItems.stock, unitCost: menuItems.unitCost, price1: menuItems.price1 }).from(menuItems);
    expect(rows).toHaveLength(4);
    expect(rows).toEqual(expect.arrayContaining([
      { name: 'Aquarius 1L Pera', stock: '0.0', unitCost: null, price1: null },
      { name: 'Aquarius 1.5L Uva', stock: '0.0', unitCost: null, price1: null },
      { name: 'Aquarius 1.5L Manzana', stock: '6.0', unitCost: '900.00', price1: '2500.00' },
      { name: 'Aquarius 1.5L Pera', stock: '4.0', unitCost: '900.00', price1: '2500.00' },
    ]));
  });
});
