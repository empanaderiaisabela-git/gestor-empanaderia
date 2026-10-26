import { createFakePromotionUnitOfWork } from './fake-promotion-unit-of-work';
import { describePromotionRepository } from './promotion-repository.behavior';

describePromotionRepository('fake en memoria', async () => {
  const fake = createFakePromotionUnitOfWork();
  return { repository: fake.read, linkSale: async (promotionId) => void fake.state.withSales.add(promotionId) };
});
