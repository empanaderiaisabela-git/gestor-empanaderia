import { readFileSync } from 'node:fs';
import { drizzle } from 'drizzle-orm/node-postgres';
import { numeric, pgTable, varchar } from 'drizzle-orm/pg-core';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { db } from '@/lib/db';
import { menuGroupEnum, menuItems } from '@/lib/db/menu-schema';
import { truncateAll } from '@/test/truncate-all';

const MIGRATION = readFileSync('src/lib/db/migrations/0021_prepizzas-y-panes.sql', 'utf8').split('--> statement-breakpoint');
const UNDO = ['ALTER TABLE "menu_items" DROP CONSTRAINT "menu_items_base_check"', 'DROP INDEX "menu_items_one_base_per_group"', 'ALTER TABLE "menu_items" DROP COLUMN "is_base"'];
const legacyMenuItems = pgTable('menu_items', { group: menuGroupEnum('menu_group').notNull(), name: varchar('name', { length: 60 }).notNull(), stock: numeric('stock', { precision: 10, scale: 1 }) });

describe('migración 0021: prepizzas y panes de ciabatta (US-29 CA-1)', () => {
  beforeEach(truncateAll);
  afterAll(async () => {
    await db.$client.end();
  });

  it('crea las dos bases en 0, deja en 0 el stock de los gustos de pizza y ciabatta y no toca el resto', async () => {
    const client = await db.$client.connect();
    const tx = drizzle(client);
    try {
      await client.query('BEGIN');
      for (const statement of UNDO) await client.query(statement);
      await tx.insert(legacyMenuItems).values([{ group: 'pizzas', name: 'Muzza', stock: '2.5' }, { group: 'ciabattas', name: 'Capresse', stock: '4' }, { group: 'empanadas', name: 'Carne', stock: '12' }]);
      for (const statement of MIGRATION) await client.query(statement);
      const rows = await tx.select({ group: menuItems.group, name: menuItems.name, stock: menuItems.stock, isBase: menuItems.isBase, unitCost: menuItems.unitCost }).from(menuItems).orderBy(menuItems.name);
      expect(rows).toEqual([
        { group: 'ciabattas', name: 'Capresse', stock: '0.0', isBase: false, unitCost: null },
        { group: 'empanadas', name: 'Carne', stock: '12.0', isBase: false, unitCost: null },
        { group: 'pizzas', name: 'Muzza', stock: '0.0', isBase: false, unitCost: null },
        { group: 'ciabattas', name: 'Pan de ciabatta', stock: '0.0', isBase: true, unitCost: null },
        { group: 'pizzas', name: 'Prepizza', stock: '0.0', isBase: true, unitCost: null },
      ]);
    } finally {
      await client.query('ROLLBACK');
      client.release();
    }
  });
});
