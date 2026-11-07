import type { SalePaymentUnitOfWork } from '@/features/order/repository/sale-payment-unit-of-work';
import { fakeCheckout, type FakeCheckoutUnitOfWork, fakeSaleWriter } from './fake-checkout-unit-of-work';
import { fakeSaleHistoryRepository } from './fake-sale-history';

export function createFakeSalePaymentUnitOfWork(fake: FakeCheckoutUnitOfWork): SalePaymentUnitOfWork {
  return {
    run: (work) => work({ history: fakeSaleHistoryRepository(fake), sales: fakeSaleWriter(fake.sales), cards: fake.cards.read, audit: async (entry) => void fake.audits.push(entry) }),
  };
}

export const fakeSalePayment = createFakeSalePaymentUnitOfWork(fakeCheckout);
