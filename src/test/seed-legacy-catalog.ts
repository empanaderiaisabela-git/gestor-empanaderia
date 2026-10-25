import { db } from '@/lib/db';
import { devices, products, providers, users } from '@/lib/db/schema';
import type { Role } from '@/features/auth/domain/auth.schema';
import { TEST_USER_IDS } from './as-user';

export type SeededProduct = { productId: string; deviceId: string; providerId: string };

export async function seedLegacyProduct(stock = 5): Promise<SeededProduct> {
  const [provider] = await db.insert(providers).values({ name: `Proveedor ${crypto.randomUUID()}` }).returning({ id: providers.id });
  const [device] = await db.insert(devices).values({ name: `Categoría ${crypto.randomUUID()}` }).returning({ id: devices.id });
  const values = { deviceId: device.id, providerId: provider.id, purchasePrice: '1.00', salePrice: '2.00', stock };
  const [product] = await db.insert(products).values(values).returning({ id: products.id });
  return { productId: product.id, deviceId: device.id, providerId: provider.id };
}

export async function seedTestUser(role: Role): Promise<void> {
  await db.insert(users).values({ id: TEST_USER_IDS[role], username: role, passwordHash: 'sin-uso', role });
}
