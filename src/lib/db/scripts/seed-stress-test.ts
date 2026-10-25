import 'dotenv/config';
import { eq } from 'drizzle-orm';
import { db } from '..';
import { menuItems } from '../menu-schema';
import { saleLineItems, saleLines } from '../order-schema';
import { salePayments, sales, users } from '../schema';

const SALES = 300;
const BUYERS = ['Marta', 'Rocío', 'Juan', null, 'Familia Pérez', null, 'Oficina del centro'];

const pick = <T>(list: readonly T[]): T => list[Math.floor(Math.random() * list.length)];

async function insertSale(vendorId: string, drink: typeof menuItems.$inferSelect): Promise<void> {
  const quantity = Math.floor(Math.random() * 4) + 1;
  const total = (Number(drink.price1) * quantity).toFixed(2);
  const createdAt = new Date(Date.now() - Math.floor(Math.random() * 30) * 86_400_000);
  const [sale] = await db.insert(sales).values({ vendorId, total, buyerName: pick(BUYERS), createdAt }).returning({ id: sales.id });
  const line = { saleId: sale.id, group: drink.group, presentationKey: 'u1', quantity, unitPrice: drink.price1 ?? '0', subtotal: total, description: drink.name };
  const [saleLine] = await db.insert(saleLines).values(line).returning({ id: saleLines.id });
  await db.insert(saleLineItems).values({ saleLineId: saleLine.id, menuItemId: drink.id, units: String(quantity), unitCost: drink.unitCost });
  await db.insert(salePayments).values({ saleId: sale.id, type: pick(['efectivo', 'transferencia', 'debito', 'credito'] as const), amount: total });
}

async function seedStressTest(): Promise<void> {
  const [vendor] = await db.select().from(users).where(eq(users.username, 'vendedor')).limit(1);
  const drinks = (await db.select().from(menuItems)).filter((item) => item.group === 'coca_cola' || item.group === 'pepsi');
  if (!vendor || drinks.length === 0) throw new Error('Primero corré npm run db:seed: hacen falta el vendedor y las bebidas.');
  for (let index = 0; index < SALES; index += 1) await insertSale(vendor.id, pick(drinks));
  console.log(`Listo: ${SALES} ventas de bebidas en los últimos 30 días, para probar el scroll de Ventas/Pedidos.`);
}

seedStressTest()
  .then(() => process.exit(0))
  .catch((error: unknown) => {
    console.error('Falló el test de estrés:', error);
    process.exit(1);
  });
