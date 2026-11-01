import type { MenuItemDef } from '@/features/menu/domain/menu-item.schema';
import { matchesAllWords } from '@/lib/utils';
import { type OrderLine, presentationOf } from './order-line';

export function flavorPrice(line: OrderLine, item: MenuItemDef): number | null {
  return item[presentationOf(line)?.priceField ?? 'price1'];
}

const byPrice =
  (line: OrderLine) =>
  (a: MenuItemDef, b: MenuItemDef): number =>
    (flavorPrice(line, a) ?? Infinity) - (flavorPrice(line, b) ?? Infinity) || a.name.localeCompare(b.name, 'es');

export function visibleFlavors(items: readonly MenuItemDef[], line: OrderLine, search: string): MenuItemDef[] {
  return items.filter((item) => matchesAllWords(item.name, search)).sort(byPrice(line));
}
