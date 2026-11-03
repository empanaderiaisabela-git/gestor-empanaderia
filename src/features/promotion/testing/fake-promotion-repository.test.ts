import type { MenuGroup } from '@/features/menu/domain/menu-groups';
import { createFakePromotionUnitOfWork } from './fake-promotion-unit-of-work';
import { describePromotionRepository } from './promotion-repository.behavior';

describePromotionRepository('fake en memoria', async () => {
  const fake = createFakePromotionUnitOfWork();
  const addDrink = async (group: MenuGroup, drinkName: string): Promise<string> => {
    const id = crypto.randomUUID();
    fake.state.menuItems.set(id, { group, name: `${drinkName} 1.5L`, drinkName, drinkSize: '1.5L' });
    return id;
  };
  return { repository: fake.read, linkSale: async (promotionId) => void fake.state.withSales.add(promotionId), addDrink };
});
