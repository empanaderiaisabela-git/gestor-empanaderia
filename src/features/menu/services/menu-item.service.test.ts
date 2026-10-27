import { beforeEach, describe, expect, it } from 'vitest';
import type { MenuItemInput } from '@/features/menu/domain/menu-item.schema';
import { createFakeMenuUnitOfWork, type FakeMenuUnitOfWork } from '../testing/fake-menu-unit-of-work';
import { createMenuItemService, type MenuItemService } from './menu-item.service';

const CALLER = { id: '00000000-0000-4000-8000-00000000000a' };
const EMPANADA: MenuItemInput = { group: 'empanadas', name: 'Carne suave', unitCost: 400 };
const PIZZA: MenuItemInput = { group: 'pizzas', name: 'Muzza', unitCost: 3000, prices: { price1: 11000 } };
const EDIT = { name: 'Muzza', unitCost: 3100, prices: { price1: 11500 }, version: 1 };

describe('menu-item.service (US-3)', () => {
  let fake: FakeMenuUnitOfWork;
  let service: MenuItemService;

  beforeEach(() => {
    fake = createFakeMenuUnitOfWork();
    service = createMenuItemService({ unitOfWork: fake });
  });

  it('crea un gusto sin stock y audita CREAR', async () => {
    const item = await service.create(CALLER, EMPANADA);
    expect(item).toMatchObject({ name: 'Carne suave', stock: '0.0', price1: null });
    expect(fake.state.audits).toEqual([{ userId: CALLER.id, action: 'CREAR', entity: 'MENU_ITEM', entityId: item.id, detail: expect.objectContaining({ group: 'empanadas', note: 'Nuevo producto' }) }]);
  });

  it('DUPLICATE: rechaza el mismo nombre en el mismo grupo, sin distinguir mayúsculas, aunque esté inactivo', async () => {
    const item = await service.create(CALLER, PIZZA);
    await service.setActive(CALLER, { id: item.id, isActive: false, version: 1 });
    await expect(service.create(CALLER, { ...PIZZA, name: 'MUZZA' })).rejects.toMatchObject({ code: 'DUPLICATE' });
  });

  it('permite el mismo nombre en otro grupo', async () => {
    await service.create(CALLER, PIZZA);
    await expect(service.create(CALLER, { ...EMPANADA, name: 'Muzza' })).resolves.toMatchObject({ group: 'empanadas' });
  });

  it('edita nombre, costo y precios con la versión, y audita ACTUALIZAR', async () => {
    const item = await service.create(CALLER, PIZZA);
    expect(await service.update(CALLER, item.id, { ...EDIT, name: 'Muzza especial' })).toMatchObject({ name: 'Muzza especial', unitCost: '3100.00', price1: '11500.00', version: 2 });
    expect(fake.state.audits.at(-1)).toMatchObject({ action: 'ACTUALIZAR', detail: { name: 'Muzza especial' } });
  });

  it('VALIDATION: al editar, los precios tienen que corresponder al grupo del gusto', async () => {
    const empanada = await service.create(CALLER, EMPANADA);
    const pizza = await service.create(CALLER, PIZZA);
    await expect(service.update(CALLER, empanada.id, { ...EDIT, name: 'Carne suave' })).rejects.toMatchObject({ code: 'VALIDATION' });
    await expect(service.update(CALLER, pizza.id, { name: 'Muzza', unitCost: 1, version: 1 })).rejects.toMatchObject({ code: 'VALIDATION' });
  });

  it('DUPLICATE: no deja renombrar con el nombre de otro gusto del grupo', async () => {
    await service.create(CALLER, PIZZA);
    const other = await service.create(CALLER, { ...PIZZA, name: 'Napolitana' });
    await expect(service.update(CALLER, other.id, EDIT)).rejects.toMatchObject({ code: 'DUPLICATE' });
  });

  it('NOT_FOUND: editar un gusto que ya no existe', async () => {
    await expect(service.update(CALLER, '11111111-1111-4111-8111-111111111111', EDIT)).rejects.toMatchObject({ code: 'NOT_FOUND', message: 'El producto ya no existe.' });
  });

  it.each([
    { caso: 'editar', run: (s: MenuItemService, id: string) => s.update(CALLER, id, { ...EDIT, version: 9 }) },
    { caso: 'desactivar', run: (s: MenuItemService, id: string) => s.setActive(CALLER, { id, isActive: false, version: 9 }) },
    { caso: 'borrar', run: (s: MenuItemService, id: string) => s.remove(CALLER, { id, version: 9 }) },
  ])('STALE_VERSION: $caso con una versión vieja', async ({ run }) => {
    const item = await service.create(CALLER, PIZZA);
    await expect(run(service, item.id)).rejects.toMatchObject({ code: 'STALE_VERSION' });
  });

  it('desactiva y audita ELIMINAR; reactiva y audita ACTUALIZAR', async () => {
    const item = await service.create(CALLER, PIZZA);
    await service.setActive(CALLER, { id: item.id, isActive: false, version: 1 });
    await service.setActive(CALLER, { id: item.id, isActive: true, version: 2 });
    expect(fake.state.audits.slice(-2).map((audit) => [audit.action, audit.detail.action])).toEqual([['ELIMINAR', 'Desactivado'], ['ACTUALIZAR', 'Reactivado']]);
  });

  it('borra, audita y deja de listarlo; con movimientos la base lo rechaza', async () => {
    const item = await service.create(CALLER, PIZZA);
    const sold = await service.create(CALLER, { ...PIZZA, name: 'Napolitana' });
    fake.state.withMovements.add(sold.id);
    await service.remove(CALLER, { id: item.id, version: 1 });
    expect((await service.list()).map((row) => row.name)).toEqual(['Napolitana']);
    expect(fake.state.audits.at(-1)).toMatchObject({ action: 'ELIMINAR', detail: { note: 'Eliminación permanente' } });
    await expect(service.remove(CALLER, { id: sold.id, version: 1 })).rejects.toMatchObject({ cause: { code: '23503' } });
  });
});
