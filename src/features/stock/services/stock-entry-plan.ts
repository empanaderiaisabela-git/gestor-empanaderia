import { AppError } from '@/lib/errors';
import { hasBase } from '@/features/menu/domain/menu-groups';
import { type MenuPrices, priceIssues } from '@/features/menu/domain/menu-prices';
import type { StockEntryInput } from '@/features/stock/domain/stock.schema';
import type { StockItem } from '@/features/stock/repository/stock.repository';

export type EntryPlan = { unitCost: number; itemCost?: number; itemPrices?: MenuPrices };

function costOf(item: StockItem, input: StockEntryInput): number {
  const cost = input.unitCost ?? (item.unitCost === null ? null : Number(item.unitCost));
  if (cost === null) throw new AppError('MISSING_COST');
  return cost;
}

function basePlan(input: StockEntryInput): EntryPlan {
  if (input.unitCost !== undefined || input.prices) throw new AppError('VALIDATION');
  return { unitCost: 0 };
}

export function planEntry(item: StockItem, input: StockEntryInput): EntryPlan {
  if (item.isBase) return basePlan(input);
  if (hasBase(item.group)) throw new AppError('VALIDATION');
  const unitCost = costOf(item, input);
  const { prices } = input;
  if (prices && priceIssues(item.group, prices).length > 0) throw new AppError('VALIDATION');
  if (!prices && item.price1 === null) throw new AppError('MISSING_PRICE');
  return { unitCost, itemCost: unitCost, itemPrices: prices };
}
