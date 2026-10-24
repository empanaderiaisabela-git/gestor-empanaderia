import { eq } from 'drizzle-orm';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { MESSAGES } from '@/config/messages';
import { db } from '@/lib/db';
import { devices, products, providers } from '@/lib/db/schema';
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

async function seedProduct(): Promise<{ providerId: string; deviceId: string }> {
  const [provider] = await db.insert(providers).values({ name: 'Proveedor existente' }).returning({ id: providers.id });
  const [device] = await db.insert(devices).values({ name: 'Categoría existente' }).returning({ id: devices.id });
  await db.insert(products).values({ deviceId: device.id, providerId: provider.id, purchasePrice: '1.00', salePrice: '2.00' });
  return { providerId: provider.id, deviceId: device.id };
}

describe('regression BUG-9: errores reales de Postgres a través de Drizzle', () => {
  beforeEach(async () => {
    await truncateAll();
  });

  afterAll(async () => {
    await db.$client.end();
  });

  it('un nombre duplicado da el mensaje de duplicado', async () => {
    await seedProduct();
    const error = await failureOf(db.insert(providers).values({ name: 'Proveedor existente' }));
    expect(handleDatabaseError(error, 'Proveedor')).toBe(MESSAGES.ERROR.DATABASE.UNIQUE_VIOLATION);
  });

  it('una referencia a algo que ya no existe da el mensaje de entidad relacionada inexistente', async () => {
    const { deviceId } = await seedProduct();
    const error = await failureOf(db.insert(products).values({ deviceId, providerId: MISSING_ID, purchasePrice: '1.00', salePrice: '2.00' }));
    expect(handleDatabaseError(error, 'producto')).toBe(MESSAGES.ERROR.DATABASE.RELATION_NOT_FOUND);
  });

  it('borrar algo que tiene registros relacionados da el mensaje de registros relacionados', async () => {
    const { providerId } = await seedProduct();
    const error = await failureOf(db.delete(providers).where(eq(providers.id, providerId)));
    expect(handleDatabaseError(error, 'Proveedor')).toBe(MESSAGES.ERROR.DATABASE.FOREIGN_KEY_VIOLATION);
  });
});
