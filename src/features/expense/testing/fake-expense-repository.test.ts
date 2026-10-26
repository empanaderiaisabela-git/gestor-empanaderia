import { describeExpenseRepository } from './expense-repository.behavior';
import { createFakeExpenseUnitOfWork } from './fake-expense-unit-of-work';

describeExpenseRepository('fake en memoria', async () => ({ repository: createFakeExpenseUnitOfWork().read, userId: '00000000-0000-4000-8000-00000000000a' }));
