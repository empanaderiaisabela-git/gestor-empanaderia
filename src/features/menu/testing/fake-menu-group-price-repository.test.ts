import { createFakeMenuUnitOfWork } from './fake-menu-unit-of-work';
import { describeMenuGroupPriceRepository } from './menu-group-price-repository.behavior';

describeMenuGroupPriceRepository('fake en memoria', async () => createFakeMenuUnitOfWork().read.groupPrices);
