import { AppError } from '@/lib/errors';
import type { MenuItemDeleteInput, MenuItemInput, MenuItemToggleInput, MenuItemUpdateInput, MenuItemVisibilityInput } from '@/features/menu/domain/menu-item.schema';
import { itemPriceIssues } from '@/features/menu/domain/menu-prices';
import type { MenuItem } from '@/features/menu/repository/menu-item.repository';
import { drizzleMenuUnitOfWork, type MenuAuditEntry, type MenuScope, type MenuUnitOfWork } from '@/features/menu/repository/menu-unit-of-work';

type Caller = { id: string };

export type MenuItemService = {
  list(): Promise<MenuItem[]>;
  create(caller: Caller, input: MenuItemInput): Promise<MenuItem>;
  update(caller: Caller, id: string, input: MenuItemUpdateInput): Promise<MenuItem>;
  setActive(caller: Caller, input: MenuItemToggleInput): Promise<MenuItem>;
  setVisible(caller: Caller, input: MenuItemVisibilityInput): Promise<MenuItem>;
  remove(caller: Caller, input: MenuItemDeleteInput): Promise<void>;
};

const orStale = (item: MenuItem | null): MenuItem => {
  if (!item) throw new AppError('STALE_VERSION');
  return item;
};

const snapshotOf = (item: MenuItem): Record<string, unknown> => ({ group: item.group, name: item.name, unitCost: item.unitCost, price1: item.price1, price3: item.price3, price6: item.price6, price12: item.price12 });
type AuditFacts = { action: MenuAuditEntry['action']; item: MenuItem; detail: Record<string, unknown> };
const entry = (caller: Caller, { action, item, detail }: AuditFacts): MenuAuditEntry => ({ userId: caller.id, action, entity: 'MENU_ITEM', entityId: item.id, detail });

async function createItem({ items, audit }: MenuScope, caller: Caller, input: MenuItemInput): Promise<MenuItem> {
  if (await items.findByName(input.group, input.name)) throw new AppError('DUPLICATE');
  const item = await items.insert(input);
  await audit(entry(caller, { action: 'CREAR', item, detail: { ...snapshotOf(item), note: 'Nuevo producto' } }));
  return item;
}

async function updateItem({ items, audit }: MenuScope, caller: Caller, { id, input }: { id: string; input: MenuItemUpdateInput }): Promise<MenuItem> {
  const current = await items.findById(id);
  if (!current) throw new AppError('NOT_FOUND', { entity: 'producto' });
  if (itemPriceIssues(current.group, input.prices).length > 0) throw new AppError('VALIDATION');
  const sameName = await items.findByName(current.group, input.name);
  if (sameName && sameName.id !== id) throw new AppError('DUPLICATE');
  const { version, ...changes } = input;
  const item = orStale(await items.update({ id, version }, changes));
  await audit(entry(caller, { action: 'ACTUALIZAR', item, detail: snapshotOf(item) }));
  return item;
}

async function setItemActive({ items, audit }: MenuScope, caller: Caller, { id, isActive, version }: MenuItemToggleInput): Promise<MenuItem> {
  const item = orStale(await items.update({ id, version }, { isActive }));
  const detail = { group: item.group, name: item.name, active: isActive, action: isActive ? 'Reactivado' : 'Desactivado' };
  await audit(entry(caller, { action: isActive ? 'ACTUALIZAR' : 'ELIMINAR', item, detail }));
  return item;
}

async function setItemVisible({ items, audit }: MenuScope, caller: Caller, { id, isVisible, version }: MenuItemVisibilityInput): Promise<MenuItem> {
  const item = orStale(await items.update({ id, version }, { isVisible }));
  await audit(entry(caller, { action: 'ACTUALIZAR', item, detail: { group: item.group, name: item.name, visible: isVisible } }));
  return item;
}

async function removeItem({ items, audit }: MenuScope, caller: Caller, ref: MenuItemDeleteInput): Promise<void> {
  const item = orStale(await items.findById(ref.id));
  if (!(await items.remove(ref))) throw new AppError('STALE_VERSION');
  await audit(entry(caller, { action: 'ELIMINAR', item, detail: { ...snapshotOf(item), note: 'Eliminación permanente' } }));
}

export function createMenuItemService({ unitOfWork }: { unitOfWork: MenuUnitOfWork }): MenuItemService {
  return {
    list: () => unitOfWork.read.items.findAll(),
    create: (caller, input) => unitOfWork.run((scope) => createItem(scope, caller, input)),
    update: (caller, id, input) => unitOfWork.run((scope) => updateItem(scope, caller, { id, input })),
    setActive: (caller, input) => unitOfWork.run((scope) => setItemActive(scope, caller, input)),
    setVisible: (caller, input) => unitOfWork.run((scope) => setItemVisible(scope, caller, input)),
    remove: (caller, input) => unitOfWork.run((scope) => removeItem(scope, caller, input)),
  };
}

export const menuItemService = createMenuItemService({ unitOfWork: drizzleMenuUnitOfWork });
