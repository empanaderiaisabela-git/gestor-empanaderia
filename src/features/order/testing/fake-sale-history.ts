import type { SaleHistoryUnitOfWork } from '@/features/order/repository/sale-history-unit-of-work';
import type { SaleHistoryRepository, SaleView } from '@/features/order/repository/sale-history.repository';
import { fakeCheckout, type FakeCheckoutUnitOfWork, type FakeSale } from './fake-checkout-unit-of-work';

const money = (value: number): string => value.toFixed(2);

function viewOf(fake: FakeCheckoutUnitOfWork, sale: FakeSale): SaleView {
  const lines = [...sale.lines].sort((a, b) => a.position - b.position);
  return {
    id: sale.id,
    createdAt: sale.createdAt,
    buyerName: sale.buyerName,
    vendorName: fake.stock.state.usernames.get(sale.vendorId) ?? '?',
    total: money(sale.total),
    discountAmount: money(sale.discountAmount),
    discountPercentage: money(sale.discountPercentage),
    lines: lines.map(({ group, presentationKey, quantity, unitPrice, subtotal, description }) => ({ group, presentationKey, quantity, unitPrice: money(unitPrice), subtotal: money(subtotal), description })),
    payments: sale.payments.map(({ type, amount }) => ({ type, amount: money(amount) })),
  };
}

export function fakeSaleHistoryRepository(fake: FakeCheckoutUnitOfWork): SaleHistoryRepository {
  const find = (id: string): FakeSale | undefined => fake.sales.find((sale) => sale.id === id);
  return {
    list: async () => [...fake.sales].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()).map((sale) => viewOf(fake, sale)),
    lockSale: async (id) => {
      const sale = find(id);
      return sale ? viewOf(fake, sale) : null;
    },
    soldItems: async (saleId) => (find(saleId)?.lines ?? []).flatMap((line) => line.items.map(({ menuItemId, units }) => ({ menuItemId, units }))),
    deleteSale: async (saleId) => {
      fake.sales.splice(0, fake.sales.length, ...fake.sales.filter((sale) => sale.id !== saleId));
    },
  };
}

export function createFakeSaleHistoryUnitOfWork(fake: FakeCheckoutUnitOfWork): SaleHistoryUnitOfWork {
  const history = fakeSaleHistoryRepository(fake);
  return {
    read: history,
    run: (work) => work({ stock: fake.stock.read, history, audit: async (entry) => void fake.audits.push(entry) }),
  };
}

export const fakeSaleHistory = createFakeSaleHistoryUnitOfWork(fakeCheckout);
