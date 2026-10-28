import { AppError } from '@/lib/errors';
import { type MenuPrices, priceIssues } from '@/features/menu/domain/menu-prices';
import type { StockEntryInput } from '@/features/stock/domain/stock.schema';
import type { StockItem } from '@/features/stock/repository/stock.repository';

export type EntryPlan = { unitCost: number; itemPrices?: MenuPrices };

function costOf(item: StockItem, input: StockEntryInput): number {
  const cost = input.unitCost ?? (item.unitCost === null ? null : Number(item.unitCost));
  if (cost === null) throw new AppError('MISSING_COST');
  return cost;
}

export function planEntry(item: StockItem, input: StockEntryInput): EntryPlan {
  const unitCost = costOf(item, input);
  const { prices } = input;
  if (prices && priceIssues(item.group, prices).length > 0) throw new AppError('VALIDATION');
  if (!prices && item.price1 === null) throw new AppError('MISSING_PRICE');
  return { unitCost, itemPrices: prices };
}
