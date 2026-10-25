import { AppError } from '@/lib/errors';
import type { ProviderDeleteInput, ProviderInput, ProviderToggleInput, ProviderUpdateInput } from '@/features/provider/domain/provider.schema';
import type { Provider } from '@/features/provider/repository/provider.repository';
import { drizzleProviderUnitOfWork, type ProviderScope, type ProviderUnitOfWork } from '@/features/provider/repository/provider-unit-of-work';

type Caller = { id: string };
type CreateResult = { provider: Provider; reactivated: boolean };

export type ProviderService = {
  list(): Promise<Provider[]>;
  create(caller: Caller, input: ProviderInput): Promise<CreateResult>;
  update(caller: Caller, id: string, input: ProviderUpdateInput): Promise<Provider>;
  setActive(caller: Caller, input: ProviderToggleInput): Promise<Provider>;
  remove(caller: Caller, input: ProviderDeleteInput): Promise<void>;
};

const orStale = (provider: Provider | null): Provider => {
  if (!provider) throw new AppError('STALE_VERSION');
  return provider;
};

async function createProvider({ providers, audit }: ProviderScope, caller: Caller, input: ProviderInput): Promise<CreateResult> {
  const existing = await providers.findByName(input.name);
  if (existing?.isActive) throw new AppError('DUPLICATE');
  const provider = existing ? orStale(await providers.update(existing, { ...input, isActive: true })) : await providers.insert(input);
  const note = existing ? 'Proveedor reactivado' : 'Nuevo registro';
  await audit({ userId: caller.id, action: 'CREAR', entityId: provider.id, detail: { name: provider.name, note } });
  return { provider, reactivated: Boolean(existing) };
}

async function updateProvider({ providers, audit }: ProviderScope, caller: Caller, { id, input }: { id: string; input: ProviderUpdateInput }): Promise<Provider> {
  const { version, ...changes } = input;
  const sameName = changes.name === undefined ? null : await providers.findByName(changes.name);
  if (sameName && sameName.id !== id) throw new AppError('DUPLICATE');
  const provider = orStale(await providers.update({ id, version }, changes));
  await audit({ userId: caller.id, action: 'ACTUALIZAR', entityId: id, detail: { name: provider.name, phone: provider.phone, email: provider.email } });
  return provider;
}

async function setProviderActive({ providers, audit }: ProviderScope, caller: Caller, { id, isActive, version }: ProviderToggleInput): Promise<Provider> {
  const provider = orStale(await providers.update({ id, version }, { isActive }));
  const detail = { name: provider.name, active: isActive, action: isActive ? 'Reactivado' : 'Desactivado' };
  await audit({ userId: caller.id, action: isActive ? 'ACTUALIZAR' : 'ELIMINAR', entityId: id, detail });
  return provider;
}

async function removeProvider({ providers, audit }: ProviderScope, caller: Caller, ref: ProviderDeleteInput): Promise<void> {
  if (await providers.hasStockEntries(ref.id)) throw new AppError('HAS_RELATIONS');
  const provider = orStale(await providers.findById(ref.id));
  if (!(await providers.remove(ref))) throw new AppError('STALE_VERSION');
  const detail = { name: provider.name, phone: provider.phone, email: provider.email, note: 'Eliminación permanente' };
  await audit({ userId: caller.id, action: 'ELIMINAR', entityId: ref.id, detail });
}

export function createProviderService({ unitOfWork }: { unitOfWork: ProviderUnitOfWork }): ProviderService {
  return {
    list: () => unitOfWork.read.findAll(),
    create: (caller, input) => unitOfWork.run((scope) => createProvider(scope, caller, input)),
    update: (caller, id, input) => unitOfWork.run((scope) => updateProvider(scope, caller, { id, input })),
    setActive: (caller, input) => unitOfWork.run((scope) => setProviderActive(scope, caller, input)),
    remove: (caller, input) => unitOfWork.run((scope) => removeProvider(scope, caller, input)),
  };
}

export const providerService = createProviderService({ unitOfWork: drizzleProviderUnitOfWork });
