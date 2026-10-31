import type { MenuPrices } from '@/features/menu/domain/menu-prices';
import { increased, type PriceIncreaseInput } from '@/features/stock/domain/stock-increase';
import type { StockChange, StockItem } from '@/features/stock/repository/stock.repository';
import type { StockScope } from '@/features/stock/repository/stock-unit-of-work';
import { familyOf } from './stock-family';
import { lockedItem, saved } from './stock-locks';

type Caller = { id: string };
export type IncreaseResult = { updated: number };

const OPTIONAL_PRICES = ['price3', 'price6', 'price12'] as const;

function pricesUp(item: StockItem, rate: number): MenuPrices {
  const extra = OPTIONAL_PRICES.flatMap((field) => {
    const value = item[field];
    return value === null ? [] : [[field, increased(Number(value), rate)]];
  });
  return { price1: increased(Number(item.price1), rate), ...Object.fromEntries(extra) };
}

function changeOf(item: StockItem, { costPercent, pricePercent }: PriceIncreaseInput): StockChange {
  const cost = costPercent !== null && item.unitCost !== null ? { unitCost: increased(Number(item.unitCost), costPercent) } : {};
  return { ...cost, ...(pricePercent !== null && item.price1 !== null ? { prices: pricesUp(item, pricePercent) } : {}) };
}

async function lockAll(scope: StockScope, ids: string[]): Promise<StockItem[]> {
  const items = new Map<string, StockItem>();
  for (const id of [...new Set(ids)].sort()) items.set(id, await lockedItem(scope, id));
  for (const item of [...items.values()]) {
    for (const member of await familyOf(scope, item)) if (!items.has(member.id)) items.set(member.id, member);
  }
  return [...items.values()].filter((item) => !item.isBase);
}

const pricing = ({ unitCost, price1, price3, price6, price12 }: StockItem): Record<string, unknown> => ({ unitCost, price1, price3, price6, price12 });

export async function applyIncrease(scope: StockScope, caller: Caller, input: PriceIncreaseInput): Promise<IncreaseResult> {
  let updated = 0;
  for (const item of await lockAll(scope, input.menuItemIds)) {
    const change = changeOf(item, input);
    if (change.unitCost === undefined && !change.prices) continue;
    const before = pricing(item);
    const after = saved(await scope.stock.saveItem(item, change));
    const detail = { name: item.name, costPercent: input.costPercent, pricePercent: input.pricePercent, before, after: pricing(after) };
    await scope.audit({ userId: caller.id, action: 'ACTUALIZAR', entity: 'MENU_ITEM', entityId: item.id, detail });
    updated += 1;
  }
  return { updated };
}
