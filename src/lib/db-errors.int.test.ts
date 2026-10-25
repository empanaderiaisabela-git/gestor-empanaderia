import { eq } from 'drizzle-orm';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { MESSAGES } from '@/config/messages';
import { db } from '@/lib/db';
import { menuItems } from '@/lib/db/menu-schema';
import { providers } from '@/lib/db/schema';
import { stockEntries } from '@/lib/db/stock-schema';
import { TEST_USER_IDS } from '@/test/as-user';
import { seedTestUser } from '@/test/seed-test-user';
import { truncateAll } from '@/test/truncate-all';
import { handleDatabaseError } from './db-errors';

const MISSING_ID = '00000000-0000-4000-8000-000000000000';

async function failureOf(operation: Promise<unknown>): Promise<unknown> {
  return operation.then(
    () => {
      throw new Error('La operación tenía que fallar');
    },
    (error: unknown) => error
  );
}

const entryOf = (menuItemId: string, providerId: string) => ({ menuItemId, providerId, quantity: 12, unitCost: '400.00', userId: TEST_USER_IDS.admin });

async function seedStockEntry(): Promise<{ providerId: string; menuItemId: string }> {
  const [provider] = await db.insert(providers).values({ name: 'Proveedor existente' }).returning({ id: providers.id });
  const [item] = await db.insert(menuItems).values({ group: 'empanadas', name: 'Carne', unitCost: '400.00' }).returning({ id: menuItems.id });
  await db.insert(stockEntries).values(entryOf(item.id, provider.id));
  return { providerId: provider.id, menuItemId: item.id };
}

describe('regression BUG-9: errores reales de Postgres a través de Drizzle', () => {
  beforeEach(async () => {
    await truncateAll();
    await seedTestUser('admin');
  });

  afterAll(async () => {
    await db.$client.end();
  });

  it('un nombre duplicado da el mensaje de duplicado', async () => {
    await seedStockEntry();
    const error = await failureOf(db.insert(providers).values({ name: 'Proveedor existente' }));
    expect(handleDatabaseError(error, 'Proveedor')).toBe(MESSAGES.ERROR.DATABASE.UNIQUE_VIOLATION);
  });

  it('una referencia a algo que ya no existe da el mensaje de entidad relacionada inexistente', async () => {
    const { menuItemId } = await seedStockEntry();
    const error = await failureOf(db.insert(stockEntries).values(entryOf(menuItemId, MISSING_ID)));
    expect(handleDatabaseError(error, 'ingreso de stock')).toBe(MESSAGES.ERROR.DATABASE.RELATION_NOT_FOUND);
  });

  it('borrar algo que tiene registros relacionados da el mensaje de registros relacionados', async () => {
    const { providerId } = await seedStockEntry();
    const error = await failureOf(db.delete(providers).where(eq(providers.id, providerId)));
    expect(handleDatabaseError(error, 'Proveedor')).toBe(MESSAGES.ERROR.DATABASE.FOREIGN_KEY_VIOLATION);
  });
});
