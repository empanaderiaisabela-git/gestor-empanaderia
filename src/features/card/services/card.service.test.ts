import { beforeEach, describe, expect, it } from 'vitest';
import { CARD_INPUT } from '../testing/card-repository.behavior';
import { createFakeCardUnitOfWork, type FakeCardUnitOfWork } from '../testing/fake-card-unit-of-work';
import { type CardService, createCardService } from './card.service';

const CALLER = { id: '00000000-0000-4000-8000-00000000000a' };

describe('card.service (US-10)', () => {
  let fake: FakeCardUnitOfWork;
  let service: CardService;

  beforeEach(() => {
    fake = createFakeCardUnitOfWork();
    service = createCardService({ unitOfWork: fake });
  });

  it('crea una tarjeta activa y audita CREAR con sus planes (CA-2 y CA-3)', async () => {
    const card = await service.create(CALLER, CARD_INPUT);
    expect(card).toMatchObject({ isActive: true, version: 1 });
    expect(fake.state.audits).toEqual([{ userId: CALLER.id, action: 'CREAR', entityId: card.id, detail: { name: 'Visa', plans: '1 cuota sin recargo · 3 cuotas +10,5 %' } }]);
  });

  it('DUPLICATE: rechaza el nombre de otra tarjeta sin distinguir mayúsculas, aunque esté desactivada', async () => {
    const card = await service.create(CALLER, CARD_INPUT);
    await service.setActive(CALLER, { id: card.id, isActive: false, version: 1 });
    await expect(service.create(CALLER, { ...CARD_INPUT, name: 'VISA' })).rejects.toMatchObject({ code: 'DUPLICATE' });
  });

  it('edita los planes con su versión, conserva su nombre y no deja usar el de otra', async () => {
    const card = await service.create(CALLER, CARD_INPUT);
    const updated = await service.update(CALLER, card.id, { name: 'Visa', plans: [{ installments: 6, surchargePct: 20 }], version: 1 });
    expect(updated).toMatchObject({ version: 2, plans: [{ installments: 6, surchargePct: '20.00' }] });
    expect(fake.state.audits.at(-1)).toMatchObject({ action: 'ACTUALIZAR', detail: { plans: '6 cuotas +20 %' } });
    const other = await service.create(CALLER, { ...CARD_INPUT, name: 'Naranja' });
    await expect(service.update(CALLER, other.id, { ...CARD_INPUT, version: 1 })).rejects.toMatchObject({ code: 'DUPLICATE' });
  });

  it.each([
    { caso: 'editar', run: (s: CardService, id: string) => s.update(CALLER, id, { ...CARD_INPUT, version: 9 }) },
    { caso: 'desactivar', run: (s: CardService, id: string) => s.setActive(CALLER, { id, isActive: false, version: 9 }) },
    { caso: 'borrar', run: (s: CardService, id: string) => s.remove(CALLER, { id, version: 9 }) },
  ])('STALE_VERSION: $caso con una versión vieja', async ({ run }) => {
    const card = await service.create(CALLER, CARD_INPUT);
    await expect(run(service, card.id)).rejects.toMatchObject({ code: 'STALE_VERSION' });
  });

  it('STALE_VERSION: borrar una tarjeta que ya no existe', async () => {
    await expect(service.remove(CALLER, { id: crypto.randomUUID(), version: 1 })).rejects.toMatchObject({ code: 'STALE_VERSION' });
  });

  it('desactiva y reactiva con su auditoría; borra con la eliminación permanente', async () => {
    const card = await service.create(CALLER, CARD_INPUT);
    await service.setActive(CALLER, { id: card.id, isActive: false, version: 1 });
    await service.setActive(CALLER, { id: card.id, isActive: true, version: 2 });
    await service.remove(CALLER, { id: card.id, version: 3 });
    expect(fake.state.audits.slice(-3).map((entry) => [entry.action, entry.detail.action ?? entry.detail.note])).toEqual([
      ['ELIMINAR', 'Desactivada'],
      ['ACTUALIZAR', 'Reactivada'],
      ['ELIMINAR', 'Eliminación permanente'],
    ]);
    expect(await service.list()).toEqual([]);
  });
});
