import { readFileSync } from 'node:fs';
import { drizzle } from 'drizzle-orm/node-postgres';
import { numeric, pgTable, varchar } from 'drizzle-orm/pg-core';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { db } from '@/lib/db';
import { menuGroupEnum, menuItems } from '@/lib/db/menu-schema';
import { truncateAll } from '@/test/truncate-all';

const MIGRATION = readFileSync('src/lib/db/migrations/0027_litros-como-texto.sql', 'utf8').split('--> statement-breakpoint');
const OLD_CHECK = `ALTER TABLE "menu_items" ADD CONSTRAINT "menu_items_drink_check" CHECK (("menu_items"."drink_name" is null and "menu_items"."liters" is null and "menu_items"."flavor" is null)
  or ("menu_items"."menu_group" in ('coca_cola', 'pepsi') and "menu_items"."drink_name" is not null and "menu_items"."liters" > 0))`;
const UNDO = ['ALTER TABLE "menu_items" DROP CONSTRAINT "menu_items_drink_check"', 'ALTER TABLE "menu_items" DROP COLUMN "drink_size"', OLD_CHECK];
const legacyMenuItems = pgTable('menu_items', {
  group: menuGroupEnum('menu_group').notNull(),
  name: varchar('name', { length: 60 }).notNull(),
  drinkName: varchar('drink_name', { length: 25 }),
  liters: numeric('liters', { precision: 6, scale: 3 }),
});

describe('migración 0027: litros como texto (US-51 CA-2)', () => {
  beforeEach(truncateAll);
  afterAll(async () => {
    await db.$client.end();
  });

  it('las bebidas de antes conservan bebida, litros y sabor; el check acepta texto y sigue exigiendo bebida', async () => {
    const client = await db.$client.connect();
    const tx = drizzle(client);
    try {
      await client.query('BEGIN');
      for (const statement of UNDO) await client.query(statement);
      await tx.insert(legacyMenuItems).values([
        { group: 'coca_cola', name: 'Aquarius 1,5 L Manzana', drinkName: 'Aquarius', liters: '1.5' },
        { group: 'empanadas', name: 'Carne' },
      ]);
      for (const statement of MIGRATION) await client.query(statement);
      const rows = await tx.select({ name: menuItems.name, drinkName: menuItems.drinkName, drinkSize: menuItems.drinkSize, liters: menuItems.liters }).from(menuItems).orderBy(menuItems.name);
      expect(rows).toEqual([
        { name: 'Aquarius 1,5 L Manzana', drinkName: 'Aquarius', drinkSize: null, liters: '1.500' },
        { name: 'Carne', drinkName: null, drinkSize: null, liters: null },
      ]);
      await client.query(`UPDATE "menu_items" SET "liters" = NULL, "drink_size" = '500CC' WHERE "name" = 'Aquarius 1,5 L Manzana'`);
      await expect(client.query(`UPDATE "menu_items" SET "drink_size" = '500CC' WHERE "name" = 'Carne'`)).rejects.toThrow(/menu_items_drink_check/);
    } finally {
      await client.query('ROLLBACK');
      client.release();
    }
  });
});
