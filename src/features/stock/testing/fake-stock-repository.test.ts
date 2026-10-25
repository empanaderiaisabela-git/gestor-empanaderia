import { createFakeStockUnitOfWork } from './fake-stock-unit-of-work';
import { stockItem } from './stock-item';
import { describeStockRepository } from './stock-repository.behavior';

describeStockRepository('fake en memoria', async () => {
  const fake = createFakeStockUnitOfWork();
  const item = stockItem({ group: 'pizzas', name: 'Muzza', stock: '2.5', unitCost: '3000.00' });
  const userId = '00000000-0000-4000-8000-00000000000a';
  const providerId = '22222222-2222-4222-8222-222222222222';
  fake.state.items.push(item);
  fake.state.usernames.set(userId, 'admin');
  fake.state.providerNames.set(providerId, 'Molino del Sur');
  return { repository: fake.read, itemId: item.id, userId, providerId };
});
