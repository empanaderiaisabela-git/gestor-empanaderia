import { beforeEach, describe, expect, it } from 'vitest';
import { createFakeShippingUnitOfWork, type FakeShippingUnitOfWork } from '../testing/fake-shipping-unit-of-work';
import { createShippingService, type ShippingService } from './shipping.service';

const CALLER = { id: '00000000-0000-4000-8000-00000000000a' };
const INPUT = { title: 'Centro', detail: 'Barrio A hasta Barrio B', amount: 1500 };

describe('shipping.service (US-58)', () => {
  let fake: FakeShippingUnitOfWork;
  let service: ShippingService;

  beforeEach(() => {
    fake = createFakeShippingUnitOfWork();
    service = createShippingService({ unitOfWork: fake });
  });

  it('crea un envío y audita CREAR con su título, detalle y monto', async () => {
    const shipping = await service.create(CALLER, INPUT);
    expect(shipping).toMatchObject({ title: 'Centro', amount: '1500.00', isActive: true, version: 1 });
    expect(fake.state.audits).toEqual([{ userId: CALLER.id, action: 'CREAR', entityId: shipping.id, detail: { name: 'Centro', detail: INPUT.detail, amount: 1500 } }]);
  });

  it('DUPLICATE: rechaza un título que ya existe, sin distinguir mayúsculas y aunque esté desactivado', async () => {
    const shipping = await service.create(CALLER, INPUT);
    await service.setActive(CALLER, { id: shipping.id, isActive: false, version: 1 });
    await expect(service.create(CALLER, { ...INPUT, title: 'CENTRO' })).rejects.toMatchObject({ code: 'DUPLICATE' });
  });

  it('edita todo filtrando por versión, conservando el mismo título, y audita ACTUALIZAR', async () => {
    const shipping = await service.create(CALLER, INPUT);
    const updated = await service.update(CALLER, shipping.id, { ...INPUT, amount: 0, version: 1 });
    expect(updated).toMatchObject({ amount: '0.00', version: 2 });
    expect(fake.state.audits.at(-1)).toMatchObject({ action: 'ACTUALIZAR', detail: { name: 'Centro', amount: 0 } });
  });

  it('DUPLICATE: no deja renombrar con el título de otro envío', async () => {
    await service.create(CALLER, INPUT);
    const other = await service.create(CALLER, { ...INPUT, title: 'Norte' });
    await expect(service.update(CALLER, other.id, { ...INPUT, version: 1 })).rejects.toMatchObject({ code: 'DUPLICATE' });
  });

  it.each([
    { caso: 'editar', run: (s: ShippingService, id: string) => s.update(CALLER, id, { ...INPUT, version: 9 }) },
    { caso: 'desactivar', run: (s: ShippingService, id: string) => s.setActive(CALLER, { id, isActive: false, version: 9 }) },
    { caso: 'borrar', run: (s: ShippingService, id: string) => s.remove(CALLER, { id, version: 9 }) },
  ])('STALE_VERSION: $caso con una versión vieja', async ({ run }) => {
    const shipping = await service.create(CALLER, INPUT);
    await expect(run(service, shipping.id)).rejects.toMatchObject({ code: 'STALE_VERSION' });
  });

  it('desactiva y audita ELIMINAR; reactiva y audita ACTUALIZAR (US-58 CA-4)', async () => {
    const shipping = await service.create(CALLER, INPUT);
    await service.setActive(CALLER, { id: shipping.id, isActive: false, version: 1 });
    await service.setActive(CALLER, { id: shipping.id, isActive: true, version: 2 });
    expect(fake.state.audits.slice(-2).map((entry) => [entry.action, entry.detail.action])).toEqual([['ELIMINAR', 'Desactivado'], ['ACTUALIZAR', 'Reactivado']]);
  });

  it('HAS_RELATIONS: no borra un envío que se usó en una venta (D-5)', async () => {
    const shipping = await service.create(CALLER, INPUT);
    fake.state.withSales.add(shipping.id);
    await expect(service.remove(CALLER, { id: shipping.id, version: 1 })).rejects.toMatchObject({ code: 'HAS_RELATIONS' });
  });

  it('borra un envío sin ventas y audita la eliminación permanente', async () => {
    const shipping = await service.create(CALLER, INPUT);
    await service.remove(CALLER, { id: shipping.id, version: 1 });
    expect(await service.list()).toEqual([]);
    expect(fake.state.audits.at(-1)).toMatchObject({ action: 'ELIMINAR', detail: { name: 'Centro', note: 'Eliminación permanente' } });
  });
});
