import { fixedDrinkLabel, sizeOf } from '@/features/menu/domain/drink';
import type { MenuGroup } from '@/features/menu/domain/menu-groups';
import type { MenuItemDef } from '@/features/menu/domain/menu-item.schema';

export type DrinkOption = Pick<MenuItemDef, 'id' | 'group' | 'name' | 'isActive' | 'drinkName' | 'drinkSize' | 'liters'>;
export type DrinkFamilies = { value: string; options: { id: string; label: string }[] };
type Family = { id: string; label: string; visible: boolean };

function keyOf(drink: DrinkOption): string {
  const size = sizeOf(drink);
  return drink.drinkName !== null && size !== null ? `${drink.drinkName}|${size}` : drink.id;
}

export function drinkFamilies(drinks: readonly DrinkOption[], group: MenuGroup, selected: string): DrinkFamilies {
  const families = new Map<string, Family>();
  for (const drink of drinks.filter((candidate) => candidate.group === group)) {
    const key = keyOf(drink);
    const family = families.get(key) ?? { id: drink.id, label: fixedDrinkLabel({ menuItemName: drink.name, drinkName: drink.drinkName, drinkSize: sizeOf(drink) }), visible: false };
    families.set(key, { ...family, visible: family.visible || drink.isActive || drink.id === selected });
  }
  const chosen = drinks.find((drink) => drink.id === selected);
  const value = chosen ? (families.get(keyOf(chosen))?.id ?? selected) : selected;
  return { value, options: [...families.values()].filter((family) => family.visible).map(({ id, label }) => ({ id, label })) };
}
