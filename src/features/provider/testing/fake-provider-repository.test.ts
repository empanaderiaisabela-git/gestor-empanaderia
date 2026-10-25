import { createFakeProviderUnitOfWork } from './fake-provider-unit-of-work';
import { describeProviderRepository } from './provider-repository.behavior';

describeProviderRepository('fake en memoria', async () => {
  const fake = createFakeProviderUnitOfWork();
  return {
    repository: fake.read,
    linkStockEntry: async (providerId) => {
      fake.state.withStockEntries.add(providerId);
    },
  };
});
