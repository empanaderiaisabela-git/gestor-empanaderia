import { db } from '@/lib/db';
import { withTransaction } from '@/lib/db/transaction';
import { drizzleStockRepository, type StockRepository } from '@/features/stock/repository/stock.repository';
import { auditIn, type SaleAuditEntry } from './checkout-unit-of-work';
import { drizzleSaleHistoryRepository, type SaleHistoryRepository } from './sale-history.repository';

export type SaleHistoryScope = {
  stock: StockRepository;
  history: SaleHistoryRepository;
  audit: (entry: SaleAuditEntry) => Promise<void>;
};

export type SaleHistoryUnitOfWork = {
  read: SaleHistoryRepository;
  run<T>(work: (scope: SaleHistoryScope) => Promise<T>): Promise<T>;
};

export const drizzleSaleHistoryUnitOfWork: SaleHistoryUnitOfWork = {
  read: drizzleSaleHistoryRepository(db),
  run: (work) => withTransaction((tx) => work({ stock: drizzleStockRepository(tx), history: drizzleSaleHistoryRepository(tx), audit: auditIn(tx) })),
};
