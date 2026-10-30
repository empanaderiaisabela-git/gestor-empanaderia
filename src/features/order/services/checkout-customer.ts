import { AppError } from '@/lib/errors';
import type { CheckoutBuyer } from '@/features/order/domain/checkout.schema';
import type { CheckoutScope } from '@/features/order/repository/checkout-unit-of-work';

export async function customerFor(scope: CheckoutScope, userId: string, buyer: CheckoutBuyer): Promise<string> {
  if (buyer.customerId) {
    if (!(await scope.customers.isActive(buyer.customerId))) throw new AppError('NOT_FOUND', { entity: 'el cliente' });
    return buyer.customerId;
  }
  const customer = { name: buyer.name, phone: buyer.phone, address: buyer.address };
  const customerId = await scope.customers.insert(customer);
  await scope.audit({ userId, action: 'CREAR', entity: 'CUSTOMER', entityId: customerId, detail: customer });
  return customerId;
}
