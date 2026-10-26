import { fakeMenuGroupPriceRepository, type FakeGroupPriceState } from '@/features/menu/testing/fake-menu-group-prices';
import type { CheckoutUnitOfWork, SaleAuditEntry } from '@/features/order/repository/checkout-unit-of-work';
import type { NewSale, NewSaleLine, SaleWriter } from '@/features/order/repository/sale-writer.repository';
import type { Payment } from '@/features/order/domain/order-validation';
import { createFakePromotionUnitOfWork, type FakePromotionUnitOfWork } from '@/features/promotion/testing/fake-promotion-unit-of-work';
import { createFakeStockUnitOfWork, type FakeStockUnitOfWork } from '@/features/stock/testing/fake-stock-unit-of-work';

export type FakeSale = NewSale & { id: string; createdAt: Date; lines: NewSaleLine[]; payments: Payment[] };

export type FakeCheckoutUnitOfWork = CheckoutUnitOfWork & {
  stock: FakeStockUnitOfWork;
  prices: FakeGroupPriceState;
  promotions: FakePromotionUnitOfWork;
  sales: FakeSale[];
  audits: SaleAuditEntry[];
  reset(): void;
};

function saleOf(sales: FakeSale[], saleId: string): FakeSale {
  const sale = sales.find((row) => row.id === saleId);
  if (!sale) throw new Error(`venta ${saleId} inexistente`);
  return sale;
}

function fakeSaleWriter(sales: FakeSale[]): SaleWriter {
  return {
    insertSale: async (sale) => {
      const id = crypto.randomUUID();
      sales.push({ ...sale, id, createdAt: new Date(Date.UTC(2026, 9, 25, 15, sales.length)), lines: [], payments: [] });
      return id;
    },
    insertLine: async (saleId, line) => {
      saleOf(sales, saleId).lines.push(line);
      return crypto.randomUUID();
    },
    insertPayments: async (saleId, payments) => {
      saleOf(sales, saleId).payments.push(...payments);
    },
  };
}

export function createFakeCheckoutUnitOfWork(): FakeCheckoutUnitOfWork {
  const fake: FakeCheckoutUnitOfWork = {
    stock: createFakeStockUnitOfWork(),
    prices: { groupPrices: [] },
    promotions: createFakePromotionUnitOfWork(),
    sales: [],
    audits: [],
    run: (work) =>
      work({ stock: fake.stock.read, groupPrices: fakeMenuGroupPriceRepository(fake.prices), promotions: fake.promotions.read, sales: fakeSaleWriter(fake.sales), audit: async (entry) => void fake.audits.push(entry) }),
    reset: () => {
      fake.stock.reset();
      fake.promotions.reset();
      fake.prices.groupPrices = [];
      fake.sales.length = 0;
      fake.audits.length = 0;
    },
  };
  return fake;
}

export const fakeCheckout = createFakeCheckoutUnitOfWork();
