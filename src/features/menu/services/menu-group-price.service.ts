import { AppError } from '@/lib/errors';
import type { MenuGroupPricesInput } from '@/features/menu/domain/menu-group-price.schema';
import type { MenuGroupPrice } from '@/features/menu/repository/menu-group-price.repository';
import { drizzleMenuUnitOfWork, type MenuUnitOfWork } from '@/features/menu/repository/menu-unit-of-work';

type Caller = { id: string };

export type MenuGroupPriceService = {
  list(): Promise<MenuGroupPrice[]>;
  save(caller: Caller, input: MenuGroupPricesInput): Promise<MenuGroupPrice>;
};

export function createMenuGroupPriceService({ unitOfWork }: { unitOfWork: MenuUnitOfWork }): MenuGroupPriceService {
  return {
    list: () => unitOfWork.read.groupPrices.findAll(),
    save: (caller, input) =>
      unitOfWork.run(async ({ groupPrices, audit }) => {
        const saved = await groupPrices.save(input);
        if (!saved) throw new AppError('STALE_VERSION');
        const detail = { group: saved.group, price1: saved.price1, price3: saved.price3, price6: saved.price6, price12: saved.price12 };
        await audit({ userId: caller.id, action: input.version === 0 ? 'CREAR' : 'ACTUALIZAR', entity: 'MENU_GROUP_PRICES', entityId: null, detail });
        return saved;
      }),
  };
}

export const menuGroupPriceService = createMenuGroupPriceService({ unitOfWork: drizzleMenuUnitOfWork });
