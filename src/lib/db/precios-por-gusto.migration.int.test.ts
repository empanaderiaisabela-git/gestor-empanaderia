import { readFileSync } from 'node:fs';
import { drizzle } from 'drizzle-orm/node-postgres';
import { numeric, pgTable } from 'drizzle-orm/pg-core';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { db } from '@/lib/db';
import { menuGroupEnum, menuItems } from '@/lib/db/menu-schema';
import { truncateAll } from '@/test/truncate-all';

const statementsOf = (migration: string): string[] => readFileSync(`src/lib/db/migrations/${migration}.sql`, 'utf8').split('--> statement-breakpoint');
const LEGACY_TABLE = statementsOf('0006_menu-items').find((statement) => statement.includes('CREATE TABLE "menu_group_prices"')) ?? '';
const money = (name: string) => numeric(name, { precision: 10, scale: 2 });
const legacyGroupPrices = pgTable('menu_group_prices', { group: menuGroupEnum('menu_group').primaryKey(), price1: money('price_1').notNull(), price3: money('price_3'), price6: money('price_6'), price12: money('price_12') });
const DOZEN = { price1: '1200.00', price3: '3400.00', price6: '6500.00', price12: '12000.00' };
const UNIT_ONLY = { price3: null, price6: null, price12: null };

describe('migración 0020: el precio de grupo pasa a cada gusto (US-28, D-4)', () => {
  beforeEach(truncateAll);
  afterAll(async () => {
    await db.$client.end();
  });

  it('copia el precio de grupo de hoy a cada gusto de Empanadas y Ciabattas, no toca el resto y borra la tabla vieja', async () => {
    const client = await db.$client.connect();
    const tx = drizzle(client);
    try {
      await client.query('BEGIN');
      await client.query(LEGACY_TABLE);
      await tx.insert(legacyGroupPrices).values([{ group: 'empanadas', ...DOZEN }, { group: 'ciabattas', price1: '6000.00' }]);
      await tx.insert(menuItems).values([{ group: 'empanadas', name: 'Carne' }, { group: 'ciabattas', name: 'Pollo' }, { group: 'pizzas', name: 'Muzza', price1: '11000.00' }, { group: 'sanguches', name: 'Primavera' }]);
      for (const statement of statementsOf('0020_precios-por-gusto')) await client.query(statement);
      const rows = await tx.select({ name: menuItems.name, price1: menuItems.price1, price3: menuItems.price3, price6: menuItems.price6, price12: menuItems.price12 }).from(menuItems).orderBy(menuItems.name);
      expect(rows).toEqual([
        { name: 'Carne', ...DOZEN },
        { name: 'Muzza', price1: '11000.00', ...UNIT_ONLY },
        { name: 'Pollo', price1: '6000.00', ...UNIT_ONLY },
        { name: 'Primavera', price1: null, ...UNIT_ONLY },
      ]);
      await expect(tx.select().from(legacyGroupPrices)).rejects.toMatchObject({ cause: { code: '42P01' } });
    } finally {
      await client.query('ROLLBACK');
      client.release();
    }
  });
});
