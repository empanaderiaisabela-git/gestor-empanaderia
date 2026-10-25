import { db } from '@/lib/db';
import { menuGroupPrices, menuItemImages, menuItems } from '@/lib/db/menu-schema';
import { saleLineItems, saleLines } from '@/lib/db/order-schema';
import { stockEntries, stockLosses } from '@/lib/db/stock-schema';
import { auditLogs, customers, providers, salePayments, sales, users } from '@/lib/db/schema';
import { assertTestDatabaseUrl } from './test-database-url';

const TABLES_CHILDREN_FIRST = [saleLineItems, saleLines, stockEntries, stockLosses, menuItemImages, menuGroupPrices, menuItems, auditLogs, salePayments, sales, providers, customers, users];

export async function truncateAll(): Promise<void> {
  const { LOCAL_DATABASE_URL, NODE_ENV, APP_ENV } = process.env;
  assertTestDatabaseUrl({ url: LOCAL_DATABASE_URL, nodeEnv: NODE_ENV, appEnv: APP_ENV });
  for (const table of TABLES_CHILDREN_FIRST) {
    await db.delete(table);
  }
}
