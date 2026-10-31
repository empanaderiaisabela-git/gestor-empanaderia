import { readFileSync } from 'node:fs';
import { drizzle } from 'drizzle-orm/node-postgres';
import { integer, numeric, pgTable, uuid } from 'drizzle-orm/pg-core';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { db } from '@/lib/db';
import { menuItems } from '@/lib/db/menu-schema';
import { stockEntries } from '@/lib/db/stock-schema';
import { TEST_USER_IDS } from '@/test/as-user';
import { seedTestUser } from '@/test/seed-test-user';
import { truncateAll } from '@/test/truncate-all';

const MIGRATION = readFileSync('src/lib/db/migrations/0024_editar-ingreso.sql', 'utf8').split('--> statement-breakpoint');
const UNDO = ['ALTER TABLE "stock_entries" DROP COLUMN "version"'];
const legacyEntries = pgTable('stock_entries', { menuItemId: uuid('menu_item_id').notNull(), quantity: integer('quantity').notNull(), unitCost: numeric('unit_cost', { precision: 10, scale: 2 }).notNull(), userId: uuid('user_id').notNull() });

describe('migración 0024: versión de los ingresos de stock (US-46 CA-1)', () => {
  beforeEach(async () => {
    await truncateAll();
    await seedTestUser('admin');
  });
  afterAll(async () => {
    await db.$client.end();
  });

  it('los ingresos de hoy quedan en la versión 1, con sus datos', async () => {
    const [carne] = await db.insert(menuItems).values({ group: 'empanadas', name: 'Carne', stock: '12' }).returning({ id: menuItems.id });
    const client = await db.$client.connect();
    const tx = drizzle(client);
    try {
      await client.query('BEGIN');
      for (const statement of UNDO) await client.query(statement);
      await tx.insert(legacyEntries).values({ menuItemId: carne.id, quantity: 12, unitCost: '450.00', userId: TEST_USER_IDS.admin });
      for (const statement of MIGRATION) await client.query(statement);
      expect(await tx.select({ quantity: stockEntries.quantity, unitCost: stockEntries.unitCost, version: stockEntries.version }).from(stockEntries)).toEqual([{ quantity: 12, unitCost: '450.00', version: 1 }]);
    } finally {
      await client.query('ROLLBACK');
      client.release();
    }
  });
});
