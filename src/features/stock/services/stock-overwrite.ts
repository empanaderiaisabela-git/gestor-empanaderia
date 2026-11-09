import { AppError } from '@/lib/errors';
import type { StockOverwriteInput } from '@/features/stock/domain/stock.schema';
import type { StockEntry, StockItem } from '@/features/stock/repository/stock.repository';
import type { StockScope } from '@/features/stock/repository/stock-unit-of-work';
import { type EntryPlan, planEntry } from './stock-entry-plan';
import { familyOf, inherited, inheritedPrices, shareWithFamily } from './stock-family';
import { lockedItem, saved } from './stock-locks';

type Caller = { id: string };
export type OverwriteResult = { item: StockItem; entry: StockEntry | null };
type SavedEntry = { entry: StockEntry | null; itemCost?: number };
type EntryChange = { plan: EntryPlan; providerId?: string | null };

async function lockedEntry({ stock }: StockScope, input: StockOverwriteInput): Promise<StockEntry | null> {
  if (!input.entry) {
    if (input.providerId) throw new AppError('VALIDATION');
    return null;
  }
  const entry = await stock.lockEntry(input.entry.id);
  if (!entry) throw new AppError('NOT_FOUND', { entity: 'el ingreso' });
  if (entry.version !== input.entry.version) throw new AppError('STALE_VERSION');
  if (entry.menuItemId !== input.menuItemId) throw new AppError('VALIDATION');
  return entry;
}

async function lockedCurrent(scope: StockScope, input: StockOverwriteInput): Promise<StockItem> {
  const item = await lockedItem(scope, input.menuItemId);
  if (item.version !== input.itemVersion) throw new AppError('STALE_VERSION');
  return item;
}

async function savedEntry(scope: StockScope, before: StockEntry | null, { plan, providerId }: EntryChange): Promise<SavedEntry> {
  if (!before) return { entry: null, itemCost: plan.itemCost };
  const change = { menuItemId: before.menuItemId, quantity: before.quantity, unitCost: plan.unitCost, providerId: providerId ?? null };
  const entry = saved(await scope.stock.updateEntry(before, change));
  const isLatest = (await scope.stock.latestEntryId(before.menuItemId)) === before.id;
  return { entry, itemCost: isLatest && plan.unitCost !== Number(before.unitCost) ? plan.itemCost : undefined };
}

const sideOf = (entry: StockEntry): Record<string, unknown> => ({ quantity: entry.quantity, unitCost: Number(entry.unitCost), providerId: entry.providerId });

export async function overwriteStock(scope: StockScope, caller: Caller, input: StockOverwriteInput): Promise<OverwriteResult> {
  const before = await lockedEntry(scope, input);
  const current = await lockedCurrent(scope, input);
  const stockBefore = Number(current.stock);
  const family = await familyOf(scope, current);
  const source = inherited(current, family);
  const plan = planEntry(source, input);
  const { entry, itemCost } = await savedEntry(scope, before, { plan, providerId: input.providerId });
  const prices = plan.itemPrices ?? inheritedPrices(current, source);
  const item = saved(await scope.stock.saveItem(current, { stock: input.stock, unitCost: itemCost, prices, minStock: input.minStock }));
  await shareWithFamily(scope, family, { unitCost: itemCost, prices: plan.itemPrices });
  const changes = before && entry ? { entry: { before: sideOf(before), after: sideOf(entry) } } : {};
  const detail = { name: current.name, stockBefore, stockAfter: Number(item.stock), ...changes };
  await scope.audit({ userId: caller.id, action: 'ACTUALIZAR', entity: 'MENU_ITEM', entityId: item.id, detail });
  return { item, entry };
}
