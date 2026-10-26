import { beforeEach, describe, expect, it } from 'vitest';
import { createFakePromotionUnitOfWork, type FakePromotionUnitOfWork } from '../testing/fake-promotion-unit-of-work';
import { PROMO_INPUT } from '../testing/promotion-repository.behavior';
import { createPromotionService, type PromotionService } from './promotion.service';

const CALLER = { id: '00000000-0000-4000-8000-00000000000a' };
const COCA = { group: 'coca_cola' as const, presentationKey: 'u1', quantity: 1 };

describe('promotion.service (US-8)', () => {
  let fake: FakePromotionUnitOfWork;
  let service: PromotionService;

  beforeEach(() => {
    fake = createFakePromotionUnitOfWork();
    service = createPromotionService({ unitOfWork: fake });
  });

  it('crea una promo activa y audita CREAR con su contenido (CA-3)', async () => {
    const promotion = await service.create(CALLER, PROMO_INPUT);
    expect(promotion).toMatchObject({ isActive: true, version: 1 });
    expect(fake.state.audits).toEqual([
      { userId: CALLER.id, action: 'CREAR', entityId: promotion.id, detail: { name: PROMO_INPUT.name, price: 15000, components: 'Empanadas · 1 docena + Coca-Cola · 1 unidad × 2' } },
    ]);
  });

  it('DUPLICATE: rechaza el nombre de otra promo, sin distinguir mayúsculas, aunque esté desactivada', async () => {
    const promotion = await service.create(CALLER, PROMO_INPUT);
    await service.setActive(CALLER, { id: promotion.id, isActive: false, version: 1 });
    await expect(service.create(CALLER, { ...PROMO_INPUT, name: PROMO_INPUT.name.toUpperCase() })).rejects.toMatchObject({ code: 'DUPLICATE' });
  });

  it('edita precio y componentes filtrando por versión, y conserva su propio nombre', async () => {
    const promotion = await service.create(CALLER, PROMO_INPUT);
    const updated = await service.update(CALLER, promotion.id, { ...PROMO_INPUT, price: 13000, components: [COCA], version: 1 });
    expect(updated).toMatchObject({ version: 2, components: [COCA] });
    expect(fake.state.audits.at(-1)).toMatchObject({ action: 'ACTUALIZAR', detail: { price: 13000, components: 'Coca-Cola · 1 unidad' } });
  });

  it('DUPLICATE: no deja renombrar con el nombre de otra promo', async () => {
    await service.create(CALLER, PROMO_INPUT);
    const other = await service.create(CALLER, { ...PROMO_INPUT, name: 'Otra' });
    await expect(service.update(CALLER, other.id, { ...PROMO_INPUT, version: 1 })).rejects.toMatchObject({ code: 'DUPLICATE' });
  });

  it.each([
    { caso: 'editar', run: (s: PromotionService, id: string) => s.update(CALLER, id, { ...PROMO_INPUT, version: 9 }) },
    { caso: 'desactivar', run: (s: PromotionService, id: string) => s.setActive(CALLER, { id, isActive: false, version: 9 }) },
    { caso: 'borrar', run: (s: PromotionService, id: string) => s.remove(CALLER, { id, version: 9 }) },
  ])('STALE_VERSION: $caso con una versión vieja', async ({ run }) => {
    const promotion = await service.create(CALLER, PROMO_INPUT);
    await expect(run(service, promotion.id)).rejects.toMatchObject({ code: 'STALE_VERSION' });
  });

  it('STALE_VERSION: borrar una promo que ya no existe', async () => {
    await expect(service.remove(CALLER, { id: crypto.randomUUID(), version: 1 })).rejects.toMatchObject({ code: 'STALE_VERSION' });
  });

  it('desactiva y audita ELIMINAR; reactiva y audita ACTUALIZAR (CA-3: sin vigencia, la quita el admin)', async () => {
    const promotion = await service.create(CALLER, PROMO_INPUT);
    await service.setActive(CALLER, { id: promotion.id, isActive: false, version: 1 });
    await service.setActive(CALLER, { id: promotion.id, isActive: true, version: 2 });
    expect(fake.state.audits.slice(-2).map((entry) => [entry.action, entry.detail.action])).toEqual([
      ['ELIMINAR', 'Desactivada'],
      ['ACTUALIZAR', 'Reactivada'],
    ]);
  });

  it('borra y audita la eliminación permanente', async () => {
    const promotion = await service.create(CALLER, PROMO_INPUT);
    await service.remove(CALLER, { id: promotion.id, version: 1 });
    expect(await service.list()).toEqual([]);
    expect(fake.state.audits.at(-1)).toMatchObject({ action: 'ELIMINAR', detail: { name: PROMO_INPUT.name, note: 'Eliminación permanente' } });
  });
});
