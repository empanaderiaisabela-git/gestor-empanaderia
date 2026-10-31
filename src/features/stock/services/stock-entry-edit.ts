import { AppError } from '@/lib/errors';
import type { StockEntryUpdateInput } from '@/features/stock/domain/stock.schema';
import type { StockEntry, StockItem } from '@/features/stock/repository/stock.repository';
import type { StockScope } from '@/features/stock/repository/stock-unit-of-work';
import { planEntry } from './stock-entry-plan';
import { lockedItem, saved } from './stock-locks';

type Caller = { id: string };
export type EntryEditResult = { item: StockItem; entry: StockEntry };

async function lockedEntry({ stock }: StockScope, { id, version }: StockEntryUpdateInput): Promise<StockEntry> {
  const entry = await stock.lockEntry(id);
  if (!entry) throw new AppError('NOT_FOUND', { entity: 'el ingreso' });
  if (entry.version !== version) throw new AppError('STALE_VERSION');
  return entry;
}

async function lockBoth(scope: StockScope, fromId: string, toId: string): Promise<[StockItem, StockItem]> {
  if (fromId === toId) {
    const item = await lockedItem(scope, fromId);
    return [item, item];
  }
  const ordered = [fromId, toId].sort();
  const [first, second] = [await lockedItem(scope, ordered[0]), await lockedItem(scope, ordered[1])];
  return first.id === fromId ? [first, second] : [second, first];
}

function stockAfter(item: StockItem, change: number): number {
  const next = Number(item.stock) + change;
  if (next < 0) throw new AppError('INSUFFICIENT_STOCK', { entity: item.name });
  return next;
}

const sideOf = (item: StockItem, entry: StockEntry): Record<string, unknown> => ({ name: item.name, quantity: entry.quantity, unitCost: Number(entry.unitCost), providerId: entry.providerId });

export async function updateEntry(scope: StockScope, caller: Caller, input: StockEntryUpdateInput): Promise<EntryEditResult> {
  const before = await lockedEntry(scope, input);
  const [from, to] = await lockBoth(scope, before.menuItemId, input.menuItemId);
  const plan = planEntry(to, input);
  const moved = from.id !== to.id;
  const fromStock = moved ? stockAfter(from, -before.quantity) : null;
  const toStock = stockAfter(to, moved ? input.quantity : input.quantity - before.quantity);
  const entry = saved(await scope.stock.updateEntry(before, { menuItemId: to.id, quantity: input.quantity, unitCost: plan.unitCost, providerId: input.providerId ?? null }));
  const costChanged = moved || plan.unitCost !== Number(before.unitCost);
  const isLatest = (await scope.stock.latestEntryId(to.id)) === entry.id;
  if (fromStock !== null) saved(await scope.stock.saveItem(from, { stock: fromStock }));
  const item = saved(await scope.stock.saveItem(to, { stock: toStock, unitCost: costChanged && isLatest ? plan.itemCost : undefined, prices: plan.itemPrices, minStock: input.minStock }));
  const detail = { before: sideOf(from, before), after: sideOf(to, entry), stockAfter: Number(item.stock) };
  await scope.audit({ userId: caller.id, action: 'ACTUALIZAR', entity: 'STOCK_ENTRY', entityId: entry.id, detail });
  return { item, entry };
}
