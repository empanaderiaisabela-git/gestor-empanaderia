import { beforeEach, describe, expect, it } from 'vitest';
import { createFakeMenuUnitOfWork, type FakeMenuUnitOfWork } from '../testing/fake-menu-unit-of-work';
import { createMenuItemService, type MenuItemService } from './menu-item.service';

const CALLER = { id: '00000000-0000-4000-8000-00000000000a' };
const AQUARIUS = { group: 'coca_cola' as const, drinkName: 'Aquarius', liters: 1.5 };

describe('alta de bebidas con bebida, litros y sabor (US-49 CA-2)', () => {
  let fake: FakeMenuUnitOfWork;
  let service: MenuItemService;

  beforeEach(() => {
    fake = createFakeMenuUnitOfWork();
    service = createMenuItemService({ unitOfWork: fake });
  });

  it('arma el nombre y guarda bebida, litros y sabor', async () => {
    const item = await service.create(CALLER, { ...AQUARIUS, flavor: 'Manzana' });
    expect(item).toMatchObject({ name: 'Aquarius 1.5 L Manzana', drinkName: 'Aquarius', liters: '1.500', flavor: 'Manzana', price1: null });
    expect((await service.create(CALLER, { group: 'pepsi', drinkName: 'Quilmes', liters: 1 })).name).toBe('Quilmes 1 L');
  });

  it('un sabor nuevo toma el costo y el precio de su familia (P-1)', async () => {
    const manzana = await service.create(CALLER, { ...AQUARIUS, flavor: 'Manzana' });
    Object.assign(fake.state.rows[0], { unitCost: '900.00', price1: '2500.00' });
    expect(await service.create(CALLER, { ...AQUARIUS, drinkName: 'aquarius', flavor: 'Pera' })).toMatchObject({ unitCost: '900.00', price1: '2500.00' });
    expect(await service.create(CALLER, { ...AQUARIUS, liters: 1, flavor: 'Pera' })).toMatchObject({ unitCost: null, price1: null });
    expect(manzana.id).toBeDefined();
  });

  it('completar una bebida vieja en Alta la suma a su familia con su precio (P-1)', async () => {
    await service.create(CALLER, { ...AQUARIUS, flavor: 'Manzana' });
    Object.assign(fake.state.rows[0], { unitCost: '900.00', price1: '2500.00' });
    const vieja = await service.create(CALLER, { group: 'coca_cola', drinkName: 'Aquarius Pomelo', liters: 2 });
    Object.assign(fake.state.rows[1], { drinkName: null, liters: null, name: 'Aquarius 1,5 L Pomelo', price1: '2000.00' });
    expect(await service.update(CALLER, vieja.id, { ...AQUARIUS, flavor: 'Pomelo', version: 1 })).toMatchObject({ name: 'Aquarius 1.5 L Pomelo', price1: '2500.00', unitCost: '900.00' });
  });

  it('VALIDATION si se edita una bebida como comida o al revés; DUPLICATE con la misma bebida, litros y sabor', async () => {
    const bebida = await service.create(CALLER, { ...AQUARIUS, flavor: 'Manzana' });
    const carne = await service.create(CALLER, { group: 'empanadas', name: 'Carne' });
    await expect(service.update(CALLER, bebida.id, { name: 'Otra', version: 1 })).rejects.toMatchObject({ code: 'VALIDATION' });
    await expect(service.update(CALLER, carne.id, { ...AQUARIUS, version: 1 })).rejects.toMatchObject({ code: 'VALIDATION' });
    await expect(service.create(CALLER, { ...AQUARIUS, flavor: 'manzana' })).rejects.toMatchObject({ code: 'DUPLICATE' });
  });
});
