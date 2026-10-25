import { auditLogs } from '@/lib/db/schema';
import { type DbTransaction, withTransaction } from '@/lib/db/transaction';
import { drizzleMenuGroupPriceRepository, type MenuGroupPriceRepository } from '@/features/menu/repository/menu-group-price.repository';
import { drizzleStockRepository, type StockRepository } from '@/features/stock/repository/stock.repository';
import { drizzleSaleWriter, type SaleWriter } from './sale-writer.repository';

export type SaleAuditEntry = {
  userId: string;
  action: 'CREAR' | 'ELIMINAR';
  entity: 'SALE';
  entityId: string;
  detail: Record<string, unknown>;
};

export type CheckoutScope = {
  stock: StockRepository;
  groupPrices: MenuGroupPriceRepository;
  sales: SaleWriter;
  audit: (entry: SaleAuditEntry) => Promise<void>;
};

export type CheckoutUnitOfWork = {
  run<T>(work: (scope: CheckoutScope) => Promise<T>): Promise<T>;
};

export function auditIn(tx: DbTransaction): CheckoutScope['audit'] {
  return async (entry) => {
    await tx.insert(auditLogs).values(entry);
  };
}

export const drizzleCheckoutUnitOfWork: CheckoutUnitOfWork = {
  run: (work) =>
    withTransaction((tx) =>
      work({ stock: drizzleStockRepository(tx), groupPrices: drizzleMenuGroupPriceRepository(tx), sales: drizzleSaleWriter(tx), audit: auditIn(tx) })
    ),
};
