import { withTransaction } from '@/lib/db/transaction';
import { type CardRepository, drizzleCardRepository } from '@/features/card/repository/card.repository';
import { auditIn, type CheckoutScope } from './checkout-unit-of-work';
import { drizzleSaleHistoryRepository, type SaleHistoryRepository } from './sale-history.repository';
import { drizzleSaleWriter, type SaleWriter } from './sale-writer.repository';

export type SalePaymentScope = {
  history: Pick<SaleHistoryRepository, 'lockSale'>;
  sales: Pick<SaleWriter, 'updateTotals' | 'insertPayments'>;
  cards: Pick<CardRepository, 'findById'>;
  audit: CheckoutScope['audit'];
};

export type SalePaymentUnitOfWork = {
  run<T>(work: (scope: SalePaymentScope) => Promise<T>): Promise<T>;
};

export const drizzleSalePaymentUnitOfWork: SalePaymentUnitOfWork = {
  run: (work) => withTransaction((tx) => work({ history: drizzleSaleHistoryRepository(tx), sales: drizzleSaleWriter(tx), cards: drizzleCardRepository(tx), audit: auditIn(tx) })),
};
