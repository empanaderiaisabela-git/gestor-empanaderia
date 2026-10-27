import { describe, expect, it } from 'vitest';
import { createFakeMenuUnitOfWork } from '../testing/fake-menu-unit-of-work';
import { createMenuGroupPriceService } from './menu-group-price.service';

describe('menu-group-price.service', () => {
  it('lista vacío si ningún grupo tiene precio', async () => {
    expect(await createMenuGroupPriceService({ unitOfWork: createFakeMenuUnitOfWork() }).list()).toEqual([]);
  });
});
