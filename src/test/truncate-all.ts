import { db } from '@/lib/db';
import { menuGroupPrices, menuItems } from '@/lib/db/menu-schema';
import { stockEntries, stockLosses } from '@/lib/db/stock-schema';
import { auditLogs, customers, devices, productImages, productLosses, products, providers, saleItems, salePayments, sales, users } from '@/lib/db/schema';
import { assertTestDatabaseUrl } from './test-database-url';

const TABLES_CHILDREN_FIRST = [stockEntries, stockLosses, menuGroupPrices, menuItems, auditLogs, saleItems, salePayments, sales, productLosses, productImages, products, devices, providers, customers, users];

export async function truncateAll(): Promise<void> {
  const { LOCAL_DATABASE_URL, NODE_ENV, APP_ENV } = process.env;
  assertTestDatabaseUrl({ url: LOCAL_DATABASE_URL, nodeEnv: NODE_ENV, appEnv: APP_ENV });
  for (const table of TABLES_CHILDREN_FIRST) {
    await db.delete(table);
  }
}
