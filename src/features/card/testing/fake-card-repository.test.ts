import { describeCardRepository } from './card-repository.behavior';
import { createFakeCardUnitOfWork } from './fake-card-unit-of-work';

describeCardRepository('fake en memoria', async () => ({ repository: createFakeCardUnitOfWork().read }));
