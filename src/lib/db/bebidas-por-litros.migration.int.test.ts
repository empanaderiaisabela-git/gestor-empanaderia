import { readFileSync } from 'node:fs';
import { drizzle } from 'drizzle-orm/node-postgres';
import { pgTable, varchar } from 'drizzle-orm/pg-core';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { db } from '@/lib/db';
import { menuGroupEnum, menuItems } from '@/lib/db/menu-schema';
import { truncateAll } from '@/test/truncate-all';

const MIGRATION = readFileSync('src/lib/db/migrations/0026_bebidas-por-litros.sql', 'utf8').split('--> statement-breakpoint');
const UNDO = ['ALTER TABLE "menu_items" DROP CONSTRAINT "menu_items_drink_check"', 'ALTER TABLE "menu_items" DROP COLUMN "drink_name"', 'ALTER TABLE "menu_items" DROP COLUMN "liters"', 'ALTER TABLE "menu_items" DROP COLUMN "flavor"'];
const legacyMenuItems = pgTable('menu_items', { group: menuGroupEnum('menu_group').notNull(), name: varchar('name', { length: 60 }).notNull() });

describe('migración 0026: bebida, litros y sabor (US-49 CA-1)', () => {
  beforeEach(truncateAll);
  afterAll(async () => {
    await db.$client.end();
  });

  it('las bebidas y gustos de hoy quedan sin bebida, litros ni sabor; el check sólo admite bebidas completas', async () => {
    const client = await db.$client.connect();
    const tx = drizzle(client);
    try {
      await client.query('BEGIN');
      for (const statement of UNDO) await client.query(statement);
      await tx.insert(legacyMenuItems).values([{ group: 'coca_cola', name: 'Aquarius 1,5 L Manzana' }, { group: 'empanadas', name: 'Carne' }]);
      for (const statement of MIGRATION) await client.query(statement);
      const rows = await tx.select({ name: menuItems.name, drinkName: menuItems.drinkName, liters: menuItems.liters, flavor: menuItems.flavor }).from(menuItems).orderBy(menuItems.name);
      expect(rows).toEqual([
        { name: 'Aquarius 1,5 L Manzana', drinkName: null, liters: null, flavor: null },
        { name: 'Carne', drinkName: null, liters: null, flavor: null },
      ]);
      await expect(client.query(`UPDATE "menu_items" SET "drink_name" = 'Aquarius', "liters" = 1.5 WHERE "name" = 'Carne'`)).rejects.toThrow(/menu_items_drink_check/);
    } finally {
      await client.query('ROLLBACK');
      client.release();
    }
  });
});
