import { AppError } from '@/lib/errors';
import { hasBase } from '@/features/menu/domain/menu-groups';
import type { StockEntryInput, StockLossInput, StockPricingInput } from '@/features/stock/domain/stock.schema';
import type { EntryView, StockEntry, StockItem, StockLoss } from '@/features/stock/repository/stock.repository';
import { drizzleStockUnitOfWork, type StockScope, type StockUnitOfWork } from '@/features/stock/repository/stock-unit-of-work';
import { planEntry } from './stock-entry-plan';
import { type PricingResult, setPricing } from './stock-pricing';

type Caller = { id: string };
export type EntryResult = { item: StockItem; entry: StockEntry };
export type LossResult = { item: StockItem; loss: StockLoss };

export type StockService = {
  registerEntry(caller: Caller, input: StockEntryInput): Promise<EntryResult>;
  registerLoss(caller: Caller, input: StockLossInput): Promise<LossResult>;
  setPricing(caller: Caller, input: StockPricingInput): Promise<PricingResult>;
  entriesOf(menuItemId: string): Promise<EntryView[]>;
};

async function lockedItem({ stock }: StockScope, id: string): Promise<StockItem> {
  const item = await stock.lockItem(id);
  if (!item) throw new AppError('NOT_FOUND', { entity: 'el producto' });
  return item;
}

function saved(item: StockItem | null): StockItem {
  if (!item) throw new AppError('STALE_VERSION');
  return item;
}

async function registerEntry(scope: StockScope, caller: Caller, input: StockEntryInput): Promise<EntryResult> {
  const current = await lockedItem(scope, input.menuItemId);
  const { unitCost, itemCost, itemPrices } = planEntry(current, input);
  const stockBefore = Number(current.stock);
  const item = saved(await scope.stock.saveItem(current, { stock: stockBefore + input.quantity, unitCost: itemCost, prices: itemPrices }));
  const entry = await scope.stock.insertEntry({ menuItemId: current.id, quantity: input.quantity, unitCost, providerId: input.providerId ?? null, userId: caller.id });
  const detail = { name: current.name, quantity: input.quantity, unitCost, ...(input.prices ? { prices: input.prices } : {}), stockBefore, stockAfter: Number(item.stock) };
  await scope.audit({ userId: caller.id, action: 'CREAR', entity: 'STOCK_ENTRY', entityId: entry.id, detail });
  return { item, entry };
}

async function registerLoss(scope: StockScope, caller: Caller, input: StockLossInput): Promise<LossResult> {
  const current = await lockedItem(scope, input.menuItemId);
  if (hasBase(current.group) && !current.isBase) throw new AppError('VALIDATION');
  const stockBefore = Number(current.stock);
  if (input.quantity > stockBefore) throw new AppError('INSUFFICIENT_STOCK', { entity: current.name });
  const unitCost = Number(current.unitCost);
  const item = saved(await scope.stock.saveItem(current, { stock: stockBefore - input.quantity }));
  const loss = await scope.stock.insertLoss({ menuItemId: current.id, quantity: input.quantity, unitCost, reason: input.reason, userId: caller.id });
  const detail = { name: current.name, quantity: input.quantity, reason: input.reason, unitCost, stockBefore, stockAfter: Number(item.stock) };
  await scope.audit({ userId: caller.id, action: 'PÉRDIDA', entity: 'STOCK_LOSS', entityId: loss.id, detail });
  return { item, loss };
}

export function createStockService({ unitOfWork }: { unitOfWork: StockUnitOfWork }): StockService {
  return {
    registerEntry: (caller, input) => unitOfWork.run((scope) => registerEntry(scope, caller, input)),
    registerLoss: (caller, input) => unitOfWork.run((scope) => registerLoss(scope, caller, input)),
    setPricing: (caller, input) => unitOfWork.run((scope) => setPricing(scope, caller, input)),
    entriesOf: (menuItemId) => unitOfWork.read.entriesOf(menuItemId),
  };
}

export const stockService = createStockService({ unitOfWork: drizzleStockUnitOfWork });
