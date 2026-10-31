import { AppError } from '@/lib/errors';
import { HAM_CATEGORY_LABEL, type HamPriceDef, type HamPriceInput, NO_HAM_PRICE } from '@/features/menu/domain/pizza-extra.schema';
import { drizzlePizzaExtraUnitOfWork, type PizzaExtra, type PizzaExtraUnitOfWork } from '@/features/menu/repository/pizza-extra.repository';

type Caller = { id: string };
export type PizzaExtraService = {
  hamPrice(): Promise<HamPriceDef>;
  setHamPrice(caller: Caller, input: HamPriceInput): Promise<HamPriceDef>;
};

const defOf = (row: PizzaExtra | null): HamPriceDef => (row ? { price: Number(row.price), version: row.version } : NO_HAM_PRICE);

export function createPizzaExtraService({ unitOfWork }: { unitOfWork: PizzaExtraUnitOfWork }): PizzaExtraService {
  return {
    hamPrice: async () => defOf(await unitOfWork.read.findHam()),
    setHamPrice: (caller, input) =>
      unitOfWork.run(async ({ extras, audit }) => {
        const saved = await extras.saveHam(input);
        if (!saved) throw new AppError('STALE_VERSION');
        await audit({ userId: caller.id, action: 'ACTUALIZAR', entity: 'PIZZA_EXTRA', entityId: null, detail: { name: HAM_CATEGORY_LABEL, price: input.price } });
        return defOf(saved);
      }),
  };
}

export const pizzaExtraService = createPizzaExtraService({ unitOfWork: drizzlePizzaExtraUnitOfWork });
