import type { CheckoutUnitOfWork, SaleAuditEntry } from '@/features/order/repository/checkout-unit-of-work';
import type { CheckoutCustomers, NewCustomer } from '@/features/order/repository/checkout-customers.repository';
import type { NewPayment, NewSale, NewSaleLine, SaleWriter } from '@/features/order/repository/sale-writer.repository';
import { createFakeCardUnitOfWork, type FakeCardUnitOfWork } from '@/features/card/testing/fake-card-unit-of-work';
import { createFakePizzaExtraUnitOfWork, type FakePizzaExtraUnitOfWork } from '@/features/menu/testing/fake-pizza-extra-unit-of-work';
import { createFakePromotionUnitOfWork, type FakePromotionUnitOfWork } from '@/features/promotion/testing/fake-promotion-unit-of-work';
import { createFakeShippingUnitOfWork, type FakeShippingUnitOfWork } from '@/features/shipping/testing/fake-shipping-unit-of-work';
import { createFakeStockUnitOfWork, type FakeStockUnitOfWork } from '@/features/stock/testing/fake-stock-unit-of-work';

export type FakeSale = NewSale & { id: string; orderNumber: number; createdAt: Date; lines: NewSaleLine[]; payments: NewPayment[] };
export type FakeCustomer = NewCustomer & { id: string; isActive: boolean };

export type FakeCheckoutUnitOfWork = CheckoutUnitOfWork & {
  stock: FakeStockUnitOfWork;
  promotions: FakePromotionUnitOfWork;
  cards: FakeCardUnitOfWork;
  extras: FakePizzaExtraUnitOfWork;
  shippings: FakeShippingUnitOfWork;
  sales: FakeSale[];
  customers: FakeCustomer[];
  audits: SaleAuditEntry[];
  reset(): void;
};

function saleOf(sales: FakeSale[], saleId: string): FakeSale {
  const sale = sales.find((row) => row.id === saleId);
  if (!sale) throw new Error(`venta ${saleId} inexistente`);
  return sale;
}

export function fakeSaleWriter(sales: FakeSale[]): SaleWriter {
  return {
    findByCheckoutKey: async (key) => sales.filter((row) => row.checkoutKey === key).map((row) => ({ saleId: row.id, total: row.total }))[0] ?? null,
    insertSale: async (sale) => {
      const id = crypto.randomUUID();
      sales.push({ ...sale, id, orderNumber: Math.max(0, ...sales.map((row) => row.orderNumber)) + 1, createdAt: new Date(Date.UTC(2026, 9, 25, 15, sales.length)), lines: [], payments: [] });
      return id;
    },
    insertLine: async (saleId, line) => {
      saleOf(sales, saleId).lines.push(line);
      return crypto.randomUUID();
    },
    insertPayments: async (saleId, payments) => {
      saleOf(sales, saleId).payments.push(...payments);
    },
    updateTotals: async (saleId, totals) => {
      Object.assign(saleOf(sales, saleId), totals);
    },
  };
}

function fakeCustomers(customers: FakeCustomer[]): CheckoutCustomers {
  return {
    isActive: async (customerId) => customers.some((customer) => customer.id === customerId && customer.isActive),
    insert: async (customer) => {
      const id = crypto.randomUUID();
      customers.push({ ...customer, id, isActive: true });
      return id;
    },
  };
}

export function createFakeCheckoutUnitOfWork(): FakeCheckoutUnitOfWork {
  const fake: FakeCheckoutUnitOfWork = {
    stock: createFakeStockUnitOfWork(),
    promotions: createFakePromotionUnitOfWork(),
    cards: createFakeCardUnitOfWork(),
    extras: createFakePizzaExtraUnitOfWork(),
    shippings: createFakeShippingUnitOfWork(),
    sales: [],
    customers: [],
    audits: [],
    run: (work) =>
      work({
        stock: fake.stock.read,
        promotions: fake.promotions.read,
        cards: fake.cards.read,
        extras: fake.extras.read,
        shippings: fake.shippings.read,
        sales: fakeSaleWriter(fake.sales),
        customers: fakeCustomers(fake.customers),
        audit: async (entry) => void fake.audits.push(entry),
      }),
    reset: () => {
      fake.stock.reset();
      fake.promotions.reset();
      fake.cards.reset();
      fake.extras.reset();
      fake.shippings.reset();
      fake.sales.length = 0;
      fake.customers.length = 0;
      fake.audits.length = 0;
    },
  };
  return fake;
}

export const fakeCheckout = createFakeCheckoutUnitOfWork();
