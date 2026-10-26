import type { MenuGroupPrice } from '@/features/menu/repository/menu-group-price.repository';
import type { CheckoutData, CheckoutLine, CheckoutPromo } from '@/features/order/domain/checkout.schema';
import { stockItem } from '@/features/stock/testing/stock-item';
import type { FakeCheckoutUnitOfWork } from './fake-checkout-unit-of-work';

export const CALLER = { id: '00000000-0000-4000-8000-00000000000b' };

export const CARNE = stockItem({ id: '10000000-0000-4000-8000-000000000001', name: 'Carne', unitCost: '400.00', stock: '10.0' });
export const POLLO = stockItem({ id: '10000000-0000-4000-8000-000000000002', name: 'Pollo', unitCost: '350.00', stock: '10.0' });
export const MUZZA = stockItem({ id: '10000000-0000-4000-8000-000000000003', group: 'pizzas', name: 'Muzza', unitCost: '2000.00', stock: '2.5', price1: '9000.00' });
export const NAPO = stockItem({ id: '10000000-0000-4000-8000-000000000004', group: 'pizzas', name: 'Napolitana', unitCost: '1500.00', stock: '2.0', price1: '10000.00' });
export const COCA = stockItem({ id: '10000000-0000-4000-8000-000000000005', group: 'coca_cola', name: 'Coca 500', unitCost: '1200.00', stock: '5.0', price1: '2500.00' });
export const HUMITA = stockItem({ id: '10000000-0000-4000-8000-000000000006', name: 'Humita', isActive: false });
export const JYQ = stockItem({ id: '10000000-0000-4000-8000-000000000007', group: 'ciabattas', name: 'Jamón y queso', unitCost: '900.00' });

export const EMPANADA_PRICES: MenuGroupPrice = { group: 'empanadas', price1: '1500.00', price3: '4200.00', price6: '8000.00', price12: '15000.00', version: 1, updatedAt: new Date(0) };

export const halfDozen: CheckoutLine = { group: 'empanadas', presentationKey: 'u6', flavors: [{ menuItemId: CARNE.id, units: 2 }, { menuItemId: POLLO.id, units: 4 }], quantity: 1 };
export const halfAndHalf: CheckoutLine = { group: 'pizzas', presentationKey: 'pizza_2', flavors: [{ menuItemId: MUZZA.id, units: 0.5 }, { menuItemId: NAPO.id, units: 0.5 }], quantity: 1 };
export const cokes = (quantity: number): CheckoutLine => ({ group: 'coca_cola', presentationKey: 'u1', flavors: [{ menuItemId: COCA.id, units: 1 }], quantity });

export const MEDIA_Y_COCA = { name: 'Media + Coca', price: 9000, components: [{ group: 'empanadas' as const, presentationKey: 'u6', quantity: 1 }, { group: 'coca_cola' as const, presentationKey: 'u1', quantity: 1 }] };

export function promoOf(promotionId: string, quantity = 1): CheckoutPromo {
  const media = { group: 'empanadas' as const, presentationKey: 'u6', flavors: [{ menuItemId: CARNE.id, units: 6 }] };
  return { promotionId, quantity, parts: [media, { group: 'coca_cola', presentationKey: 'u1', flavors: [{ menuItemId: COCA.id, units: 1 }] }] };
}

export function checkoutOf(lines: CheckoutLine[], overrides: Partial<CheckoutData> = {}): CheckoutData {
  return { buyerName: null, lines, discountPercentage: 0, discountAmount: 0, payments: [], ...overrides };
}

export function loadMenu(fake: FakeCheckoutUnitOfWork): void {
  fake.reset();
  fake.stock.state.items.push(...[CARNE, POLLO, MUZZA, NAPO, COCA, HUMITA, JYQ].map((item) => ({ ...item })));
  fake.prices.groupPrices.push({ ...EMPANADA_PRICES });
}

export function stockOf(fake: FakeCheckoutUnitOfWork, id: string): string | undefined {
  return fake.stock.state.items.find((item) => item.id === id)?.stock;
}
