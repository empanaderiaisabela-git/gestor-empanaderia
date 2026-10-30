import type { MenuGroup } from '@/features/menu/domain/menu-groups';
import type { OrderLine } from './order-line';

export type Usage = Map<string, number>;
export type BaseOf = (group: MenuGroup) => string | null;
type Stocked = { id: string; stock: number };
export type StockedBaseOf = (group: MenuGroup) => Stocked | null;
type StockBook = { itemOf: (menuItemId: string) => (Stocked & { group: MenuGroup }) | undefined; baseOf: StockedBaseOf };

export function lineUsage(line: OrderLine): Usage {
  return new Map(line.flavors.map((flavor) => [flavor.menuItemId, flavor.units * line.quantity]));
}

export function stockUsage(lines: OrderLine[], baseOf: BaseOf): Usage {
  const total: Usage = new Map();
  for (const line of lines) {
    const base = baseOf(line.group);
    for (const [menuItemId, units] of lineUsage(line)) {
      const key = base ?? menuItemId;
      total.set(key, (total.get(key) ?? 0) + units);
    }
  }
  return total;
}

export function orderUsage(lines: OrderLine[]): Usage {
  return stockUsage(lines, () => null);
}

export function availableStock(item: Stocked & { group: MenuGroup }, lines: OrderLine[], baseOf: StockedBaseOf = () => null): number {
  const stocked = baseOf(item.group) ?? item;
  return stocked.stock - (stockUsage(lines, (group) => baseOf(group)?.id ?? null).get(stocked.id) ?? 0);
}

export function canAddOne(line: OrderLine, lines: OrderLine[], { itemOf, baseOf }: StockBook): boolean {
  const needed = stockUsage([{ ...line, quantity: 1 }], (group) => baseOf(group)?.id ?? null);
  return line.flavors.every(({ menuItemId }) => {
    const item = itemOf(menuItemId);
    return item !== undefined && availableStock(item, lines, baseOf) >= (needed.get(baseOf(item.group)?.id ?? item.id) ?? 0);
  });
}

export function lineCost(line: OrderLine, costOf: (menuItemId: string) => number): number {
  const cost = [...lineUsage(line)].reduce((sum, [menuItemId, units]) => sum + units * costOf(menuItemId), 0);
  return Math.round((cost + Number.EPSILON) * 100) / 100;
}
