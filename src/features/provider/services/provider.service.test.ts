import { beforeEach, describe, expect, it } from 'vitest';
import { createFakeProviderUnitOfWork, type FakeProviderUnitOfWork } from '../testing/fake-provider-unit-of-work';
import { createProviderService, type ProviderService } from './provider.service';

const CALLER = { id: '00000000-0000-4000-8000-00000000000a' };
const INPUT = { name: 'Molino del Sur', phone: '1155550000', email: 'ventas@molino.com' };

describe('provider.service', () => {
  let fake: FakeProviderUnitOfWork;
  let service: ProviderService;

  beforeEach(() => {
    fake = createFakeProviderUnitOfWork();
    service = createProviderService({ unitOfWork: fake });
  });

  it('crea un proveedor y audita CREAR', async () => {
    const { provider, reactivated } = await service.create(CALLER, INPUT);
    expect(reactivated).toBe(false);
    expect(fake.state.audits).toEqual([{ userId: CALLER.id, action: 'CREAR', entityId: provider.id, detail: { name: INPUT.name, note: 'Nuevo registro' } }]);
  });

  it('DUPLICATE: rechaza un nombre que ya usa un proveedor activo, sin distinguir mayúsculas', async () => {
    await service.create(CALLER, INPUT);
    await expect(service.create(CALLER, { ...INPUT, name: 'MOLINO DEL SUR' })).rejects.toMatchObject({ code: 'DUPLICATE' });
  });

  it('reactiva con los datos nuevos a un proveedor inactivo con el mismo nombre', async () => {
    const { provider } = await service.create(CALLER, INPUT);
    await service.setActive(CALLER, { id: provider.id, isActive: false, version: 1 });
    const result = await service.create(CALLER, { ...INPUT, phone: '1199990000' });
    expect(result).toMatchObject({ reactivated: true, provider: { id: provider.id, phone: '1199990000', isActive: true, version: 3 } });
    expect(fake.state.audits.at(-1)?.detail).toEqual({ name: INPUT.name, note: 'Proveedor reactivado' });
  });

  it('edita filtrando por versión y audita ACTUALIZAR', async () => {
    const { provider } = await service.create(CALLER, INPUT);
    const updated = await service.update(CALLER, provider.id, { email: 'nuevo@molino.com', version: 1 });
    expect(updated).toMatchObject({ email: 'nuevo@molino.com', version: 2 });
    expect(fake.state.audits.at(-1)).toMatchObject({ action: 'ACTUALIZAR', detail: { name: INPUT.name, phone: INPUT.phone, email: 'nuevo@molino.com' } });
  });

  it('permite editar conservando el mismo nombre', async () => {
    const { provider } = await service.create(CALLER, INPUT);
    await expect(service.update(CALLER, provider.id, { name: INPUT.name, version: 1 })).resolves.toMatchObject({ version: 2 });
  });

  it('DUPLICATE: no deja renombrar con el nombre de otro proveedor', async () => {
    await service.create(CALLER, INPUT);
    const { provider } = await service.create(CALLER, { ...INPUT, name: 'Otro' });
    await expect(service.update(CALLER, provider.id, { name: INPUT.name, version: 1 })).rejects.toMatchObject({ code: 'DUPLICATE' });
  });

  it.each([
    { caso: 'editar', run: (s: ProviderService, id: string) => s.update(CALLER, id, { phone: '1', version: 9 }) },
    { caso: 'desactivar', run: (s: ProviderService, id: string) => s.setActive(CALLER, { id, isActive: false, version: 9 }) },
    { caso: 'borrar', run: (s: ProviderService, id: string) => s.remove(CALLER, { id, version: 9 }) },
  ])('STALE_VERSION: $caso con una versión vieja', async ({ run }) => {
    const { provider } = await service.create(CALLER, INPUT);
    await expect(run(service, provider.id)).rejects.toMatchObject({ code: 'STALE_VERSION' });
  });

  it('desactiva y audita ELIMINAR; reactiva y audita ACTUALIZAR (T-5 CA-5)', async () => {
    const { provider } = await service.create(CALLER, INPUT);
    await service.setActive(CALLER, { id: provider.id, isActive: false, version: 1 });
    await service.setActive(CALLER, { id: provider.id, isActive: true, version: 2 });
    expect(fake.state.audits.slice(-2).map((entry) => [entry.action, entry.detail.action])).toEqual([['ELIMINAR', 'Desactivado'], ['ACTUALIZAR', 'Reactivado']]);
  });

  it('HAS_RELATIONS: no borra un proveedor con productos', async () => {
    const { provider } = await service.create(CALLER, INPUT);
    fake.state.withProducts.add(provider.id);
    await expect(service.remove(CALLER, { id: provider.id, version: 1 })).rejects.toMatchObject({ code: 'HAS_RELATIONS' });
  });

  it('borra y audita la eliminación permanente', async () => {
    const { provider } = await service.create(CALLER, INPUT);
    await service.remove(CALLER, { id: provider.id, version: 1 });
    expect(await service.list()).toEqual([]);
    expect(fake.state.audits.at(-1)).toMatchObject({ action: 'ELIMINAR', detail: { name: INPUT.name, note: 'Eliminación permanente' } });
  });
});
