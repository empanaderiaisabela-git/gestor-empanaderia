import { AppError } from '@/lib/errors';
import { describeComponents } from '@/features/promotion/domain/promotion-describe';
import type { PromotionDeleteInput, PromotionInput, PromotionToggleInput, PromotionUpdateInput } from '@/features/promotion/domain/promotion.schema';
import type { Promotion } from '@/features/promotion/repository/promotion.repository';
import { drizzlePromotionUnitOfWork, type PromotionScope, type PromotionUnitOfWork } from '@/features/promotion/repository/promotion-unit-of-work';

type Caller = { id: string };

export type PromotionService = {
  list(): Promise<Promotion[]>;
  create(caller: Caller, input: PromotionInput): Promise<Promotion>;
  update(caller: Caller, id: string, input: PromotionUpdateInput): Promise<Promotion>;
  setActive(caller: Caller, input: PromotionToggleInput): Promise<Promotion>;
  remove(caller: Caller, input: PromotionDeleteInput): Promise<void>;
};

const orStale = (promotion: Promotion | null): Promotion => {
  if (!promotion) throw new AppError('STALE_VERSION');
  return promotion;
};

const summary = (promotion: Promotion): Record<string, unknown> => ({ name: promotion.name, price: Number(promotion.price), components: describeComponents(promotion.components) });

async function assertFreeName({ promotions }: PromotionScope, name: string, ownId: string | null): Promise<void> {
  const sameName = await promotions.findByName(name);
  if (sameName && sameName.id !== ownId) throw new AppError('DUPLICATE');
}

async function createPromotion(scope: PromotionScope, caller: Caller, input: PromotionInput): Promise<Promotion> {
  await assertFreeName(scope, input.name, null);
  const promotion = await scope.promotions.insert(input);
  await scope.audit({ userId: caller.id, action: 'CREAR', entityId: promotion.id, detail: summary(promotion) });
  return promotion;
}

async function updatePromotion(scope: PromotionScope, caller: Caller, { id, input }: { id: string; input: PromotionUpdateInput }): Promise<Promotion> {
  const { version, ...changes } = input;
  await assertFreeName(scope, changes.name, id);
  const promotion = orStale(await scope.promotions.update({ id, version }, changes));
  await scope.audit({ userId: caller.id, action: 'ACTUALIZAR', entityId: id, detail: summary(promotion) });
  return promotion;
}

async function setPromotionActive({ promotions, audit }: PromotionScope, caller: Caller, { id, isActive, version }: PromotionToggleInput): Promise<Promotion> {
  const promotion = orStale(await promotions.update({ id, version }, { isActive }));
  await audit({ userId: caller.id, action: isActive ? 'ACTUALIZAR' : 'ELIMINAR', entityId: id, detail: { name: promotion.name, action: isActive ? 'Reactivada' : 'Desactivada' } });
  return promotion;
}

async function removePromotion({ promotions, audit }: PromotionScope, caller: Caller, ref: PromotionDeleteInput): Promise<void> {
  const promotion = orStale(await promotions.findById(ref.id));
  if (!(await promotions.remove(ref))) throw new AppError('STALE_VERSION');
  await audit({ userId: caller.id, action: 'ELIMINAR', entityId: ref.id, detail: { ...summary(promotion), note: 'Eliminación permanente' } });
}

export function createPromotionService({ unitOfWork }: { unitOfWork: PromotionUnitOfWork }): PromotionService {
  return {
    list: () => unitOfWork.read.findAll(),
    create: (caller, input) => unitOfWork.run((scope) => createPromotion(scope, caller, input)),
    update: (caller, id, input) => unitOfWork.run((scope) => updatePromotion(scope, caller, { id, input })),
    setActive: (caller, input) => unitOfWork.run((scope) => setPromotionActive(scope, caller, input)),
    remove: (caller, input) => unitOfWork.run((scope) => removePromotion(scope, caller, input)),
  };
}

export const promotionService = createPromotionService({ unitOfWork: drizzlePromotionUnitOfWork });
