import type { OrderLine } from './order-line';

export type Usage = Map<string, number>;

export function lineUsage(line: OrderLine): Usage {
  return new Map(line.flavors.map((flavor) => [flavor.menuItemId, flavor.units * line.quantity]));
}

export function orderUsage(lines: OrderLine[]): Usage {
  const total: Usage = new Map();
  for (const line of lines) {
    for (const [menuItemId, units] of lineUsage(line)) total.set(menuItemId, (total.get(menuItemId) ?? 0) + units);
  }
  return total;
}

export function availableStock({ id, stock }: { id: string; stock: number }, lines: OrderLine[]): number {
  return stock - (orderUsage(lines).get(id) ?? 0);
}

export function lineCost(line: OrderLine, costOf: (menuItemId: string) => number): number {
  const cost = [...lineUsage(line)].reduce((sum, [menuItemId, units]) => sum + units * costOf(menuItemId), 0);
  return Math.round((cost + Number.EPSILON) * 100) / 100;
}
