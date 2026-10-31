import { AppError } from '@/lib/errors';
import type { MenuItemDeleteInput, MenuItemInput, MenuItemToggleInput, MenuItemUpdateInput, MenuItemVisibilityInput } from '@/features/menu/domain/menu-item.schema';
import type { MenuItem } from '@/features/menu/repository/menu-item.repository';
import { isDrinkGroup } from '@/features/menu/domain/drink';
import { familyPricing, identityOf } from './menu-item-drink';
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

const notBase = (item: MenuItem | null): MenuItem | null => {
  if (item?.isBase) throw new AppError('VALIDATION');
  return item;
};

const snapshotOf = (item: MenuItem): Record<string, unknown> => ({ group: item.group, name: item.name, unitCost: item.unitCost, price1: item.price1, price3: item.price3, price6: item.price6, price12: item.price12 });
type AuditFacts = { action: MenuAuditEntry['action']; item: MenuItem; detail: Record<string, unknown> };
const entry = (caller: Caller, { action, item, detail }: AuditFacts): MenuAuditEntry => ({ userId: caller.id, action, entity: 'MENU_ITEM', entityId: item.id, detail });

async function createItem({ items, audit }: MenuScope, caller: Caller, input: MenuItemInput): Promise<MenuItem> {
  const { name, drink } = identityOf(input);
  if (await items.findByName(input.group, name)) throw new AppError('DUPLICATE');
  const item = await items.insert({ group: input.group, name, drink, ...(await familyPricing(items, { group: input.group, drink })) });
  await audit(entry(caller, { action: 'CREAR', item, detail: { ...snapshotOf(item), note: 'Nuevo producto' } }));
  return item;
}

async function updateItem({ items, audit }: MenuScope, caller: Caller, { id, input }: { id: string; input: MenuItemUpdateInput }): Promise<MenuItem> {
  const current = notBase(await items.findById(id));
  if (!current) throw new AppError('NOT_FOUND', { entity: 'el producto' });
  const { name, drink } = identityOf(input);
  if (Boolean(drink) !== isDrinkGroup(current.group)) throw new AppError('VALIDATION');
  const sameName = await items.findByName(current.group, name);
  if (sameName && sameName.id !== id) throw new AppError('DUPLICATE');
  const pricing = await familyPricing(items, { group: current.group, drink, exceptId: id });
  const item = orStale(await items.update({ id, version: input.version }, { name, drink, ...pricing }));
  await audit(entry(caller, { action: 'ACTUALIZAR', item, detail: snapshotOf(item) }));
  return item;
}

async function setItemActive({ items, audit }: MenuScope, caller: Caller, { id, isActive, version }: MenuItemToggleInput): Promise<MenuItem> {
  notBase(await items.findById(id));
  const item = orStale(await items.update({ id, version }, { isActive }));
  const detail = { group: item.group, name: item.name, active: isActive, action: isActive ? 'Reactivado' : 'Desactivado' };
  await audit(entry(caller, { action: isActive ? 'ACTUALIZAR' : 'ELIMINAR', item, detail }));
  return item;
}

async function setItemVisible({ items, audit }: MenuScope, caller: Caller, { id, isVisible, version }: MenuItemVisibilityInput): Promise<MenuItem> {
  notBase(await items.findById(id));
  const item = orStale(await items.update({ id, version }, { isVisible }));
  await audit(entry(caller, { action: 'ACTUALIZAR', item, detail: { group: item.group, name: item.name, visible: isVisible } }));
  return item;
}

async function removeItem({ items, audit }: MenuScope, caller: Caller, ref: MenuItemDeleteInput): Promise<void> {
  const item = orStale(notBase(await items.findById(ref.id)));
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
