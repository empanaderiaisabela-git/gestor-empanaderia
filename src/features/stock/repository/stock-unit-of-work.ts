import { db } from '@/lib/db';
import { auditLogs } from '@/lib/db/schema';
import { type DbTransaction, withTransaction } from '@/lib/db/transaction';
import { drizzleStockRepository, type StockRepository } from './stock.repository';

export type StockAuditEntry = {
  userId: string;
  action: 'CREAR' | 'PÉRDIDA';
  entity: 'STOCK_ENTRY' | 'STOCK_LOSS';
  entityId: string;
  detail: Record<string, unknown>;
};

export type StockScope = {
  stock: StockRepository;
  audit: (entry: StockAuditEntry) => Promise<void>;
};

export type StockUnitOfWork = {
  read: StockRepository;
  run<T>(work: (scope: StockScope) => Promise<T>): Promise<T>;
};

function auditIn(tx: DbTransaction): StockScope['audit'] {
  return async (entry) => {
    await tx.insert(auditLogs).values(entry);
  };
}

export const drizzleStockUnitOfWork: StockUnitOfWork = {
  read: drizzleStockRepository(db),
  run: (work) => withTransaction((tx) => work({ stock: drizzleStockRepository(tx), audit: auditIn(tx) })),
};
