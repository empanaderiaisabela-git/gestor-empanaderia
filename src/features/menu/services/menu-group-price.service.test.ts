import { beforeEach, describe, expect, it } from 'vitest';
import { createFakeMenuUnitOfWork, type FakeMenuUnitOfWork } from '../testing/fake-menu-unit-of-work';
import { createMenuGroupPriceService, type MenuGroupPriceService } from './menu-group-price.service';

const CALLER = { id: '00000000-0000-4000-8000-00000000000a' };
const EMPANADAS = { group: 'empanadas' as const, prices: { price1: 1200, price3: 3400, price6: 6500, price12: 12000 }, version: 0 };

describe('menu-group-price.service (US-3 CA-7)', () => {
  let fake: FakeMenuUnitOfWork;
  let service: MenuGroupPriceService;

  beforeEach(() => {
    fake = createFakeMenuUnitOfWork();
    service = createMenuGroupPriceService({ unitOfWork: fake });
  });

  it('carga por primera vez los precios de las empanadas (versión 0) y audita CREAR', async () => {
    expect(await service.save(CALLER, EMPANADAS)).toMatchObject({ group: 'empanadas', price6: '6500.00', version: 1 });
    expect(fake.state.audits).toEqual([{ userId: CALLER.id, action: 'CREAR', entity: 'MENU_GROUP_PRICES', entityId: null, detail: expect.objectContaining({ group: 'empanadas', price12: '12000.00' }) }]);
  });

  it('cambia los precios con la versión actual y audita ACTUALIZAR', async () => {
    await service.save(CALLER, EMPANADAS);
    const updated = await service.save(CALLER, { ...EMPANADAS, prices: { ...EMPANADAS.prices, price1: 1300 }, version: 1 });
    expect(updated).toMatchObject({ price1: '1300.00', version: 2 });
    expect(fake.state.audits.at(-1)).toMatchObject({ action: 'ACTUALIZAR' });
  });

  it('STALE_VERSION: otra persona ya los cargó o los cambió', async () => {
    await service.save(CALLER, EMPANADAS);
    await expect(service.save(CALLER, EMPANADAS)).rejects.toMatchObject({ code: 'STALE_VERSION' });
    await expect(service.save(CALLER, { ...EMPANADAS, version: 7 })).rejects.toMatchObject({ code: 'STALE_VERSION' });
  });

  it('lista los precios de los grupos que ya los tienen', async () => {
    expect(await service.list()).toEqual([]);
    await service.save(CALLER, { group: 'ciabattas', prices: { price1: 6000 }, version: 0 });
    expect((await service.list()).map((row) => row.group)).toEqual(['ciabattas']);
  });
});
