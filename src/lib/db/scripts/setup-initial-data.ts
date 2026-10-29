import * as bcrypt from 'bcrypt';
import { db } from '..';
import { expenses } from '../expense-schema';
import { auditLogs, customers, providers, salePayments, sales, users } from '../schema';
import { assertSafeToWipe } from './assert-safe-to-wipe';
import { clearMenu, seedMenu } from './seed-menu';

const PROVIDERS = [
  { name: 'Molino del Sur', phone: '1144556677', email: 'ventas@molinodelsur.com' },
  { name: 'Fiambrería Central', phone: '1122334455', email: 'pedidos@fiambreriacentral.com' },
  { name: 'Distribuidora de Bebidas Norte', phone: '1199887766', email: 'contacto@bebidasnorte.com' },
];

const CUSTOMERS = [
  { name: 'Juan Pérez', phone: '1122334455', email: 'juan.perez@example.com', documentNumber: '35123456' },
  { name: 'María García', phone: '1199887766', email: 'maria.garcia@example.com', documentNumber: '40987654' },
];

async function wipe(): Promise<void> {
  await clearMenu();
  await db.delete(auditLogs);
  await db.delete(salePayments);
  await db.delete(sales);
  await db.delete(expenses);
  await db.delete(providers);
  await db.delete(customers);
  await db.delete(users);
}

async function seedUsers(): Promise<void> {
  await db.insert(users).values([
    { username: 'admin', passwordHash: await bcrypt.hash('admin', 10), role: 'admin' },
    { username: 'vendedor', passwordHash: await bcrypt.hash('vendedor', 10), role: 'vendedor' },
  ]);
}

async function setup(): Promise<void> {
  assertSafeToWipe(process.env);
  console.log('--- Base limpia y datos iniciales de la empanadería ---');
  await wipe();
  await db.insert(providers).values(PROVIDERS);
  await db.insert(customers).values(CUSTOMERS);
  await seedMenu();
  await seedUsers();
  console.log(`Listo: ${PROVIDERS.length} proveedores, ${CUSTOMERS.length} clientes, el menú y los usuarios admin:admin y vendedor:vendedor.`);
}

setup()
  .then(() => process.exit(0))
  .catch((error: unknown) => {
    console.error('Falló la carga de datos iniciales:', error);
    process.exit(1);
  });
