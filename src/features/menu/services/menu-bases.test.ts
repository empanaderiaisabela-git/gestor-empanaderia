import { beforeEach, describe, expect, it } from 'vitest';
import type { MenuItem } from '@/features/menu/repository/menu-item.repository';
import { createFakeMenuUnitOfWork, type FakeMenuUnitOfWork } from '../testing/fake-menu-unit-of-work';
import { createCatalogService } from './catalog.service';
import { createMenuItemService } from './menu-item.service';

const CALLER = { id: '00000000-0000-4000-8000-00000000000a' };

function patch(fake: FakeMenuUnitOfWork, id: string, changes: Partial<MenuItem>): void {
  const row = fake.state.rows.find((candidate) => candidate.id === id);
  if (row) Object.assign(row, changes);
}

async function addBase(fake: FakeMenuUnitOfWork): Promise<string> {
  const { id } = await fake.read.items.insert({ group: 'pizzas', name: 'Prepizza' });
  patch(fake, id, { isBase: true, isVisible: true });
  return id;
}

async function addPizza(fake: FakeMenuUnitOfWork, name: string): Promise<string> {
  const { id } = await fake.read.items.insert({ group: 'pizzas', name, unitCost: 3000, prices: { price1: 11000 } });
  await fake.read.items.update({ id, version: 1 }, { isVisible: true });
  return id;
}

describe('prepizzas y panes en Alta y en el catálogo (US-29 CA-1, D-2 y D-9)', () => {
  let fake: FakeMenuUnitOfWork;
  let base: string;

  beforeEach(async () => {
    fake = createFakeMenuUnitOfWork();
    base = await addBase(fake);
  });

  it('VALIDATION: una base no se edita, no se activa ni desactiva, no se muestra en el catálogo y no se borra', async () => {
    const service = createMenuItemService({ unitOfWork: fake });
    await expect(service.update(CALLER, base, { name: 'Prepizza grande', version: 1 })).rejects.toMatchObject({ code: 'VALIDATION' });
    await expect(service.setActive(CALLER, { id: base, isActive: false, version: 1 })).rejects.toMatchObject({ code: 'VALIDATION' });
    await expect(service.setVisible(CALLER, { id: base, isVisible: true, version: 1 })).rejects.toMatchObject({ code: 'VALIDATION' });
    await expect(service.remove(CALLER, { id: base, version: 1 })).rejects.toMatchObject({ code: 'VALIDATION' });
    expect(fake.state.rows).toMatchObject([{ name: 'Prepizza', isActive: true, version: 1 }]);
    expect(fake.state.audits).toEqual([]);
  });

  it('la base es la primera fila de su grupo', async () => {
    await addPizza(fake, 'Fugazzeta');
    expect((await fake.read.items.findAll()).map((item) => item.name)).toEqual(['Prepizza', 'Fugazzeta']);
  });

  it('el catálogo no muestra la base, y un gusto de pizza figura con stock si queda al menos 1 prepizza', async () => {
    const catalog = createCatalogService({ unitOfWork: fake });
    const muzza = await addPizza(fake, 'Muzza');
    expect(await catalog.list()).toMatchObject([{ name: 'Muzza', inStock: false }]);
    expect(await catalog.item(base)).toBeNull();
    patch(fake, base, { stock: '1.0' });
    expect(await catalog.item(muzza)).toMatchObject({ name: 'Muzza', inStock: true });
  });
});
