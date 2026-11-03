import { AppError } from '@/lib/errors';
import type { ShippingDeleteInput, ShippingInput, ShippingToggleInput, ShippingUpdateInput } from '@/features/shipping/domain/shipping.schema';
import type { Shipping } from '@/features/shipping/repository/shipping.repository';
import { drizzleShippingUnitOfWork, type ShippingScope, type ShippingUnitOfWork } from '@/features/shipping/repository/shipping-unit-of-work';

type Caller = { id: string };

export type ShippingService = {
  list(): Promise<Shipping[]>;
  create(caller: Caller, input: ShippingInput): Promise<Shipping>;
  update(caller: Caller, id: string, input: ShippingUpdateInput): Promise<Shipping>;
  setActive(caller: Caller, input: ShippingToggleInput): Promise<Shipping>;
  remove(caller: Caller, input: ShippingDeleteInput): Promise<void>;
};

const orStale = (shipping: Shipping | null): Shipping => {
  if (!shipping) throw new AppError('STALE_VERSION');
  return shipping;
};

const summary = (shipping: Shipping): Record<string, unknown> => ({ name: shipping.title, detail: shipping.detail, amount: Number(shipping.amount) });

async function assertFreeTitle({ shippings }: ShippingScope, title: string, ownId: string | null): Promise<void> {
  const sameTitle = await shippings.findByTitle(title);
  if (sameTitle && sameTitle.id !== ownId) throw new AppError('DUPLICATE');
}

async function createShipping(scope: ShippingScope, caller: Caller, input: ShippingInput): Promise<Shipping> {
  await assertFreeTitle(scope, input.title, null);
  const shipping = await scope.shippings.insert(input);
  await scope.audit({ userId: caller.id, action: 'CREAR', entityId: shipping.id, detail: summary(shipping) });
  return shipping;
}

async function updateShipping(scope: ShippingScope, caller: Caller, { id, input }: { id: string; input: ShippingUpdateInput }): Promise<Shipping> {
  const { version, ...changes } = input;
  await assertFreeTitle(scope, changes.title, id);
  const shipping = orStale(await scope.shippings.update({ id, version }, changes));
  await scope.audit({ userId: caller.id, action: 'ACTUALIZAR', entityId: id, detail: summary(shipping) });
  return shipping;
}

async function setShippingActive({ shippings, audit }: ShippingScope, caller: Caller, { id, isActive, version }: ShippingToggleInput): Promise<Shipping> {
  const shipping = orStale(await shippings.update({ id, version }, { isActive }));
  await audit({ userId: caller.id, action: isActive ? 'ACTUALIZAR' : 'ELIMINAR', entityId: id, detail: { name: shipping.title, action: isActive ? 'Reactivado' : 'Desactivado' } });
  return shipping;
}

async function removeShipping({ shippings, audit }: ShippingScope, caller: Caller, ref: ShippingDeleteInput): Promise<void> {
  if (await shippings.hasSales(ref.id)) throw new AppError('HAS_RELATIONS');
  const shipping = orStale(await shippings.findById(ref.id));
  if (!(await shippings.remove(ref))) throw new AppError('STALE_VERSION');
  await audit({ userId: caller.id, action: 'ELIMINAR', entityId: ref.id, detail: { ...summary(shipping), note: 'Eliminación permanente' } });
}

export function createShippingService({ unitOfWork }: { unitOfWork: ShippingUnitOfWork }): ShippingService {
  return {
    list: () => unitOfWork.read.findAll(),
    create: (caller, input) => unitOfWork.run((scope) => createShipping(scope, caller, input)),
    update: (caller, id, input) => unitOfWork.run((scope) => updateShipping(scope, caller, { id, input })),
    setActive: (caller, input) => unitOfWork.run((scope) => setShippingActive(scope, caller, input)),
    remove: (caller, input) => unitOfWork.run((scope) => removeShipping(scope, caller, input)),
  };
}

export const shippingService = createShippingService({ unitOfWork: drizzleShippingUnitOfWork });
