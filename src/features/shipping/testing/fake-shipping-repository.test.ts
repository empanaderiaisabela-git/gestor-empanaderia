import { createFakeShippingUnitOfWork } from './fake-shipping-unit-of-work';
import { describeShippingRepository } from './shipping-repository.behavior';

describeShippingRepository('fake en memoria', async () => {
  const fake = createFakeShippingUnitOfWork();
  return {
    repository: fake.read,
    linkSale: async (shippingId) => {
      fake.state.withSales.add(shippingId);
    },
  };
});
