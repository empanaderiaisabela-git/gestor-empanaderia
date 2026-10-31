import { readFileSync } from 'node:fs';
import { drizzle } from 'drizzle-orm/node-postgres';
import { numeric, pgTable, varchar } from 'drizzle-orm/pg-core';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { db } from '@/lib/db';
import { menuGroupEnum, menuItems } from '@/lib/db/menu-schema';
import { truncateAll } from '@/test/truncate-all';

const MIGRATION = readFileSync('src/lib/db/migrations/0023_stock-minimo.sql', 'utf8').split('--> statement-breakpoint');
const UNDO = ['ALTER TABLE "menu_items" DROP CONSTRAINT "menu_items_min_stock_check"', 'ALTER TABLE "menu_items" DROP COLUMN "min_stock"'];
const legacyMenuItems = pgTable('menu_items', { group: menuGroupEnum('menu_group').notNull(), name: varchar('name', { length: 60 }).notNull(), stock: numeric('stock', { precision: 10, scale: 1 }) });

describe('migración 0023: stock mínimo (US-45 CA-1)', () => {
  beforeEach(truncateAll);
  afterAll(async () => {
    await db.$client.end();
  });

  it('los gustos de hoy quedan sin mínimo y con su stock, y el check rechaza un mínimo de 0', async () => {
    const client = await db.$client.connect();
    const tx = drizzle(client);
    try {
      await client.query('BEGIN');
      for (const statement of UNDO) await client.query(statement);
      await tx.insert(legacyMenuItems).values([{ group: 'empanadas', name: 'Carne', stock: '12' }, { group: 'pepsi', name: '7up 1,5 L', stock: '3' }]);
      for (const statement of MIGRATION) await client.query(statement);
      const rows = await tx.select({ name: menuItems.name, stock: menuItems.stock, minStock: menuItems.minStock }).from(menuItems).orderBy(menuItems.name);
      expect(rows).toEqual([
        { name: '7up 1,5 L', stock: '3.0', minStock: null },
        { name: 'Carne', stock: '12.0', minStock: null },
      ]);
      await expect(client.query(`UPDATE "menu_items" SET "min_stock" = 0 WHERE "name" = 'Carne'`)).rejects.toThrow(/menu_items_min_stock_check/);
    } finally {
      await client.query('ROLLBACK');
      client.release();
    }
  });
});
