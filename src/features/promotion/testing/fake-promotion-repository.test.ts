import { createFakePromotionUnitOfWork } from './fake-promotion-unit-of-work';
import { describePromotionRepository } from './promotion-repository.behavior';

describePromotionRepository('fake en memoria', async () => createFakePromotionUnitOfWork().read);
