import { describeCardRepository } from './card-repository.behavior';
import { createFakeCardUnitOfWork } from './fake-card-unit-of-work';

describeCardRepository('fake en memoria', async () => {
  const fake = createFakeCardUnitOfWork();
  return { repository: fake.read, linkPayment: async (cardId) => void fake.state.withPayments.add(cardId) };
});
