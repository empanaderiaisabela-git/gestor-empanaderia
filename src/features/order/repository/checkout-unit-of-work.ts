import { auditLogs } from '@/lib/db/schema';
import { type DbTransaction, withTransaction } from '@/lib/db/transaction';
import { type CardRepository, drizzleCardRepository } from '@/features/card/repository/card.repository';
import { drizzlePromotionRepository, type PromotionRepository } from '@/features/promotion/repository/promotion.repository';
import { drizzleStockRepository, type StockRepository } from '@/features/stock/repository/stock.repository';
import { type CheckoutCustomers, drizzleCheckoutCustomers } from './checkout-customers.repository';
import { drizzleSaleWriter, type SaleWriter } from './sale-writer.repository';

export type SaleAuditEntry = {
  userId: string;
  action: 'CREAR' | 'ELIMINAR';
  entity: 'SALE' | 'CUSTOMER';
  entityId: string;
  detail: Record<string, unknown>;
};

export type CheckoutScope = {
  stock: StockRepository;
  promotions: Pick<PromotionRepository, 'findById'>;
  cards: Pick<CardRepository, 'findById'>;
  sales: SaleWriter;
  customers: CheckoutCustomers;
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
      work({ stock: drizzleStockRepository(tx), promotions: drizzlePromotionRepository(tx), cards: drizzleCardRepository(tx), sales: drizzleSaleWriter(tx), customers: drizzleCheckoutCustomers(tx), audit: auditIn(tx) })
    ),
};
