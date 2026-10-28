import { beforeEach, describe, expect, it } from 'vitest';
import { createFakeMenuUnitOfWork, type FakeMenuUnitOfWork } from '../testing/fake-menu-unit-of-work';
import { type CatalogService, createCatalogService } from './catalog.service';

async function addItem(fake: FakeMenuUnitOfWork, changes: { name: string; isVisible: boolean; isActive?: boolean }): Promise<string> {
  const item = await fake.read.items.insert({ group: 'empanadas', name: changes.name, unitCost: 400, prices: { price1: 1200, price3: 3400, price6: 6500, price12: 12000 } });
  await fake.read.items.update({ id: item.id, version: 1 }, { isVisible: changes.isVisible, isActive: changes.isActive ?? true });
  return item.id;
}

describe('catálogo público con el modelo nuevo (T-12 CA-4)', () => {
  let fake: FakeMenuUnitOfWork;
  let service: CatalogService;
  let visible: string;
  let hidden: string;

  beforeEach(async () => {
    fake = createFakeMenuUnitOfWork();
    service = createCatalogService({ unitOfWork: fake });
    visible = await addItem(fake, { name: 'Carne', isVisible: true });
    hidden = await addItem(fake, { name: 'Humita', isVisible: false });
    await addItem(fake, { name: 'Verdura', isVisible: true, isActive: false });
    await fake.read.photos.insert({ publicId: 'menu/carne/1', url: 'https://fotos.test/carne.webp', menuItemId: visible });
  });

  it('muestra sólo los gustos activos y visibles, con sus precios y sus fotos', async () => {
    const items = await service.list();
    expect(items.map((item) => item.name)).toEqual(['Carne']);
    expect(items[0]).toMatchObject({ inStock: false, images: [{ publicId: 'menu/carne/1', url: 'https://fotos.test/carne.webp' }] });
    expect(items[0].prices.map((price) => price.value)).toEqual([1200, 3400, 6500, 12000]);
  });

  it('no muestra un gusto sin precio', async () => {
    const pizza = await fake.read.items.insert({ group: 'pizzas', name: 'Muzza' });
    await fake.read.items.update({ id: pizza.id, version: 1 }, { isVisible: true });
    expect((await service.list()).map((item) => item.name)).toEqual(['Carne']);
    expect(await service.item(pizza.id)).toBeNull();
    await fake.read.items.update({ id: pizza.id, version: 2 }, { prices: { price1: 11000 } });
    expect((await service.list()).map((item) => item.name)).toEqual(['Carne', 'Muzza']);
  });

  it('la ficha de un gusto oculto o inexistente no existe para el público', async () => {
    expect(await service.item(visible)).toMatchObject({ name: 'Carne' });
    expect(await service.item(hidden)).toBeNull();
    expect(await service.item('11111111-1111-4111-8111-111111111111')).toBeNull();
  });
});
