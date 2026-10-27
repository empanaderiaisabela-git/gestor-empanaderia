import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fakeMenu } from '../testing/fake-menu-unit-of-work';
import { fetchMenuGroupPrices } from './fetch-menu-group-prices';

vi.mock('@/features/menu/repository/menu-unit-of-work', async () => {
  const { fakeMenu: fake } = await import('../testing/fake-menu-unit-of-work');
  return { drizzleMenuUnitOfWork: fake };
});

describe('precios del grupo: lectura', () => {
  beforeEach(() => {
    fakeMenu.reset();
  });

  it('sin sesión, leer devuelve una lista vacía', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    expect(await fetchMenuGroupPrices()).toEqual([]);
  });
});
