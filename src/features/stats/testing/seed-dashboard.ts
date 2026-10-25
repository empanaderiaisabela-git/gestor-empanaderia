import { db } from '@/lib/db';
import { devices, productLosses, products, providers, saleItems, salePayments, sales, users } from '@/lib/db/schema';

export const DASHBOARD_RANGE = { start: new Date('2026-03-01T00:00:00Z'), end: new Date('2026-03-31T23:59:59Z') };

const IN_RANGE = new Date('2026-03-10T15:00:00Z');
const OUT_OF_RANGE = new Date('2025-01-01T12:00:00Z');

type SaleSeed = { vendorId: string; productId: string; createdAt: Date };

async function insertSale({ vendorId, productId, createdAt }: SaleSeed): Promise<void> {
  const [sale] = await db.insert(sales).values({ vendorId, total: '500.00', createdAt }).returning({ id: sales.id });
  await db.insert(saleItems).values({ saleId: sale.id, productId, quantity: 2, unitPrice: '250.00', unitCost: '100.00', subtotal: '500.00' });
  await db.insert(salePayments).values([
    { saleId: sale.id, type: 'efectivo', amount: '300.00' },
    { saleId: sale.id, type: 'transferencia', amount: '200.00' },
  ]);
}

export async function seedDashboard(): Promise<void> {
  const [vendor] = await db.insert(users).values({ username: 'vendedora', passwordHash: 'hash-de-prueba', role: 'vendedor' }).returning({ id: users.id });
  const [provider] = await db.insert(providers).values({ name: 'Proveedor de prueba' }).returning({ id: providers.id });
  const [device] = await db.insert(devices).values({ name: 'Categoría de prueba' }).returning({ id: devices.id });
  const [product] = await db
    .insert(products)
    .values({ deviceId: device.id, providerId: provider.id, purchasePrice: '100.00', salePrice: '250.00', stock: 10 })
    .returning({ id: products.id });
  await insertSale({ vendorId: vendor.id, productId: product.id, createdAt: IN_RANGE });
  await insertSale({ vendorId: vendor.id, productId: product.id, createdAt: OUT_OF_RANGE });
  await db.insert(productLosses).values({ productId: product.id, userId: vendor.id, quantity: 1, reason: 'Rotura', createdAt: IN_RANGE });
}
