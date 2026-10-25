import { createFakeMenuUnitOfWork } from './fake-menu-unit-of-work';
import { describeMenuItemRepository } from './menu-item-repository.behavior';

describeMenuItemRepository(
  'fake en memoria',
  async () => {
    const fake = createFakeMenuUnitOfWork();
    return {
      repository: fake.read.items,
      linkMovement: async (menuItemId) => {
        fake.state.withMovements.add(menuItemId);
      },
    };
  },
  { withMovements: true }
);
